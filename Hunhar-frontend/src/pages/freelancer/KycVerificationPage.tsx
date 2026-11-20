import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft, ShieldCheck } from 'lucide-react'
import KycVerificationModal, { type KycView } from '../../components/kyc/KycVerificationModal'
import { getKycState, calculateKycPercentage } from '../../services/kycState'

export default function KycVerificationPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(true)
  const kyc = getKycState()
  const percentage = calculateKycPercentage(kyc)

  return (
    <div className="w-full pb-16 font-manrope">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12.5px] text-[#8E8376]">
        <Link to="/freelancer/dashboard" className="text-[#8E8376] hover:text-[#08182B] no-underline">
          Dashboard
        </Link>
        <ChevronRight size={13} />
        <Link to="/freelancer/profile" className="text-[#8E8376] hover:text-[#08182B] no-underline">
          Profile
        </Link>
        <ChevronRight size={13} />
        <span className="font-bold text-[#C06B3E]">KYC Verification</span>
      </nav>

      {/* Main Container Card */}
      <div className="rounded-[24px] border border-[#E5DACD] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE6]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF4EC] text-[#C06B3E]">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold text-[#08182B]">
                Freelancer KYC Verification
              </h1>
              <p className="text-[13px] text-[#7A7065]">
                Verify your identity, education, and skills to unlock project bidding on Hunhar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#C06B3E] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-sm hover:bg-[#AA572D] transition-all cursor-pointer"
          >
            {percentage === 100 ? 'View Verification Status' : 'Open Verification Portal'}
          </button>
        </div>

        {/* Status Preview Card */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[18px] border border-[#F0ECE6] bg-[#FAF8F5] p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8376]">Current Progress</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-extrabold text-[#08182B]">{percentage}%</span>
              <span className="text-[12px] font-semibold text-[#16A34A]">
                {percentage === 100 ? '✓ 100% Complete' : 'In Progress'}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5DACD]/60">
              <div
                className="h-full rounded-full bg-[#C06B3E] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-[18px] border border-[#F0ECE6] bg-[#FAF8F5] p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8376]">Project Bidding</span>
            <div className="mt-2">
              {percentage === 100 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-[12.5px] font-bold text-[#15803D]">
                  ✓ Unlocked (Eligible to Bid)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-[12.5px] font-bold text-[#DC2626]">
                  🔒 Locked (Needs 100% KYC)
                </span>
              )}
            </div>
            <p className="mt-3 text-[12px] text-[#7A7065]">
              {percentage === 100
                ? 'Your profile is fully verified. You can submit proposals on any open project.'
                : 'Complete all verification steps to unlock bidding on projects.'}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#F0ECE6] bg-[#FAF8F5] p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8376]">Verified Badges</span>
            <ul className="mt-2 space-y-1.5 text-[12px] text-[#08182B]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Identity (Aadhaar): {kyc.aadhaarStatus === 'UNDER_REVIEW' || kyc.aadhaarStatus === 'VERIFIED' ? '✓ Uploaded' : 'Pending'}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Education (College ID): {kyc.collegeIdStatus === 'UNDER_REVIEW' || kyc.collegeIdStatus === 'VERIFIED' ? '✓ Uploaded' : 'Pending'}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Skills: {kyc.skillsStatus === 'UNDER_REVIEW' || kyc.skillsStatus === 'VERIFIED' ? `✓ ${kyc.selectedSkills.length} Verified` : 'Pending'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* KYC Interactive Modal */}
      <KycVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onVerificationComplete={() => {
          // Keep state updated
        }}
      />
    </div>
  )
}
