export interface KycVerificationState {
  emailVerified: boolean
  mobileVerified: boolean
  aadhaarStatus: 'NOT_STARTED' | 'UNDER_REVIEW' | 'VERIFIED'
  aadhaarDocumentName?: string
  aadhaarDocumentUrl?: string
  collegeIdStatus: 'NOT_STARTED' | 'UNDER_REVIEW' | 'VERIFIED'
  collegeIdDocumentName?: string
  collegeIdDocumentUrl?: string
  skillsStatus: 'NOT_STARTED' | 'UNDER_REVIEW' | 'VERIFIED'
  selectedSkills: string[]
  workSampleName?: string
  workSampleUrl?: string
  submittedAt?: string
}

const STORAGE_KEY = 'hunhar_freelancer_kyc_data'

export function getKycState(): KycVerificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        emailVerified: true,
        mobileVerified: true,
        aadhaarStatus: parsed.aadhaarStatus || 'NOT_STARTED',
        aadhaarDocumentName: parsed.aadhaarDocumentName,
        aadhaarDocumentUrl: parsed.aadhaarDocumentUrl,
        collegeIdStatus: parsed.collegeIdStatus || 'NOT_STARTED',
        collegeIdDocumentName: parsed.collegeIdDocumentName,
        collegeIdDocumentUrl: parsed.collegeIdDocumentUrl,
        skillsStatus: parsed.skillsStatus || 'NOT_STARTED',
        selectedSkills: Array.isArray(parsed.selectedSkills) ? parsed.selectedSkills : [],
        workSampleName: parsed.workSampleName,
        workSampleUrl: parsed.workSampleUrl,
        submittedAt: parsed.submittedAt,
      }
    }
  } catch {
    // fallback
  }

  // Default initial state: Email & Mobile are pre-verified (40%)
  return {
    emailVerified: true,
    mobileVerified: true,
    aadhaarStatus: 'NOT_STARTED',
    collegeIdStatus: 'NOT_STARTED',
    skillsStatus: 'NOT_STARTED',
    selectedSkills: [],
  }
}

export function saveKycState(patch: Partial<KycVerificationState>): KycVerificationState {
  const current = getKycState()
  const updated: KycVerificationState = { ...current, ...patch }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('hunhar_kyc_updated', { detail: updated }))
  } catch {
    // ignore
  }
  return updated
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
