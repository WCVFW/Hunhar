// Mobile number verification for sign-up.
// The server decides the provider (GET /api/v1/auth/mobile-otp/config):
//   SMS      -> the server sends the code with Fast2SMS and checks it (authApi.sendMobileOtp / verifyMobileOtp)
//   FIREBASE -> Firebase Authentication sends the SMS from the browser and checks the code; the server then verifies
//               Firebase's ID token (authApi.verifyFirebaseMobile). Firebase is loaded only when it is used.
import type { ConfirmationResult, RecaptchaVerifier, Auth } from 'firebase/auth'
import { authApi, type MobileOtpConfig } from './api'

let configPromise: Promise<MobileOtpConfig> | null = null
let auth: Auth | null = null
let verifier: RecaptchaVerifier | null = null
let confirmation: ConfirmationResult | null = null

function getConfig(): Promise<MobileOtpConfig> {
  if (!configPromise) {
    configPromise = authApi.mobileOtpConfig().catch((e) => {
      configPromise = null
      throw e
    })
  }
  return configPromise
}

async function firebaseAuth(cfg: NonNullable<MobileOtpConfig['firebase']>): Promise<Auth> {
  if (auth) return auth
  const { initializeApp, getApps } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')
  const app = getApps().find((a) => a.name === 'hunhar-phone') ?? initializeApp(cfg, 'hunhar-phone')
  auth = getAuth(app)
  auth.languageCode = 'en'
  return auth
}

function recaptchaContainer(): HTMLElement {
  let el = document.getElementById('hunhar-recaptcha')
  if (!el) {
    el = document.createElement('div')
    el.id = 'hunhar-recaptcha'
    document.body.appendChild(el)
  }
  return el
}

function resetVerifier() {
  try {
    verifier?.clear()
  } catch {
    /* already cleared */
  }
  verifier = null
  const el = document.getElementById('hunhar-recaptcha')
  if (el) el.innerHTML = ''
}

function firebaseMessage(e: unknown, fallback: string): string {
  const code = (e as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Enter a valid 10-digit Indian mobile number.'
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'auth/invalid-verification-code':
      return 'Incorrect code. Please check the SMS and try again.'
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'This code has expired. Please request a new code.'
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
      return 'Security check failed. Please refresh the page and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    case 'auth/operation-not-allowed':
    case 'auth/unauthorized-domain':
    case 'auth/billing-not-enabled':
    case 'auth/invalid-api-key':
      return 'Mobile verification is temporarily unavailable. Please try again later.'
    default:
      return (e as Error)?.message && !code ? (e as Error).message : fallback
  }
}

/** Sends a 6-digit code to +91 <mobile>. */
export async function sendPhoneOtp(mobile: string): Promise<void> {
  const cfg = await getConfig()
  if (cfg.provider !== 'FIREBASE' || !cfg.firebase) {
    await authApi.sendMobileOtp(mobile)
    return
  }
  try {
    const a = await firebaseAuth(cfg.firebase)
    const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
    if (!verifier) verifier = new RecaptchaVerifier(a, recaptchaContainer(), { size: 'invisible' })
    confirmation = await signInWithPhoneNumber(a, `+91${mobile}`, verifier)
  } catch (e) {
    resetVerifier()
    confirmation = null
    console.warn('Firebase phone OTP send failed', (e as { code?: string })?.code)
    throw new Error(firebaseMessage(e, 'Could not send the SMS. Please try again.'))
  }
}

/** Checks the code the user typed; on success the server records the number as verified for sign-up. */
export async function verifyPhoneOtp(mobile: string, code: string): Promise<void> {
  const cfg = await getConfig()
  if (cfg.provider !== 'FIREBASE' || !cfg.firebase) {
    await authApi.verifyMobileOtp(mobile, code)
    return
  }
  if (!confirmation) throw new Error('Please request a new code.')
  let idToken: string
  try {
    const cred = await confirmation.confirm(code)
    idToken = await cred.user.getIdToken()
  } catch (e) {
    throw new Error(firebaseMessage(e, 'Incorrect code. Please try again.'))
  }
  await authApi.verifyFirebaseMobile(idToken)
  confirmation = null
  // The Firebase session is only used to prove the number; Hunhar keeps its own login
  try {
    const { signOut } = await import('firebase/auth')
    if (auth) await signOut(auth)
  } catch {
    /* ignore */
  }
}
