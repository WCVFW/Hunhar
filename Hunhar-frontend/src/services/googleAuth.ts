/**
 * "Continue with Google" using Google Identity Services' popup (token client), so the
 * page keeps its own button design. The access token is verified by the backend.
 */
import { authApi } from './api'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            prompt?: string
            callback: (res: { access_token?: string; error?: string; error_description?: string }) => void
            error_callback?: (err: { type: string; message?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export class GoogleCancelledError extends Error {}

let scriptPromise: Promise<void> | null = null
let clientIdPromise: Promise<string> | null = null

const loadScript = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => {
        scriptPromise = null
        reject(new Error('Could not load Google sign-in. Check your internet connection.'))
      }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

const loadClientId = () => {
  if (!clientIdPromise) {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    clientIdPromise = authApi.googleConfig().then((c) => {
      const resolved = c.clientId || envClientId
      if ((!c.enabled && !envClientId) || !resolved) {
        clientIdPromise = null
        throw new Error('Google sign-in is not set up yet. Please use email and password.')
      }
      return resolved
    }).catch((err) => {
      if (envClientId) return envClientId
      clientIdPromise = null
      throw err
    })
  }
  return clientIdPromise
}

/** Warm up the script and config so the popup opens instantly on click. */
export const preloadGoogle = () => {
  loadScript().catch(() => {})
  loadClientId().catch(() => {})
}

/** Opens Google's account chooser and resolves with an access token. Must be called from a click handler. */
export async function getGoogleAccessToken(): Promise<string> {
  const [clientId] = await Promise.all([loadClientId(), loadScript()])
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: (res) => {
        if (res.access_token) resolve(res.access_token)
        else reject(new Error(res.error_description || 'Google sign-in failed. Please try again.'))
      },
      error_callback: (err) => {
        if (err.type === 'popup_closed') reject(new GoogleCancelledError('Google sign-in was cancelled.'))
        else if (err.type === 'popup_failed_to_open') reject(new Error('Allow pop-ups for this site to continue with Google.'))
        else reject(new Error(err.message || 'Google sign-in failed. Please try again.'))
      },
    })
    client.requestAccessToken()
  })
}
