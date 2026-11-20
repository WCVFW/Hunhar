// KYC verification progress, kept on the server (GET /api/v1/kyc/me) and cached here per user so pages can read
// it synchronously. Pages listen for the 'hunhar_kyc_updated' event to re-render when fresh data arrives.
import { filesApi, kycApi, tokenStorage, type KycInfo } from './api'

type StepStatus = 'NOT_STARTED' | 'UNDER_REVIEW' | 'VERIFIED'

export interface KycVerificationState {
  emailVerified: boolean
  mobileVerified: boolean
  aadhaarStatus: StepStatus
  aadhaarDocumentName?: string
  aadhaarDocumentUrl?: string
  collegeIdStatus: StepStatus
  collegeIdDocumentName?: string
  collegeIdDocumentUrl?: string
  skillsStatus: StepStatus
  selectedSkills: string[]
  workSampleName?: string
  workSampleUrl?: string
  submittedAt?: string
  /** Overall status: NOT_SUBMITTED, PENDING_REVIEW, VERIFIED or REJECTED */
  kycStatus?: string
  /** Why the admin rejected the last submission (steps go back to NOT_STARTED) */
  rejectionReason?: string
}

const MAX_DOC_BYTES = 10 * 1024 * 1024
const FRESH_MS = 30_000
let lastFetch = 0
let inflight: Promise<KycVerificationState> | null = null

const cacheKey = () => `hunhar_kyc_cache_${tokenStorage.getUser()?.id || tokenStorage.getUser()?.userId || 'anon'}`

const emptyState = (): KycVerificationState => ({
  emailVerified: true,
  mobileVerified: true,
  aadhaarStatus: 'NOT_STARTED',
  collegeIdStatus: 'NOT_STARTED',
  skillsStatus: 'NOT_STARTED',
  selectedSkills: [],
})

// A rejected step shows as "not started" again so the freelancer can upload a new document
const step = (s?: string | null): StepStatus => (s === 'UNDER_REVIEW' || s === 'VERIFIED' ? s : 'NOT_STARTED')

function fromServer(k: KycInfo): KycVerificationState {
  return {
    emailVerified: k.emailVerified ?? true,
    mobileVerified: k.mobileVerified ?? false,
    aadhaarStatus: step(k.aadhaarStatus),
    aadhaarDocumentName: k.aadhaarDocumentName || undefined,
    aadhaarDocumentUrl: k.aadhaarDocumentUrl || undefined,
    collegeIdStatus: step(k.collegeIdStatus),
    collegeIdDocumentName: k.collegeIdDocumentName || undefined,
    collegeIdDocumentUrl: k.collegeIdDocumentUrl || undefined,
    skillsStatus: step(k.skillsStatus),
    selectedSkills: k.selectedSkills || [],
    workSampleName: k.workSampleName || undefined,
    workSampleUrl: k.workSampleUrl || undefined,
    submittedAt: k.submittedAt || undefined,
    kycStatus: k.kycStatus,
    rejectionReason: k.kycStatus === 'REJECTED' ? k.rejectionReason || undefined : undefined,
  }
}

function store(state: KycVerificationState): KycVerificationState {
  try {
    localStorage.setItem(cacheKey(), JSON.stringify(state))
  } catch {
    // storage unavailable: the in-memory flow still works
  }
  window.dispatchEvent(new CustomEvent('hunhar_kyc_updated', { detail: state }))
  return state
}

/** Loads the latest KYC progress from the server (deduplicated) and notifies listening pages. */
export function refreshKycState(): Promise<KycVerificationState> {
  if (!tokenStorage.getToken()) return Promise.resolve(emptyState())
  if (!inflight) {
    inflight = kycApi
      .me()
      .then((k) => {
        lastFetch = Date.now()
        return store(fromServer(k))
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Cached KYC progress for the signed-in user; refreshes from the server in the background when stale. */
export function getKycState(): KycVerificationState {
  if (Date.now() - lastFetch > FRESH_MS) refreshKycState().catch(() => {})
  try {
    const raw = localStorage.getItem(cacheKey())
    if (raw) return { ...emptyState(), ...JSON.parse(raw) }
  } catch {
    // fall through
  }
  return emptyState()
}

function checkFile(file: File) {
  if (file.size > MAX_DOC_BYTES) throw new Error(`"${file.name}" is larger than 10 MB. Please upload a smaller file.`)
}

/** Uploads the Aadhaar card or college ID and submits it for review. */
export async function submitKycDocument(type: 'AADHAAR' | 'COLLEGE_ID', file: File): Promise<KycVerificationState> {
  checkFile(file)
  const stored = await filesApi.upload(file)
  const k = await kycApi.submitDocument(type, stored.url, stored.originalName)
  lastFetch = Date.now()
  return store(fromServer(k))
}

/** Uploads a work sample (kept until the skills are submitted). */
export async function uploadWorkSample(file: File) {
  checkFile(file)
  return filesApi.upload(file)
}

/** Submits the chosen skills (and optional work sample) for review. */
export async function submitKycSkills(skills: string[], sample?: { url: string; name: string } | null): Promise<KycVerificationState> {
  const k = await kycApi.submitSkills(skills, sample?.url, sample?.name)
  lastFetch = Date.now()
  return store(fromServer(k))
}

export function calculateKycPercentage(state: KycVerificationState): number {
  let score = 0
  if (state.emailVerified) score += 20
  if (state.mobileVerified) score += 20
  if (state.aadhaarStatus === 'UNDER_REVIEW' || state.aadhaarStatus === 'VERIFIED') score += 20
  if (state.collegeIdStatus === 'UNDER_REVIEW' || state.collegeIdStatus === 'VERIFIED') score += 20
  if (state.skillsStatus === 'UNDER_REVIEW' || state.skillsStatus === 'VERIFIED') score += 20
  return score
}

export function isKycFullyVerified(state?: KycVerificationState): boolean {
  const s = state || getKycState()
  return calculateKycPercentage(s) === 100
}
