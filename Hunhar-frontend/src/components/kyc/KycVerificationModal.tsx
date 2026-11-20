import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  ArrowLeft,
  Shield,
  GraduationCap,
  Star,
  Mail,
  Smartphone,
  ChevronRight,
  Upload,
  FileText,
  CheckCircle2,
  Lock,
  Zap,
  Check,
} from 'lucide-react'
import hunharLogo from '../../assets/hunha Logo.png'
import {
  getKycState,
  saveKycState,
  calculateKycPercentage,
  type KycVerificationState,
} from '../../services/kycState'

export type KycView = 'overview' | 'aadhaar' | 'collegeId' | 'skills'

interface KycVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: KycView
  onVerificationComplete?: () => void
}

const AVAILABLE_SKILLS = [
  'Graphic Design',
  'UI/UX Design',
  'Video Editing',
  'Figma',
  'Adobe Illustrator',
  'Motion Design',
  'Branding',
  'Web Development',
  'React.js',
  'Mobile App Dev',
  'Content Writing',
  '3D Modeling',
]

export default function KycVerificationModal({
  isOpen,
  onClose,
  initialView = 'overview',
  onVerificationComplete,
}: KycVerificationModalProps): React.JSX.Element | null {
  const [kycState, setKycState] = useState<KycVerificationState>(getKycState())
  const [currentView, setCurrentView] = useState<KycView>(initialView)

  // File upload state for Aadhaar
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [aadhaarUploading, setAadhaarUploading] = useState(false)
  const aadhaarInputRef = useRef<HTMLInputElement>(null)

  // File upload state for College ID
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null)
  const [collegeIdUploading, setCollegeIdUploading] = useState(false)
  const collegeIdInputRef = useRef<HTMLInputElement>(null)

  // Skills state
  const [selectedSkills, setSelectedSkills] = useState<string[]>(kycState.selectedSkills || [])
  const [workSampleFile, setWorkSampleFile] = useState<File | null>(null)
  const [workSampleUploading, setWorkSampleUploading] = useState(false)
  const workSampleInputRef = useRef<HTMLInputElement>(null)

  // Sync state whenever modal opens or storage updates
  useEffect(() => {
    if (isOpen) {
      const state = getKycState()
      setKycState(state)
      setSelectedSkills(state.selectedSkills || [])
      setCurrentView(initialView)
    }
  }, [isOpen, initialView])

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setKycState(e.detail)
      } else {
        setKycState(getKycState())
      }
    }
    window.addEventListener('hunhar_kyc_updated', handleUpdate)
    return () => window.removeEventListener('hunhar_kyc_updated', handleUpdate)
  }, [])

  if (!isOpen) return null

  const percentage = calculateKycPercentage(kycState)
  const is100 = percentage === 100

  // SVG Circular Gauge calculations (Radius = 40, Circumference = 2 * PI * 40 ≈ 251.32)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (circumference * percentage) / 100

  // Continue to the next incomplete step
  const handleContinueVerification = () => {
    if (kycState.aadhaarStatus === 'NOT_STARTED') {
      setCurrentView('aadhaar')
    } else if (kycState.collegeIdStatus === 'NOT_STARTED') {
      setCurrentView('collegeId')
    } else if (kycState.skillsStatus === 'NOT_STARTED') {
      setCurrentView('skills')
    } else {
      setCurrentView('overview')
    }
  }

  // Handle Aadhaar file selection
  const handleAadhaarSelect = (file: File) => {
    setAadhaarFile(file)
    setAadhaarUploading(true)
    setTimeout(() => {
      const updated = saveKycState({
        aadhaarStatus: 'UNDER_REVIEW',
        aadhaarDocumentName: file.name,
      })
      setKycState(updated)
      setAadhaarUploading(false)
    }, 400)
  }

  // Handle College ID file selection
  const handleCollegeIdSelect = (file: File) => {
    setCollegeIdFile(file)
    setCollegeIdUploading(true)
    setTimeout(() => {
      const updated = saveKycState({
        collegeIdStatus: 'UNDER_REVIEW',
        collegeIdDocumentName: file.name,
      })
      setKycState(updated)
      setCollegeIdUploading(false)
    }, 400)
  }

  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  // Handle Work Sample selection
  const handleWorkSampleSelect = (file: File) => {
    setWorkSampleFile(file)
    setWorkSampleUploading(true)
    setTimeout(() => {
      saveKycState({
        workSampleName: file.name,
      })
      setWorkSampleUploading(false)
    }, 400)
  }

  // Submit Skills for review
  const handleSubmitSkills = () => {
    if (selectedSkills.length === 0) return
    const updated = saveKycState({
      skillsStatus: 'UNDER_REVIEW',
      selectedSkills,
      workSampleName: workSampleFile?.name || kycState.workSampleName,
    })
    setKycState(updated)
    setCurrentView('overview')
    if (calculateKycPercentage(updated) === 100) {
      if (onVerificationComplete) onVerificationComplete()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5 font-manrope backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verify Your Profile"
        className="relative flex w-full max-w-[890px] flex-col md:flex-row overflow-hidden rounded-[26px] border border-[#DECFBE]/60 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* LEFT COLUMN: DARK SIDEBAR (#08182B)                            */}
        {/* ============================================================== */}
        <div className="flex w-full md:w-[275px] shrink-0 flex-col justify-between bg-[#08182B] p-6 text-white sm:p-7 border-b md:border-b-0 md:border-r border-[#152B46]">
          <div>
            {/* Hunhar Brand Logo */}
            <div className="flex items-center">
              <img src={hunharLogo} alt="Hunhar Logo" className="h-7 w-auto object-contain" />
            </div>

            {/* Circular Completion Ring Gauge */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative flex h-[105px] w-[105px] items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#1C2E46"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Dynamic Progress Indicator */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#D97742"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                {/* Center Percentage Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[21px] font-black tracking-tight text-white leading-none">
                    {percentage}%
                  </span>
                  <span className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-[#7E90A3]">
                    COMPLETE
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist: Profile Verification */}
            <div className="space-y-3">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7E90A3]">
                Profile Verification
              </span>
              <ul className="space-y-2.5 text-[13px] text-[#A2B4C7]">
                {/* 1. Email */}
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className="text-white font-medium">Email</span>
                </li>

                {/* 2. Mobile */}
                <li className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className="text-white font-medium">Mobile</span>
                </li>

                {/* 3. Aadhaar */}
                <li className="flex items-center gap-2.5">
                  {kycState.aadhaarStatus === 'UNDER_REVIEW' || kycState.aadhaarStatus === 'VERIFIED' ? (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#243B57]" />
                  )}
                  <span
                    className={
                      kycState.aadhaarStatus !== 'NOT_STARTED' ? 'text-white font-medium' : 'text-[#7E90A3]'
                    }
                  >
                    Aadhaar
                  </span>
                </li>

                {/* 4. College ID */}
                <li className="flex items-center gap-2.5">
                  {kycState.collegeIdStatus === 'UNDER_REVIEW' || kycState.collegeIdStatus === 'VERIFIED' ? (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#243B57]" />
                  )}
                  <span
                    className={
                      kycState.collegeIdStatus !== 'NOT_STARTED' ? 'text-white font-medium' : 'text-[#7E90A3]'
                    }
                  >
                    College ID
                  </span>
                </li>

                {/* 5. Skills */}
                <li className="flex items-center gap-2.5">
                  {kycState.skillsStatus === 'UNDER_REVIEW' || kycState.skillsStatus === 'VERIFIED' ? (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#243B57]" />
                  )}
                  <span
                    className={
                      kycState.skillsStatus !== 'NOT_STARTED' ? 'text-white font-medium' : 'text-[#7E90A3]'
                    }
                  >
                    Skills
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Unlocks Value Proposition at Bottom */}
          <div className="mt-6 pt-5 border-t border-[#152B46] space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#63778E]">
              UNLOCKS
            </span>
            <div className="space-y-1.5 text-[11px] text-[#A2B4C7]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-[#D97742] shrink-0" />
                <span>Verified badge on profile</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-[#D97742] shrink-0" />
                <span>Priority in search results</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-[#D97742] shrink-0" />
                <span>Access premium projects & bids</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: MAIN CONTENT VIEWS                               */}
        {/* ============================================================== */}
        <div className="relative flex flex-1 flex-col bg-white p-6 sm:p-8 min-h-[500px]">
          {/* Close Button on Top-Right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4EFE6]/70 text-[#7A7065] transition-colors hover:bg-[#FAF4EE] hover:text-[#08182B] cursor-pointer"
          >
            <X size={17} />
          </button>

          {/* ------------------------------------------------------------ */}
          {/* VIEW: OVERVIEW ("Verify Your Profile")                       */}
          {/* ------------------------------------------------------------ */}
          {currentView === 'overview' && (
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Header Title & Subtitle */}
                <div className="pr-8">
                  <h2 className="font-makira text-[23px] sm:text-[25px] font-extrabold text-[#08182B] leading-tight">
                    Verify Your Profile
                  </h2>
                  <p className="mt-1 text-[13px] text-[#7A7065]">
                    Complete each step to become a fully verified freelancer on hunhar.
                  </p>
                </div>

                {/* Verification Action Cards */}
                <div className="mt-5 space-y-3">
                  {/* Card 1: Email & Mobile */}
                  <div className="flex items-center justify-between rounded-[18px] border border-[#F0ECE6] bg-[#FAF8F5] p-3.5 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FDF4EC] text-[#C06B3E]">
                        <div className="flex items-center gap-0.5">
                          <Mail size={15} />
                          <Smartphone size={15} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">
                            Email & Mobile
                          </h4>
                        </div>
                        <p className="text-[12px] text-[#8E8376]">Pre-verified automatically</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#DCFCE7] px-3 py-1 font-manrope text-[11.5px] font-bold text-[#15803D]">
                      Verified
                    </span>
                  </div>

                  {/* Card 2: Identity (Aadhaar) */}
                  <div
                    onClick={() => setCurrentView('aadhaar')}
                    className="group flex cursor-pointer items-center justify-between rounded-[18px] border border-[#F0ECE6] bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-[#DECFBE] hover:bg-[#FAF8F5]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FDF4EC] text-[#C06B3E]">
                        <Shield size={19} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-manrope text-[14px] font-bold text-[#08182B] group-hover:text-[#C06B3E] transition-colors">
                            Identity
                          </h4>
                          {kycState.aadhaarStatus === 'UNDER_REVIEW' ? (
                            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[10.5px] font-bold text-[#D97706]">
                              Under Review
                            </span>
                          ) : kycState.aadhaarStatus === 'VERIFIED' ? (
                            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10.5px] font-bold text-[#15803D]">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10.5px] font-bold text-[#64748B]">
                              Not Started
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[12px] text-[#8E8376]">
                          Confirm your identity with a government-issued document.
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#C06B3E] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  {/* Card 3: Education (College ID) */}
                  <div
                    onClick={() => setCurrentView('collegeId')}
                    className="group flex cursor-pointer items-center justify-between rounded-[18px] border border-[#F0ECE6] bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-[#DECFBE] hover:bg-[#FAF8F5]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FDF4EC] text-[#C06B3E]">
                        <GraduationCap size={19} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-manrope text-[14px] font-bold text-[#08182B] group-hover:text-[#C06B3E] transition-colors">
                            Education
                          </h4>
                          {kycState.collegeIdStatus === 'UNDER_REVIEW' ? (
                            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[10.5px] font-bold text-[#D97706]">
                              Under Review
                            </span>
                          ) : kycState.collegeIdStatus === 'VERIFIED' ? (
                            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10.5px] font-bold text-[#15803D]">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10.5px] font-bold text-[#64748B]">
                              Not Started
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[12px] text-[#8E8376]">
                          Prove your academic background with your institution ID.
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#C06B3E] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  {/* Card 4: Professional (Skills) */}
                  <div
                    onClick={() => setCurrentView('skills')}
                    className="group flex cursor-pointer items-center justify-between rounded-[18px] border border-[#F0ECE6] bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-[#DECFBE] hover:bg-[#FAF8F5]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FDF4EC] text-[#C06B3E]">
                        <Star size={19} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-manrope text-[14px] font-bold text-[#08182B] group-hover:text-[#C06B3E] transition-colors">
                            Professional
                          </h4>
                          {kycState.skillsStatus === 'UNDER_REVIEW' ? (
                            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[10.5px] font-bold text-[#D97706]">
                              Under Review
                            </span>
                          ) : kycState.skillsStatus === 'VERIFIED' ? (
                            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10.5px] font-bold text-[#15803D]">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[10.5px] font-bold text-[#64748B]">
                              Not Started
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[12px] text-[#8E8376]">
                          Select your skills and attach portfolio samples.
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#C06B3E] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* Bottom Main Action Button */}
              <div className="mt-6 pt-3">
                {is100 ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#BBF7D0] bg-[#DCFCE7] py-3.5 text-center font-manrope text-[14px] font-extrabold text-[#15803D] shadow-xs">
                    <CheckCircle2 size={18} />
                    <span>Profile Fully Verified · Ready to Bid</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleContinueVerification}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#C06B3E] py-3.5 text-center font-manrope text-[14px] font-extrabold text-white shadow-[0_4px_14px_rgba(192,107,62,0.35)] transition-all hover:bg-[#AA572D] active:scale-98 cursor-pointer"
                  >
                    <span>Continue Verification</span>
                    <ChevronRight size={17} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* VIEW: AADHAAR VERIFICATION                                   */}
          {/* ------------------------------------------------------------ */}
          {currentView === 'aadhaar' && (
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Top Nav: Back Arrow + Icon + Title */}
                <div className="flex items-center gap-3 pr-8 pb-3 border-b border-[#F0ECE6]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('overview')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FDF4EC] text-[#C06B3E]">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="font-manrope text-[16px] font-extrabold text-[#08182B]">
                      Aadhaar Verification
                    </h3>
                    <p className="text-[11px] font-semibold text-[#8E8376]">Identity Verification</p>
                  </div>
                </div>

                {/* "Why we need this" Callout Box */}
                <div className="mt-4 rounded-[16px] border border-[#F6DEC9] bg-[#FDF8F3] p-4 text-[12.5px]">
                  <h5 className="font-manrope font-bold text-[#C06B3E]">Why we need this</h5>
                  <p className="mt-1 leading-relaxed text-[#7A7065]">
                    Identity verification builds trust with clients. Your document is end-to-end encrypted
                    and never shared with third parties.
                  </p>
                </div>

                {/* Upload Section */}
                <div className="mt-5">
                  <h4 className="font-manrope text-[13.5px] font-bold text-[#08182B]">Upload Aadhaar</h4>

                  {kycState.aadhaarStatus === 'UNDER_REVIEW' || kycState.aadhaarStatus === 'VERIFIED' ? (
                    /* Document Uploaded Success State */
                    <div className="mt-3 flex items-center justify-between rounded-[16px] border border-[#BBF7D0] bg-[#E9F9EE] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-xs">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h5 className="font-manrope text-[13.5px] font-bold text-[#15803D]">
                            Aadhaar Document uploaded
                          </h5>
                          <p className="text-[11.5px] text-[#166534]">
                            {kycState.aadhaarDocumentName || 'Aadhaar.pdf'} · Under review · 1-2 business days
                          </p>
                        </div>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16A34A] text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  ) : (
                    /* Upload Dropzone */
                    <div
                      onClick={() => aadhaarInputRef.current?.click()}
                      className="mt-2.5 flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#DECFBE] bg-[#FDFBF8] p-6 text-center transition-all hover:border-[#C06B3E] hover:bg-white"
                    >
                      <input
                        ref={aadhaarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleAadhaarSelect(file)
                        }}
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08182B] text-white shadow-xs">
                        <Upload size={20} />
                      </div>
                      <span className="mt-3 font-manrope text-[14px] font-bold text-[#08182B]">
                        {aadhaarUploading ? 'Uploading Aadhaar…' : 'Drop your file here'}
                      </span>
                      <span className="mt-1 text-[11.5px] text-[#8E8376]">
                        or click to browse · PDF, JPG, PNG · Max 10 MB
                      </span>
                    </div>
                  )}

                  <p className="mt-2.5 text-center text-[11px] text-[#9A8E80]">
                    Upload the front side only. Mask your Aadhaar number before uploading.
                  </p>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-6 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (kycState.aadhaarStatus === 'NOT_STARTED') {
                      // Demo upload if not clicked file
                      saveKycState({
                        aadhaarStatus: 'UNDER_REVIEW',
                        aadhaarDocumentName: 'Aadhaar_Card_Verified.pdf',
                      })
                    }
                    setCurrentView('collegeId')
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#C06B3E] py-3.5 text-center font-manrope text-[14px] font-extrabold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-98 cursor-pointer"
                >
                  <span>Continue Verification</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* VIEW: COLLEGE ID VERIFICATION                                */}
          {/* ------------------------------------------------------------ */}
          {currentView === 'collegeId' && (
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Top Nav: Back Arrow + Icon + Title */}
                <div className="flex items-center gap-3 pr-8 pb-3 border-b border-[#F0ECE6]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('overview')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FDF4EC] text-[#C06B3E]">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="font-manrope text-[16px] font-extrabold text-[#08182B]">
                      College ID Verification
                    </h3>
                    <p className="text-[11px] font-semibold text-[#8E8376]">Education Verification</p>
                  </div>
                </div>

                {/* "What to upload" Callout Box */}
                <div className="mt-4 rounded-[16px] border border-[#F6DEC9] bg-[#FDF8F3] p-4 text-[12.5px]">
                  <h5 className="font-manrope font-bold text-[#C06B3E]">What to upload</h5>
                  <p className="mt-1 leading-relaxed text-[#7A7065]">
                    A valid, unexpired College ID showing your name, institution, and enrolment year. Blurry
                    or cropped images may be rejected.
                  </p>
                </div>

                {/* Upload Section */}
                <div className="mt-5">
                  <h4 className="font-manrope text-[13.5px] font-bold text-[#08182B]">
                    Upload College ID Card
                  </h4>

                  {kycState.collegeIdStatus === 'UNDER_REVIEW' || kycState.collegeIdStatus === 'VERIFIED' ? (
                    /* Document Uploaded Success State */
                    <div className="mt-3 flex items-center justify-between rounded-[16px] border border-[#BBF7D0] bg-[#E9F9EE] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-xs">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h5 className="font-manrope text-[13.5px] font-bold text-[#15803D]">
                            College ID Document uploaded
                          </h5>
                          <p className="text-[11.5px] text-[#166534]">
                            {kycState.collegeIdDocumentName || 'College_ID.pdf'} · Under review
                          </p>
                        </div>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16A34A] text-white">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  ) : (
                    /* Upload Dropzone */
                    <div
                      onClick={() => collegeIdInputRef.current?.click()}
                      className="mt-2.5 flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#DECFBE] bg-[#FDFBF8] p-6 text-center transition-all hover:border-[#C06B3E] hover:bg-white"
                    >
                      <input
                        ref={collegeIdInputRef}
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleCollegeIdSelect(file)
                        }}
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08182B] text-white shadow-xs">
                        <Upload size={20} />
                      </div>
                      <span className="mt-3 font-manrope text-[14px] font-bold text-[#08182B]">
                        {collegeIdUploading ? 'Uploading College ID…' : 'Drop your file here'}
                      </span>
                      <span className="mt-1 text-[11.5px] text-[#8E8376]">
                        or click to browse · PDF, JPG, PNG · Max 10 MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-6 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (kycState.collegeIdStatus === 'NOT_STARTED') {
                      saveKycState({
                        collegeIdStatus: 'UNDER_REVIEW',
                        collegeIdDocumentName: 'College_ID_Document.png',
                      })
                    }
                    setCurrentView('skills')
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#C06B3E] py-3.5 text-center font-manrope text-[14px] font-extrabold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-98 cursor-pointer"
                >
                  <span>Continue Verification</span>
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* VIEW: SKILLS VERIFICATION (Professional)                    */}
          {/* ------------------------------------------------------------ */}
          {currentView === 'skills' && (
            <div className="flex flex-1 flex-col justify-between">
              <div>
                {/* Top Nav: Back Arrow + Icon + Title */}
                <div className="flex items-center gap-3 pr-8 pb-3 border-b border-[#F0ECE6]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('overview')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FDF4EC] text-[#C06B3E]">
                    <Star size={18} />
                  </div>
                  <div>
                    <h3 className="font-manrope text-[16px] font-extrabold text-[#08182B]">
                      Skills Verification
                    </h3>
                    <p className="text-[11px] font-semibold text-[#8E8376]">Professional Verification</p>
                  </div>
                </div>

                {/* Skill Pills Selection */}
                <div className="mt-4">
                  <span className="block font-manrope text-[13px] font-bold text-[#08182B]">
                    Select skills to verify <span className="font-normal text-[#8E8376]">(select at least one)</span>
                  </span>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {AVAILABLE_SKILLS.map((skill) => {
                      const isSelected = selectedSkills.includes(skill)
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`rounded-full px-4 py-2 font-manrope text-[12.5px] font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#08182B] text-white shadow-xs'
                              : 'border border-[#DECFBE] bg-white text-[#08182B] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Optional Portfolio / Work Sample */}
                <div className="mt-5">
                  <span className="block font-manrope text-[13px] font-bold text-[#08182B]">
                    Portfolio / Work Sample <span className="font-normal text-[#8E8376]">(optional)</span>
                  </span>

                  {workSampleFile || kycState.workSampleName ? (
                    <div className="mt-2 flex items-center justify-between rounded-[16px] border border-[#BBF7D0] bg-[#E9F9EE] p-3 text-[12px] text-[#15803D]">
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span className="font-semibold">
                          Work sample attached ({workSampleFile?.name || kycState.workSampleName})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkSampleFile(null)
                          saveKycState({ workSampleName: undefined })
                        }}
                        className="text-[#DC2626] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => workSampleInputRef.current?.click()}
                      className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#DECFBE] bg-[#FDFBF8] p-4 text-center transition-all hover:border-[#C06B3E] hover:bg-white"
                    >
                      <input
                        ref={workSampleInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleWorkSampleSelect(file)
                        }}
                      />
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#08182B] text-white">
                        <Upload size={16} />
                      </div>
                      <span className="mt-2 text-[12.5px] font-bold text-[#08182B]">
                        {workSampleUploading ? 'Attaching…' : 'Drop your file here'}
                      </span>
                      <span className="text-[11px] text-[#8E8376]">
                        or click to browse · PDF, JPG, PNG · Max 10 MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-6 pt-3">
                {selectedSkills.length === 0 ? (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center rounded-[16px] bg-[#E2E8F0] py-3.5 font-manrope text-[14px] font-bold text-[#94A3B8] cursor-not-allowed"
                  >
                    Select a Skill to Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitSkills}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#C06B3E] py-3.5 text-center font-manrope text-[14px] font-extrabold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-98 cursor-pointer"
                  >
                    <span>
                      Submit {selectedSkills.length} Skill{selectedSkills.length > 1 ? 's' : ''} for Review
                    </span>
                    <ChevronRight size={17} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
