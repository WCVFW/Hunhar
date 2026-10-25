import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Coins,
  Send,
  UploadCloud,
  FileText,
  X,
  CheckCircle,
} from 'lucide-react'
import { projectsApi, bidsApi, creditsApi, filesApi, type Project, type StoredFile } from '../../services/api'
import { CREDITS_PER_BID, PLATFORM_FEE_RATE, formatBytes, formatINR } from '../../services/format'

const MAX_ATTACHMENTS = 5
const MIN_LETTER = 30

export default function SubmitProposalPage(): React.JSX.Element {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [loadingProject, setLoadingProject] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [credits, setCredits] = useState<number | null>(null)

  // Form states
  const [bidAmount, setBidAmount] = useState<string>('')
  const [deliveryTime, setDeliveryTime] = useState<string>('')
  const [milestoneType, setMilestoneType] = useState<'by_milestones' | 'by_project'>('by_milestones')
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [attachments, setAttachments] = useState<StoredFile[]>([])
  const [uploading, setUploading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingProject(true)
      const [projectRes, creditsRes] = await Promise.allSettled([
        projectsApi.getProjectById(projectId),
        creditsApi.getMyCredits(),
      ])
      if (cancelled) return
      if (projectRes.status === 'fulfilled') {
        const p = projectRes.value
        setProject(p)
        setBidAmount(String(Math.round(Number(p.budget))))
        setDeliveryTime(String(p.timelineDays || 14))
      } else {
        setLoadError(projectRes.reason?.message || 'Could not load this project')
      }
      if (creditsRes.status === 'fulfilled') setCredits(creditsRes.value.balance)
      setLoadingProject(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  // Calculations
  const numericBid = Number(bidAmount) || 0
  const hunharPlatformFee = Math.round(numericBid * PLATFORM_FEE_RATE)
  const freelancerReceives = numericBid - hunharPlatformFee
  const alreadyBid = !!project?.myBidStatus && project.myBidStatus !== 'WITHDRAWN'
  const closed = !!project && project.status !== 'OPEN'
  const notEnoughCredits = credits !== null && credits < CREDITS_PER_BID

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setErrorMsg(`You can attach up to ${MAX_ATTACHMENTS} files.`)
      return
    }
    setUploading(true)
    setErrorMsg('')
    try {
      for (const file of files) {
        const stored = await filesApi.upload(file)
        setAttachments((prev) => [...prev, stored])
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    const days = Number(deliveryTime)
    if (numericBid < 50) return setErrorMsg('Your bid must be at least ₹50.')
    if (!Number.isInteger(days) || days < 1 || days > 365) return setErrorMsg('Delivery time must be between 1 and 365 days.')
    if (coverLetter.trim().length < MIN_LETTER) return setErrorMsg(`Please write at least ${MIN_LETTER} characters in your cover letter.`)

    setIsSubmitting(true)
    try {
      const preference = milestoneType === 'by_milestones' ? 'Payment preference: by milestones' : 'Payment preference: full payment on completion'
      await bidsApi.submitBid(projectId, {
        proposedCost: numericBid,
        deliveryTimelineDays: days,
        proposalMessage: `${coverLetter.trim()}\n\n${preference}`,
        attachmentUrls: attachments.map((a) => a.url),
      })
      setCredits((c) => (c === null ? c : c - CREDITS_PER_BID))
      setSubmittedSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit proposal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingProject) {
    return (
      <div className="flex min-h-[350px] w-full items-center justify-center rounded-[24px] bg-white p-8">
        <span className="font-manrope text-[15px] font-semibold text-[#8E8376]">Loading project…</span>
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="flex min-h-[350px] w-full flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center font-manrope">
        <h3 className="text-[18px] font-bold text-[#08182B]">Project unavailable</h3>
        <p className="mt-1 text-[13px] text-[#7A7065]">{loadError || 'This project could not be found.'}</p>
        <Link to="/freelancer/browse" className="mt-4 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white no-underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  const projectTitle = project.title
  const clientName = project.clientName || 'the client'
  const projectBudget = formatINR(project.budget)

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
              Project: <span className="font-semibold text-[#08182B]">{projectTitle}</span> • {clientName}
            </p>
          </div>
        </div>

        {/* Required Credits Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#F2C5A5] bg-[#FCECE0] px-4 py-2 text-[13px] font-bold text-[#A85123] shadow-xs">
          <Coins size={16} className="text-[#C06B3E]" />
          <span>
            Costs {CREDITS_PER_BID} credits{credits !== null ? ` · You have ${credits}` : ''}
          </span>
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
              Your proposal of <span className="font-bold text-[#08182B]">{formatINR(numericBid)}</span> was sent to <span className="font-bold text-[#08182B]">{clientName}</span>. You'll get a notification when they respond.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/freelancer/bids')}
                className="flex h-11 w-full items-center justify-center rounded-[14px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D]"
              >
                View in My Bids
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

      {(alreadyBid || closed || notEnoughCredits) && (
        <div className="rounded-[16px] border border-[#F2C5A5] bg-[#FCECE0] p-4 font-manrope text-[13px] font-semibold text-[#8C461F]">
          {alreadyBid ? (
            <>You already sent a proposal for this project. <Link to="/freelancer/bids" className="font-bold text-[#C06B3E]">View my bids</Link></>
          ) : closed ? (
            'This project is no longer accepting proposals.'
          ) : (
            <>You need {CREDITS_PER_BID} credits to send a proposal but have {credits}. <Link to="/freelancer/credits" className="font-bold text-[#C06B3E]">Buy credits</Link></>
          )}
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
              Client's Estimated Budget: <span className="font-bold text-[#C06B3E]">{projectBudget}</span>
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
                    placeholder="2000"
                    required
                    min="50"
                    max="10000000"
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
                    max="365"
                    className="h-11 w-full rounded-[14px] border border-[#DECFBE] bg-[#FDFBF7] px-4 font-manrope text-[14px] font-bold text-[#08182B] focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#8E8376]">
                    days
                  </span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Notice */}
            <div className="mt-5 rounded-[16px] border border-[#E7D6C5] bg-[#FBF6EE] p-4 text-[13px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#EBDCCF]">
                <span className="text-[#6B6156]">Hunhar Platform Fee ({Math.round(PLATFORM_FEE_RATE * 100)}%)</span>
                <span className="font-semibold text-[#8C461F]">- {formatINR(hunharPlatformFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-[#08182B]">You Will Receive</span>
                <span className="font-manrope text-[16px] font-extrabold text-[#1F874C]">
                  {formatINR(freelancerReceives)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Cover Letter */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
            <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Cover Letter
            </h2>
            <p className="mt-1 text-[13px] text-[#786D61]">
              Introduce yourself and explain why you're a strong fit for this project.
            </p>

            <textarea
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={`Hi ${clientName}, I'd love to work on "${projectTitle}". Here's how I'd approach it…`}
              required
              maxLength={4900}
              className="mt-4 w-full rounded-[16px] border border-[#DECFBE] bg-[#FDFBF7] p-4 font-manrope text-[14px] leading-relaxed text-[#08182B] focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
            />
            <p className={`mt-1 text-right text-[11px] ${coverLetter.trim().length < MIN_LETTER ? 'text-[#B45309]' : 'text-[#8E8376]'}`}>
              {coverLetter.trim().length < MIN_LETTER
                ? `${MIN_LETTER - coverLetter.trim().length} more characters needed`
                : `${coverLetter.length} / 4900`}
            </p>
          </div>

          {/* Card 3: Attachments */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
            <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">Attachments <span className="text-[13px] font-medium text-[#8E8376]">(optional)</span></h2>
            <p className="mt-1 text-[13px] text-[#786D61]">Add samples of similar work — up to {MAX_ATTACHMENTS} files, 20 MB each.</p>

            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
              className="mt-4 flex w-full flex-col items-center justify-center gap-1.5 rounded-[16px] border-2 border-dashed border-[#DECFBE] bg-[#FDFBF7] p-5 text-[#786D61] transition-colors hover:border-[#C06B3E] hover:text-[#C06B3E] disabled:opacity-60"
            >
              <UploadCloud size={22} />
              <span className="font-manrope text-[13px] font-bold">{uploading ? 'Uploading…' : 'Click to upload files'}</span>
            </button>

            {attachments.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {attachments.map((file, idx) => (
                  <div key={file.id} className="flex items-center justify-between rounded-[12px] border border-[#EFE4D7] bg-[#FAF7F2] px-3.5 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#08182B]">
                      <FileText size={15} className="shrink-0 text-[#8E8376]" />
                      <span className="truncate">{file.originalName}</span>
                      <span className="shrink-0 text-[11px] font-normal text-[#8E8376]">{formatBytes(file.sizeBytes)}</span>
                    </span>
                    <button type="button" onClick={() => removeAttachment(idx)} aria-label={`Remove ${file.originalName}`} className="text-[#8E8376] hover:text-red-600">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3">
            <Link
              to={`/freelancer/browse/${projectId}`}
              className="rounded-full border border-[#DECFBE] bg-white px-6 py-2.5 font-manrope text-[13px] font-bold text-[#4B3F33] no-underline transition-colors hover:bg-[#F8F4EE]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || uploading || alreadyBid || closed || notEnoughCredits}
              className="inline-flex items-center gap-2 rounded-full bg-[#C06B3E] px-8 py-2.5 font-manrope text-[14px] font-bold text-white shadow-md transition-all hover:bg-[#AA572D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Submitting…' : `Submit Proposal (${CREDITS_PER_BID} credits)`}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Project Info Sidebar (lg:col-span-4) */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs">
            <h3 className="font-manrope text-[13px] font-bold uppercase tracking-wider text-[#8A7F73]">
              PROJECT SUMMARY
            </h3>
            <div className="mt-3">
              <h4 className="font-manrope text-[16px] font-bold text-[#08182B]">{projectTitle}</h4>
              <p className="mt-1 text-[13px] text-[#786D61]">{clientName}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-[#F0F0F0] pt-3 text-[13px]">
              <div>
                <span className="text-[#8E8376]">Client Budget: </span>
                <span className="font-bold text-[#08182B]">{projectBudget}</span>
              </div>
              <div>
                <span className="text-[#8E8376]">Timeline: </span>
                <span className="font-bold text-[#08182B]">{project.timelineDays} days</span>
              </div>
              <div>
                <span className="text-[#8E8376]">Proposals so far: </span>
                <span className="font-bold text-[#08182B]">{project.bidCount}</span>
              </div>
            </div>
            <p className="mt-3 line-clamp-6 whitespace-pre-line text-[12px] leading-relaxed text-[#73685C]">{project.description}</p>
          </div>
        </div>
      </form>
    </div>
  )
}
