import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, Star, CheckCircle2, Clock, MessageSquare, Check, X, ExternalLink, GraduationCap, FileText, Eye, ShieldCheck, Paperclip } from 'lucide-react'
import { bidsApi, clientApi, fileUrl, messagesApi, profileApi, projectsApi, type Bid, type FreelancerProfile, type Project } from '../../services/api'
import { formatINR, initials, PROJECT_STATUS_LABEL, splitList, timeAgo } from '../../services/format'
import { fromRouteId, toRouteId } from '../../services/routeIds'

type Tab = 'all' | 'shortlisted' | 'accepted' | 'rejected'

const tabOf = (b: Bid): Exclude<Tab, 'all'> | 'pending' =>
  b.status === 'AWARDED' ? 'accepted' : b.status === 'SHORTLISTED' || b.shortlisted ? 'shortlisted' : b.status === 'REJECTED' ? 'rejected' : 'pending'

const fileName = (url: string) => decodeURIComponent(url.split('/').pop() || 'file').replace(/^[0-9a-f-]{36}\./i, 'attachment.')

export default function ClientProjectBidsPage(): React.JSX.Element {
  const { projectId: token = '' } = useParams<{ projectId: string }>()
  const projectId = fromRouteId(token)
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [profiles, setProfiles] = useState<Record<string, FreelancerProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterTab, setFilterTab] = useState<Tab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState<Bid | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    window.setTimeout(() => setToast(null), 4500)
  }

  const load = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([projectsApi.getProjectById(projectId), bidsApi.getProjectBids(projectId)])
      const visible = b.filter((x) => x.status !== 'WITHDRAWN')
      setProject(p)
      setBids(visible)
      setError('')
      // College, skills, rating and portfolio come from each freelancer's public profile
      const ids = [...new Set(visible.map((x) => x.freelancerId))]
      const results = await Promise.allSettled(ids.map((id) => profileApi.getPublic(id)))
      const map: Record<string, FreelancerProfile> = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') map[ids[i]] = r.value
      })
      setProfiles(map)
    } catch (err: any) {
      setError(err.status === 403 ? 'This project belongs to another account.' : err.message || 'Could not load the proposals')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const act = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key)
    try {
      await fn()
      showToast('success', success)
      await load()
    } catch (err: any) {
      showToast('error', err.message || 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const chat = async (bid: Bid) => {
    try {
      const conv = await messagesApi.startConversation(bid.freelancerId, projectId)
      navigate(`/client/messages?c=${toRouteId(conv.id)}`)
    } catch (err: any) {
      showToast('error', err.message || 'Could not open the chat')
    }
  }

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center rounded-[24px] bg-white font-manrope text-[14px] font-semibold text-[#8E8376]">Loading proposals…</div>
  }
  if (error || !project) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center font-manrope">
        <p className="text-[15px] font-bold text-[#08182B]">{error || 'Project not found'}</p>
        <Link to="/client/projects" className="mt-4 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white no-underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  const canDecide = project.status === 'OPEN'
  const acceptedBid = bids.find((b) => b.status === 'AWARDED')
  const shortlistedCount = bids.filter((b) => tabOf(b) === 'shortlisted').length
  const rejectedCount = bids.filter((b) => b.status === 'REJECTED').length

  const filtered = bids.filter((b) => {
    if (filterTab !== 'all' && tabOf(b) !== filterTab) return false
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    const pr = profiles[b.freelancerId]
    return [b.freelancerName, pr?.collegeUniversity, pr?.professionalTitle, ...(pr?.skills || [])].some((v) => v?.toLowerCase().includes(q))
  })

  const badgeFor = (pr?: FreelancerProfile) => {
    if (!pr) return null
    if (pr.rating >= 4.5 && pr.completedProjects >= 3) return { label: 'Top Rated', cls: 'bg-[#FFF7ED] text-[#C06B3E] border border-[#FED7AA]' }
    if (pr.kycStatus === 'VERIFIED') return { label: 'KYC Verified', cls: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]' }
    return null
  }

  return (
    <div className="w-full font-manrope">
      <div className="flex min-h-[820px] w-full flex-col rounded-[24px] border border-[#E9EBEF]/60 bg-white p-6 shadow-xs sm:p-9 lg:p-10">
        {toast && (
          <div
            className={`mb-6 flex items-center justify-between rounded-[16px] border p-4 ${
              toast.type === 'success' ? 'border-[#BDE8CA] bg-[#E9F9EE] text-[#1F874C]' : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="text-[13.5px] font-bold">{toast.text}</span>
            </div>
            <button type="button" onClick={() => setToast(null)} className="cursor-pointer p-1 hover:opacity-70">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/client/projects" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#64748B] no-underline transition-colors hover:text-[#08182B]">
            <ArrowLeft size={16} />
            <span>Back to Projects</span>
          </Link>
          <Link to={`/client/projects/${toRouteId(project.id)}`} className="text-[12.5px] font-bold text-[#C06B3E] no-underline hover:underline">
            Project details, milestones & payments →
          </Link>
        </div>

        {/* Project header */}
        <div className="mb-7 rounded-[20px] border border-[#F0ECE6] bg-[#FAF8F5] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-2.5 py-0.5 text-[11px] font-bold text-[#C06B3E]">{project.category}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  {acceptedBid ? 'Hired · in progress' : PROJECT_STATUS_LABEL[project.status] || project.status}
                </span>
              </div>
              <h1 className="font-manrope text-[22px] font-extrabold text-[#08182B] sm:text-[26px]">{project.title}</h1>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#7A7065]">{project.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {[
                { label: 'Project Budget', value: formatINR(project.budget), cls: 'text-[#08182B]' },
                { label: 'Total Proposals', value: `${bids.length} ${bids.length === 1 ? 'Bid' : 'Bids'}`, cls: 'text-[#C06B3E]' },
                { label: 'Shortlisted', value: String(shortlistedCount), cls: 'text-[#2563EB]' },
              ].map((m) => (
                <div key={m.label} className="flex min-w-[110px] flex-col justify-center rounded-[14px] border border-[#EFE8DF] bg-white px-4 py-2.5 shadow-2xs">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">{m.label}</span>
                  <span className={`text-[17px] font-extrabold ${m.cls}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!canDecide && !acceptedBid && (
          <div className="mb-5 rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[12.5px] font-semibold text-[#92400E]">
            This project is {(PROJECT_STATUS_LABEL[project.status] || project.status).toLowerCase()}; proposals can only be shortlisted or hired while it accepts bids.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-[#F0ECE6] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: `All Proposals (${bids.length})` },
                { id: 'shortlisted', label: `Shortlisted (${shortlistedCount})` },
                { id: 'accepted', label: acceptedBid ? 'Hired Freelancer (1)' : 'Hired (0)' },
                { id: 'rejected', label: `Declined (${rejectedCount})` },
              ] as { id: Tab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`cursor-pointer rounded-full px-4 py-1.5 font-manrope text-[12.5px] font-bold transition-all ${
                  filterTab === tab.id ? 'bg-[#C06B3E] text-white shadow-xs' : 'bg-[#FAF8F5] text-[#64748B] hover:bg-[#F0ECE6] hover:text-[#08182B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search freelancer, college, skill..."
              className="h-9 w-full rounded-full border border-[#E5DACD] bg-white pl-9 pr-3 text-[12.5px] text-[#08182B] placeholder-[#9D9183] transition-all focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
            />
          </div>
        </div>

        {/* Proposals */}
        <div className="mt-6 flex-1 space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF8F5] text-[#C06B3E]">
                <FileText size={28} />
              </div>
              <h3 className="font-manrope text-[17px] font-bold text-[#08182B]">{bids.length === 0 ? 'No proposals yet' : 'No proposals in this view'}</h3>
              <p className="mt-1 max-w-sm text-[13px] text-[#7A7065]">
                {bids.length === 0 ? 'Freelancers who bid on this project will appear here.' : 'Try another tab or search term.'}
              </p>
            </div>
          ) : (
            filtered.map((bid) => {
              const state = tabOf(bid)
              const isAccepted = state === 'accepted'
              const isShortlisted = state === 'shortlisted'
              const isRejected = state === 'rejected'
              const pr = profiles[bid.freelancerId]
              const badge = badgeFor(pr)
              const files = splitList(bid.attachmentUrls)
              const portfolio = pr?.portfolioUrl || pr?.githubUrl
              return (
                <div
                  key={bid.id}
                  className={`relative rounded-[20px] border p-5 transition-all duration-200 sm:p-6 ${
                    isAccepted
                      ? 'border-[#86EFAC] bg-[#F0FDF4]/50 shadow-xs ring-2 ring-[#16A34A]/20'
                      : isShortlisted
                      ? 'border-[#BFDBFE] bg-[#EFF6FF]/40'
                      : isRejected
                      ? 'border-[#F1F5F9] bg-[#FAF8F5]/60 opacity-75'
                      : 'border-[#E5E7EB] bg-white hover:border-[#DEBBA5] hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {bid.freelancerAvatarUrl || pr?.avatarUrl ? (
                          <img src={fileUrl(bid.freelancerAvatarUrl || pr?.avatarUrl)} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-xs sm:h-14 sm:w-14" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#08182B] font-manrope text-[18px] font-bold text-white shadow-xs sm:h-14 sm:w-14">
                            {initials(bid.freelancerName)}
                          </div>
                        )}
                        {pr?.kycStatus === 'VERIFIED' && (
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white ring-2 ring-white" title="KYC verified">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">{bid.freelancerName || 'Freelancer'}</h3>
                          {badge && <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${badge.cls}`}>{badge.label}</span>}
                          {isAccepted && <span className="rounded-full bg-[#16A34A] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">✓ Hired</span>}
                          {isShortlisted && <span className="rounded-full bg-[#2563EB] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">⭐ Shortlisted</span>}
                          {isRejected && <span className="rounded-full bg-[#EF4444] px-2 py-0.5 text-[10.5px] font-bold text-white">Declined</span>}
                        </div>
                        {(pr?.collegeUniversity || pr?.degreeField || pr?.professionalTitle) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[12px] text-[#64748B]">
                            {pr?.collegeUniversity && (
                              <span className="flex items-center gap-1 font-medium text-[#08182B]">
                                <GraduationCap size={14} className="text-[#C06B3E]" />
                                {pr.collegeUniversity}
                              </span>
                            )}
                            {pr?.collegeUniversity && (pr?.degreeField || pr?.professionalTitle) && <span>•</span>}
                            {(pr?.degreeField || pr?.professionalTitle) && <span>{pr?.degreeField || pr?.professionalTitle}</span>}
                          </div>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-[#7A7065]">
                          {pr && pr.completedProjects > 0 ? (
                            <>
                              <span className="flex items-center gap-1 font-bold text-[#08182B]">
                                <Star size={13} className="fill-[#F59E0B] text-[#F59E0B]" />
                                {Number(pr.rating || 0).toFixed(1)}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-[#16A34A]">
                                {pr.completedProjects} {pr.completedProjects === 1 ? 'project' : 'projects'} completed
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-[#64748B]">New on Hunhar</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#94A3B8]">
                            <Clock size={12} />
                            Applied {timeAgo(bid.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 self-start rounded-[16px] border border-[#F0ECE6] bg-[#FAF8F5] px-4 py-3 sm:gap-6 lg:self-center">
                      <div className="text-left">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Bid Price</span>
                        <div className="font-manrope text-[18px] font-extrabold text-[#C06B3E]">{formatINR(bid.proposedCost)}</div>
                      </div>
                      <div className="h-8 w-px bg-[#E5DACD]" />
                      <div className="text-left">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Delivery Time</span>
                        <div className="font-manrope text-[14.5px] font-bold text-[#08182B]">
                          {bid.deliveryTimelineDays} {bid.deliveryTimelineDays === 1 ? 'Day' : 'Days'}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-[#E5DACD]" />
                      <div className="text-left">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Attachments</span>
                        <div className="font-manrope text-[14.5px] font-bold text-[#08182B]">{files.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[14px] border border-[#F0ECE6] bg-[#FAF8F5]/80 p-3.5 text-[13px] leading-relaxed text-[#475569]">
                    <p className="line-clamp-2">
                      <span className="font-bold text-[#08182B]">Proposal Note: </span>
                      {bid.proposalMessage}
                    </p>
                  </div>

                  {(pr?.skills?.length || portfolio) && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                      {(pr?.skills || []).slice(0, 6).map((skill) => (
                        <span key={skill} className="rounded-full border border-[#E2E8F0] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                          {skill}
                        </span>
                      ))}
                      {portfolio && (
                        <a href={portfolio} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#C06B3E] hover:underline">
                          <ExternalLink size={12} />
                          <span>View Portfolio</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1EBE4] pt-4">
                    <button type="button" onClick={() => setSelectedBid(bid)} className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold text-[#08182B] hover:text-[#C06B3E]">
                      <Eye size={14} />
                      <span>View Full Proposal</span>
                    </button>
                    <div className="flex items-center gap-2.5">
                      {canDecide && !isAccepted && !isRejected && (
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() =>
                            act('sl-' + bid.id, () => clientApi.shortlistBid(bid.id, !isShortlisted), isShortlisted ? 'Removed from shortlist' : 'Shortlisted — the freelancer has been notified')
                          }
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12px] font-bold transition-all disabled:opacity-60 ${
                            isShortlisted ? 'border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]' : 'border border-[#E5DACD] bg-white text-[#524B42] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <Star size={13} className={isShortlisted ? 'fill-[#2563EB] text-[#2563EB]' : 'text-[#8E8376]'} />
                          <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => chat(bid)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#E5DACD] bg-white px-3.5 py-2 text-[12px] font-bold text-[#524B42] transition-all hover:bg-[#FAF8F5]"
                      >
                        <MessageSquare size={13} className="text-[#C06B3E]" />
                        <span>Chat</span>
                      </button>
                      {canDecide && !isAccepted && !isRejected && (
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => window.confirm('Decline this proposal? The freelancer is notified.') && act('rj-' + bid.id, () => clientApi.rejectBid(bid.id), 'Proposal declined')}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-transparent px-2.5 py-2 text-[12px] font-semibold text-[#94A3B8] transition-all hover:bg-[#FEF2F2] hover:text-[#EF4444] disabled:opacity-60"
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </button>
                      )}
                      {isAccepted ? (
                        <Link
                          to={`/client/projects/${toRouteId(project.id)}`}
                          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#16A34A] px-4 py-2 text-[12.5px] font-extrabold text-white no-underline shadow-xs hover:bg-[#15803D]"
                        >
                          <Check size={14} />
                          <span>Manage in Workspace</span>
                        </Link>
                      ) : (
                        canDecide &&
                        !isRejected && (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => setShowAcceptModal(bid)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-[#08182B] px-4 py-2 text-[12.5px] font-extrabold text-white transition-all hover:bg-[#C06B3E] hover:shadow-sm disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} className="text-[#86EFAC]" />
                            <span>Accept & Hire Freelancer</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Full proposal */}
      {selectedBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-manrope backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#E5DACD] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between border-b border-[#F0ECE6] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C06B3E]">Proposal Details</span>
                <h2 className="mt-0.5 text-[20px] font-extrabold text-[#08182B]">{selectedBid.freelancerName || 'Freelancer'}'s Proposal</h2>
              </div>
              <button type="button" onClick={() => setSelectedBid(null)} className="cursor-pointer rounded-full p-1.5 text-[#94A3B8] hover:bg-[#FAF8F5] hover:text-[#08182B]">
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[14px] border border-[#EFE8DF] bg-[#FAF8F5] p-3">
                  <span className="text-[11px] font-bold uppercase text-[#8C9BA8]">Quoted Amount</span>
                  <div className="text-[18px] font-extrabold text-[#C06B3E]">{formatINR(selectedBid.proposedCost)}</div>
                </div>
                <div className="rounded-[14px] border border-[#EFE8DF] bg-[#FAF8F5] p-3">
                  <span className="text-[11px] font-bold uppercase text-[#8C9BA8]">Timeline</span>
                  <div className="text-[16px] font-bold text-[#08182B]">{selectedBid.deliveryTimelineDays} days</div>
                </div>
                <div className="rounded-[14px] border border-[#EFE8DF] bg-[#FAF8F5] p-3">
                  <span className="text-[11px] font-bold uppercase text-[#8C9BA8]">Rating</span>
                  <div className="flex items-center gap-1 text-[16px] font-bold text-[#08182B]">
                    {profiles[selectedBid.freelancerId]?.completedProjects ? (
                      <>
                        <Star size={13} className="fill-[#F59E0B] text-[#F59E0B]" />
                        {Number(profiles[selectedBid.freelancerId].rating || 0).toFixed(1)}
                      </>
                    ) : (
                      'New'
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-1.5 text-[13px] font-bold text-[#08182B]">Proposal:</h4>
                <div className="whitespace-pre-line rounded-[16px] border border-[#F0ECE6] bg-[#FAF8F5] p-4 text-[13px] leading-relaxed text-[#475569]">{selectedBid.proposalMessage}</div>
              </div>
              {profiles[selectedBid.freelancerId]?.bio && (
                <div>
                  <h4 className="mb-1.5 text-[13px] font-bold text-[#08182B]">About the freelancer:</h4>
                  <p className="text-[13px] leading-relaxed text-[#475569]">{profiles[selectedBid.freelancerId].bio}</p>
                </div>
              )}
              <div>
                <h4 className="mb-2 text-[13px] font-bold text-[#08182B]">Attachments:</h4>
                {splitList(selectedBid.attachmentUrls).length === 0 ? (
                  <p className="text-[12.5px] text-[#94A3B8]">No files attached.</p>
                ) : (
                  <div className="space-y-2">
                    {splitList(selectedBid.attachmentUrls).map((u) => (
                      <a
                        key={u}
                        href={fileUrl(u)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] p-3 text-[12.5px] font-semibold text-[#08182B] no-underline hover:border-[#C06B3E]"
                      >
                        <span className="flex items-center gap-2">
                          <Paperclip size={14} className="text-[#C06B3E]" />
                          {fileName(u)}
                        </span>
                        <ExternalLink size={13} className="text-[#94A3B8]" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-[#F0ECE6] pt-3">
                <button type="button" onClick={() => setSelectedBid(null)} className="cursor-pointer rounded-[10px] px-4 py-2 text-[13px] font-bold text-[#64748B] hover:bg-[#FAF8F5]">
                  Close
                </button>
                {canDecide && tabOf(selectedBid) !== 'accepted' && tabOf(selectedBid) !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBid
                      setSelectedBid(null)
                      setShowAcceptModal(b)
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-[#A95A30]"
                  >
                    <CheckCircle2 size={15} />
                    <span>Hire This Freelancer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm hire */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-manrope backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[24px] border border-[#E5DACD] bg-white p-6 shadow-2xl sm:p-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF7EE] text-[#16A34A]">
              <ShieldCheck size={32} strokeWidth={2.2} />
            </div>
            <h3 className="text-center text-[20px] font-extrabold text-[#08182B]">Hire {showAcceptModal.freelancerName || 'this freelancer'}?</h3>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#64748B]">
              The project starts and every other proposal is declined. No money moves now: you add milestones and fund each one from your wallet, and it is released only when you approve the work.
            </p>
            <div className="my-5 space-y-2 rounded-[16px] border border-[#F0ECE6] bg-[#FAF8F5] p-4 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-[#7A7065]">Freelancer:</span>
                <span className="font-bold text-[#08182B]">{showAcceptModal.freelancerName}</span>
              </div>
              {profiles[showAcceptModal.freelancerId]?.collegeUniversity && (
                <div className="flex justify-between">
                  <span className="text-[#7A7065]">College:</span>
                  <span className="font-semibold text-[#08182B]">{profiles[showAcceptModal.freelancerId].collegeUniversity}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#7A7065]">Agreed price:</span>
                <span className="font-extrabold text-[#C06B3E]">{formatINR(showAcceptModal.proposedCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7065]">Timeline:</span>
                <span className="font-semibold text-[#08182B]">{showAcceptModal.deliveryTimelineDays} days</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowAcceptModal(null)} className="flex-1 cursor-pointer rounded-[12px] border border-[#E5DACD] bg-white py-2.5 text-[13px] font-bold text-[#64748B] hover:bg-[#FAF8F5]">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  const b = showAcceptModal
                  setShowAcceptModal(null)
                  act('hire-' + b.id, () => bidsApi.awardBid(b.id), `${b.freelancerName || 'Freelancer'} hired! A chat has been opened with them.`)
                }}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#16A34A] py-2.5 text-[13px] font-bold text-white shadow-xs hover:bg-[#15803D] disabled:opacity-60"
              >
                Confirm & Hire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
