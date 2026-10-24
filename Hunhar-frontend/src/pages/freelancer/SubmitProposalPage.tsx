import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Coins,
  Send,
  UploadCloud,
  FileText,
  X,
  HelpCircle,
  Info,
  CheckCircle,
} from 'lucide-react'

export default function SubmitProposalPage(): React.JSX.Element {
  const { projectId = '1' } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Form states
  const [bidAmount, setBidAmount] = useState<string>('2100')
  const [deliveryTime, setDeliveryTime] = useState<string>('14')
  const [milestoneType, setMilestoneType] = useState<'by_milestones' | 'by_project'>('by_milestones')
  const [coverLetter, setCoverLetter] = useState<string>(
    'Hello Aeris Creative team,\n\nI have extensive experience in creating engaging motion graphics and 2D/3D product animations using After Effects and Premiere Pro. I reviewed your campaign requirements and I am confident I can deliver high-converting, polished visual assets within 2 weeks.\n\nLooking forward to collaborating with you!'
  )
  const [attachments, setAttachments] = useState<string[]>([
    'Showreel_2026_MotionDesign.mp4',
  ])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false)

  // Calculations
  const numericBid = Number(bidAmount) || 0
  const hunharPlatformFee = Math.round(numericBid * 0.05) // 5% fee
  const freelancerReceives = numericBid - hunharPlatformFee

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachments([...attachments, e.target.files[0].name])
    }
  }

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmittedSuccess(true)
    }, 900)
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-16 font-manrope">
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/freelancer/browse/${projectId}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DECFBE] bg-white text-[#5C5248] shadow-2xs transition-colors hover:bg-[#F8F4EE] hover:text-[#C06B3E]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-manrope text-[20px] sm:text-[22px] font-extrabold text-[#08182B]">
              Submit a Proposal
            </h1>
            <p className="text-[13px] text-[#7A7065]">
              Project: <span className="font-semibold text-[#08182B]">Motion Graphics Package</span> • Aeris Creative
            </p>
          </div>
        </div>

        {/* Required Credits Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#F2C5A5] bg-[#FCECE0] px-4 py-2 text-[13px] font-bold text-[#A85123] shadow-xs">
          <Coins size={16} className="text-[#C06B3E]" />
          <span>Cost: 20 Credits</span>
        </div>
      </div>

      {/* SUCCESS MODAL POPUP */}
      {submittedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-[460px] overflow-hidden rounded-[24px] border border-[#DECFBE] bg-white p-6 sm:p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F9EE] text-[#1F874C]">
              <CheckCircle size={36} />
            </div>
            <h3 className="mt-4 font-manrope text-[22px] font-extrabold text-[#08182B]">
              Proposal Submitted!
            </h3>
            <p className="mt-2 text-[14px] text-[#6E6459]">
              Your proposal and bid of <span className="font-bold text-[#08182B]">₹{numericBid.toLocaleString()}</span> have been sent to <span className="font-bold text-[#08182B]">Aeris Creative</span>.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/freelancer/projects')}
                className="flex h-11 w-full items-center justify-center rounded-[14px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D]"
              >
                View in Active Bids
              </button>
              <button
                type="button"
                onClick={() => navigate('/freelancer/browse')}
                className="flex h-11 w-full items-center justify-center rounded-[14px] border border-[#E0D5C7] bg-white font-manrope text-[14px] font-bold text-[#42382E] transition-colors hover:bg-[#FAF7F2]"
              >
                Back to Browse Projects
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FORM GRID */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Proposal Details (lg:col-span-8) */}
        <div className="flex flex-col gap-5 lg:col-span-8">
          {/* Card 1: Bid Terms & Pricing */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
            <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Proposal Terms
            </h2>
            <p className="mt-1 text-[13px] text-[#786D61]">
              Client's Budget: <span className="font-bold text-[#C06B3E]">₹1,800 – ₹2,400</span>
            </p>

            {/* Payment Method Selector */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                onClick={() => setMilestoneType('by_milestones')}
                className={`flex cursor-pointer items-start gap-3 rounded-[16px] border p-4 transition-all ${
                  milestoneType === 'by_milestones'
                    ? 'border-[#C06B3E] bg-[#FDF9F5] shadow-xs'
                    : 'border-[#E5DACD] bg-white hover:border-[#C06B3E]/50'
                }`}
              >
                <input
                  type="radio"
                  name="milestoneType"
                  checked={milestoneType === 'by_milestones'}
                  onChange={() => setMilestoneType('by_milestones')}
                  className="mt-1 text-[#C06B3E] focus:ring-[#C06B3E]"
                />
                <div>
                  <span className="font-manrope text-[14px] font-bold text-[#08182B]">
                    By Milestones
                  </span>
                  <p className="mt-0.5 text-[12px] text-[#786D61]">
                    Divide the project into smaller deliverables and get paid per phase.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setMilestoneType('by_project')}
                className={`flex cursor-pointer items-start gap-3 rounded-[16px] border p-4 transition-all ${
                  milestoneType === 'by_project'
                    ? 'border-[#C06B3E] bg-[#FDF9F5] shadow-xs'
                    : 'border-[#E5DACD] bg-white hover:border-[#C06B3E]/50'
                }`}
              >
                <input
                  type="radio"
                  name="milestoneType"
                  checked={milestoneType === 'by_project'}
                  onChange={() => setMilestoneType('by_project')}
                  className="mt-1 text-[#C06B3E] focus:ring-[#C06B3E]"
                />
                <div>
                  <span className="font-manrope text-[14px] font-bold text-[#08182B]">
                    By Project
                  </span>
                  <p className="mt-0.5 text-[12px] text-[#786D61]">
                    Receive full payment after the whole project is finished.
                  </p>
                </div>
              </label>
            </div>

            {/* Input Row: Bid Amount & Delivery Days */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                  Your Bid Amount (₹)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#8E8376]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="2100"
                    required
                    min="100"
                    className="h-11 w-full rounded-[14px] border border-[#DECFBE] bg-[#FDFBF7] pl-8 pr-4 font-manrope text-[14px] font-bold text-[#08182B] focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#8E8376]">
                  Total amount client will see on your proposal.
                </p>
              </div>

              <div>
                <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                  Estimated Delivery Time (Days)
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="14"
                    required
                    min="1"
                    className="h-11 w-full rounded-[14px] border border-[#DECFBE] bg-[#FDFBF7] px-4 font-manrope text-[14px] font-bold text-[#08182B] focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#8E8376]">
                    days
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#8E8376]">
                  Client requires delivery in approx. 3 weeks.
                </p>
              </div>
            </div>

            {/* Fee Breakdown Notice */}
            <div className="mt-5 rounded-[16px] border border-[#E7D6C5] bg-[#FBF6EE] p-4 text-[13px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#EBDCCF]">
                <span className="text-[#6B6156]">Hunhar Platform Fee (5%)</span>
                <span className="font-semibold text-[#8C461F]">- ₹{hunharPlatformFee}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-[#08182B]">You Will Receive</span>
                <span className="font-manrope text-[16px] font-extrabold text-[#1F874C]">
                  ₹{freelancerReceives.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Cover Letter */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">
                Cover Letter
              </h2>
              <span className="text-[12px] font-medium text-[#8E8376]">
                {coverLetter.length} characters
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#786D61]">
              Introduce yourself and explain why you're a great fit for Aeris Creative.
            </p>

            <textarea
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Detail your pitch, past experience, and workflow..."
              required
              className="mt-3.5 w-full rounded-[16px] border border-[#DECFBE] bg-[#FDFBF7] p-4 font-manrope text-[13px] leading-relaxed text-[#08182B] focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
            />
          </div>

          {/* Card 3: Attachments & Portfolio Samples */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
            <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Attachments & Portfolio Samples
            </h2>
            <p className="mt-1 text-[13px] text-[#786D61]">
              Upload past motion design showreels, pitch decks, or case studies (max 25MB).
            </p>

            {/* Drag & Drop Upload Area */}
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#DECFBE] bg-[#FAF7F2] p-6 text-center transition-colors hover:border-[#C06B3E] hover:bg-[#FDF9F5]">
              <UploadCloud size={30} className="text-[#C06B3E]" />
              <p className="mt-2 text-[13px] font-bold text-[#08182B]">
                Drag and drop files here, or <span className="text-[#C06B3E] underline">browse files</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[#8E8376]">
                Supports MP4, MOV, PDF, PNG, ZIP
              </p>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-[12px] border border-[#E5DACD] bg-[#FBF8F3] px-3 py-1.5 text-[12px] font-semibold text-[#54493D]"
                  >
                    <FileText size={14} className="text-[#C06B3E]" />
                    <span className="truncate max-w-[200px]">{file}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-[#998B7C] hover:text-[#DC2626]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Submission CTA (lg:col-span-4) */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Proposal Summary Box */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="font-manrope text-[14px] font-bold uppercase tracking-wider text-[#8A7F73]">
              BID SUMMARY
            </h3>

            <div className="mt-4 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8E8376]">Bid Amount</span>
                <span className="font-bold text-[#08182B]">₹{numericBid.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8E8376]">Delivery Time</span>
                <span className="font-bold text-[#08182B]">{deliveryTime || 0} Days</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8E8376]">Milestone Type</span>
                <span className="font-bold text-[#08182B]">
                  {milestoneType === 'by_milestones' ? 'By Milestones' : 'Single Project'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-3 text-[13px]">
                <span className="text-[#8E8376]">Connect Credits Cost</span>
                <span className="font-bold text-[#C06B3E]">20 Credits</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8E8376]">Remaining Balance</span>
                <span className="font-bold text-[#1F874C]">660 Credits</span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#C06B3E] font-manrope text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(192,107,62,0.35)] transition-all hover:bg-[#AA572D] active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Proposal</span>
                </>
              )}
            </button>

            <Link
              to={`/freelancer/browse/${projectId}`}
              className="mt-3 flex h-10 w-full items-center justify-center text-[13px] font-semibold text-[#786D61] hover:text-[#08182B]"
            >
              Cancel and Return
            </Link>
          </div>

          {/* Tips for winning the bid */}
          <div className="w-full rounded-[20px] border border-[#E9DFD3] bg-[#FCFBF8] p-5">
            <div className="flex items-center gap-2 text-[#C06B3E]">
              <Info size={16} />
              <h4 className="font-manrope text-[13px] font-bold">
                Tips for Winning this Job
              </h4>
            </div>

            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#6E6458]">
              <li className="flex items-start gap-2">
                <span className="text-[#C06B3E]">•</span>
                <span>Highlight relevant motion graphics projects similar to Aeris Creative's scope.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C06B3E]">•</span>
                <span>Keep your timeline realistic to build trust.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C06B3E]">•</span>
                <span>Propose distinct milestones so the client can approve iterative deliverables.</span>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
