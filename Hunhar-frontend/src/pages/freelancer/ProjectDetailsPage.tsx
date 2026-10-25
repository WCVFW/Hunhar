import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Briefcase,
  Clock,
  Users,
  Paperclip,
  CheckCircle2,
  ArrowLeft,
  Coins,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'
import { fileUrl, projectsApi, type Project } from '../../services/api'
import {
  BID_STATUS_LABEL,
  BID_STATUS_STYLE,
  CREDITS_PER_BID,
  PROJECT_STATUS_LABEL,
  formatDate,
  formatINR,
  initials,
  splitList,
  timeAgo,
} from '../../services/format'

export default function ProjectDetailsPage(): React.JSX.Element {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function fetchProject() {
      setLoading(true)
      try {
        const res = await projectsApi.getProjectById(projectId)
        if (res) {
          setProject(res)
        } else {
          setError('Project not found')
        }
      } catch (err: any) {
        console.warn('Error fetching project:', err)
        setError(err.message || 'Failed to load project details')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex min-h-[350px] w-full items-center justify-center rounded-[24px] bg-white p-8">
        <span className="font-manrope text-[15px] font-semibold text-[#8E8376]">Loading project details…</span>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-[350px] w-full flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center font-manrope">
        <h3 className="text-[18px] font-bold text-[#08182B]">Project not found</h3>
        <p className="mt-1 text-[13px] text-[#7A7065]">{error || 'The requested project could not be found.'}</p>
        <Link
          to="/freelancer/browse"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-[#AA572D]"
        >
          <ArrowLeft size={14} /> Back to Projects
        </Link>
      </div>
    )
  }

  const category = (project.category || 'General').toUpperCase()
  const status = PROJECT_STATUS_LABEL[project.status] || project.status
  const title = project.title
  const clientName = project.clientName || 'Client'
  const description = project.description || 'No description provided.'
  const skills = splitList(project.skills)
  const attachments = splitList(project.attachmentUrls)
  const budgetFormatted = formatINR(project.budget)
  const timeline = project.timelineDays ? `${project.timelineDays} days` : 'Flexible'
  const clientInitial = initials(clientName)
  const myBid = project.myBidStatus && project.myBidStatus !== 'WITHDRAWN' ? project.myBidStatus : null
  const isMine = project.myRole === 'OWNER' || project.myRole === 'COLLABORATOR'
  const canBid = project.status === 'OPEN' && !myBid

  return (
    <div className="flex w-full flex-col gap-5 pb-12 font-manrope">
      {/* 1. TOP HEADER TITLE */}
      <div className="flex items-center gap-2 text-[#08182B]">
        <Briefcase size={20} className="text-[#8E8376]" />
        <h1 className="font-manrope text-[18px] sm:text-[20px] font-bold text-[#08182B]">
          Project Overview
        </h1>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: Left (Content) & Right (Bid & Client Cards) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Overview, Required Skills, and Payments (lg:col-span-8) */}
        <div className="flex flex-col gap-5 lg:col-span-8">
          {/* Main Card: Image, Title, Description */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
            {/* Category Pill and Status Indicator */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DACD] bg-[#FBF8F3] px-3.5 py-1 font-manrope text-[11px] font-bold tracking-wide text-[#9C5128]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C06B3E]" />
                {category}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full font-manrope text-[12px] font-bold text-[#1F874C]">
                <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                {status}
              </span>
            </div>

            {/* Mascot / Project Desk Image Banner */}
            <div className="relative mt-4 h-[240px] sm:h-[300px] w-full overflow-hidden rounded-[20px] bg-[#E8DDD0]">
              <img
                src={cardDeskMascot}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Title */}
            <h2 className="mt-5 font-manrope text-[22px] sm:text-[24px] font-extrabold text-[#08182B]">
              {title}
            </h2>

            {/* Client, Time, Rating Metadata */}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-[#73685C]">
              <span className="font-semibold text-[#544B40] flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-[#EFE5DB] text-[#C06B3E] flex items-center justify-center text-[10px] font-bold">
                  👤
                </span>
                {clientName}
              </span>

              <span className="flex items-center gap-1.5 text-[#8E8376]">
                <Clock size={14} />
                Timeline: {timeline}
              </span>

              <span className="flex items-center gap-1.5 text-[#8E8376]">
                <Users size={14} />
                {project.bidCount} proposal{project.bidCount === 1 ? '' : 's'} · posted {timeAgo(project.createdAt)}
              </span>
            </div>

            {/* Description Paragraph */}
            <p className="mt-4 font-manrope text-[14px] leading-relaxed text-[#594E42] whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Required Skills Card */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Required Skills
            </h3>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {skills.length === 0 && <span className="text-[13px] text-[#8E8376]">No specific skills listed.</span>}
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-[10px] bg-[#F5ECE1] px-4 py-2 font-manrope text-[13px] font-medium text-[#544A3D]"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Attachments</h3>
              <div className="mt-3 flex flex-col gap-2">
                {attachments.map((url, idx) => (
                  <a
                    key={url}
                    href={fileUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-[12px] border border-[#EFE4D7] bg-[#FAF7F2] px-3.5 py-2.5 text-[13px] font-semibold text-[#08182B] no-underline hover:border-[#C06B3E]/50"
                  >
                    <Paperclip size={15} className="text-[#8E8376]" />
                    Attachment {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Submit Bid Action, Project Details, About Client (lg:col-span-4) */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Submit Bid Button (Terracotta solid pill/card) */}
          {isMine ? (
            <Link
              to={`/freelancer/projects/${project.id}`}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#08182B] font-manrope text-[15px] font-bold text-white no-underline shadow-sm transition-all hover:bg-[#12294A]"
            >
              <CheckCircle2 size={18} /> Open project workspace
            </Link>
          ) : myBid ? (
            <div className="w-full rounded-[16px] border border-[#E5DACD] bg-[#FBF8F3] p-4 text-center">
              <span className={`inline-flex rounded-full px-3 py-1 font-manrope text-[12px] font-bold ${BID_STATUS_STYLE[myBid]}`}>
                Your proposal: {BID_STATUS_LABEL[myBid]}
              </span>
              <Link to="/freelancer/bids" className="mt-2 block font-manrope text-[13px] font-bold text-[#C06B3E] no-underline hover:underline">
                View my bids
              </Link>
            </div>
          ) : canBid ? (
            <div className="flex flex-col gap-1.5">
              <Link
                to={`/freelancer/browse/${project.id}/bid`}
                className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#C06B3E] font-manrope text-[15px] font-bold text-white no-underline shadow-[0_4px_14px_rgba(192,107,62,0.35)] transition-all hover:bg-[#AA572D] hover:shadow-[0_6px_18px_rgba(192,107,62,0.45)] active:scale-98"
              >
                Submit Proposal
              </Link>
              <span className="flex items-center justify-center gap-1 text-[12px] text-[#8E8376]">
                <Coins size={13} className="text-[#C06B3E]" /> Uses {CREDITS_PER_BID} credits
              </span>
            </div>
          ) : (
            <div className="w-full rounded-[16px] border border-[#E5E5E5] bg-[#F8F8F8] p-4 text-center font-manrope text-[13px] font-semibold text-[#7A7065]">
              This project is no longer accepting proposals.
            </div>
          )}

          {/* Project Details Box */}
          <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs">
            <h3 className="font-manrope text-[13px] font-bold uppercase tracking-wider text-[#8A7F73]">
              PROJECT DETAILS
            </h3>

            <div className="mt-4 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Budget</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {budgetFormatted}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Timeline</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {timeline}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Category</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {category}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Status</span>
                <span className="font-manrope font-bold text-[#1F874C]">
                  {status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Posted</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {formatDate(project.createdAt, true)}
                </span>
              </div>
            </div>
          </div>

          {/* About Client Box */}
          <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs">
            <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">
              About {clientName}
            </h3>

            {/* Client Avatar + Rating */}
            <div className="mt-4 flex items-center gap-3">
              {project.clientAvatarUrl ? (
                <img src={fileUrl(project.clientAvatarUrl)} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[16px] font-bold text-white shadow-xs">
                  {clientInitial}
                </div>
              )}

              <div>
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  {clientName}
                </h4>
                <div className="flex items-center gap-1 text-[12px] text-[#786D61]">
                  <Clock size={12} />
                  <span>Posted {timeAgo(project.createdAt)}</span>
                </div>
              </div>
            </div>

            <p className="mt-3.5 text-[12px] text-[#7A7065]">
              Payments for this project are protected by Hunhar escrow.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
