import MilestoneCardBoard from '../../components/dashboard/MilestoneCardBoard'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Star,
  MessageSquare,
  CheckCircle2,
  X,
  Paperclip,
  UploadCloud,
  ArrowDownCircle,
  ShieldAlert,
  ShieldCheck,
  Users2,
  Pencil,
} from 'lucide-react'
import {
  bidsApi,
  clientApi,
  disputesApi,
  fileUrl,
  filesApi,
  invoicesApi,
  messagesApi,
  profileApi,
  projectsApi,
  walletApi,
  workspaceApi,
  type Bid,
  type Dispute,
  type FreelancerProfile,
  type MilestoneStatus,
  type Project,
  type Workspace,
} from '../../services/api'
import {
  BID_STATUS_LABEL,
  BID_STATUS_STYLE,
  deadlineLabel,
  fileExtension,
  formatBytes,
  formatDate,
  formatINR,
  initials,
  splitList,
  timeAgo,
} from '../../services/format'
import { usePlatformSettings } from '../../services/usePlatformSettings'
import { getCharacterAvatar } from '../../services/characterAvatars'
import { toRouteId, fromRouteId } from '../../services/routeIds'

type Tab = 'proposals' | 'workspace' | 'files' | 'disputes'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-[#FEF3C7] text-[#B45309]' },
  OPEN: { label: 'Open for Bids', cls: 'bg-[#EBF7EE] text-[#16A34A]' },
  ACTIVE: { label: 'In progress', cls: 'bg-[#EEF2FF] text-[#4F46E5]' },
  COMPLETED: { label: 'Completed', cls: 'bg-[#F1F5F9] text-[#64748B]' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-[#FEF2F2] text-[#EF4444]' },
}

const MILESTONE_LABEL: Record<MilestoneStatus, string> = {
  PENDING: 'Not funded',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Work submitted',
  APPROVED: 'Approved — pay now',
  PAID: 'Paid',
}

const MILESTONE_STYLE: Record<MilestoneStatus, string> = {
  PENDING: 'bg-[#F1F5F9] text-[#64748B]',
  IN_PROGRESS: 'bg-[#E0F2FE] text-[#0369A1]',
  SUBMITTED: 'bg-[#EDE9FE] text-[#6D28D9]',
  APPROVED: 'bg-[#FEF3C7] text-[#B45309]',
  PAID: 'bg-[#DCFCE7] text-[#15803D]',
}

const input =
  'h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 font-manrope text-[13px] text-[#08182B] outline-none focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15'

function Avatar({ name, url, id, size = 'h-11 w-11' }: { name?: string; url?: string | null; id?: string; size?: string }) {
  const src = url ? fileUrl(url) : getCharacterAvatar(id || name)
  return <img src={src} alt={name || 'Avatar'} className={`${size} shrink-0 rounded-full object-cover ring-1 ring-[#DECFBE]/60`} />
}


export default function ClientProjectDetailPage(): React.JSX.Element {
  const { projectId: projectToken = '' } = useParams<{ projectId: string }>()
  const projectId = fromRouteId(projectToken)
  const navigate = useNavigate()
  const { commissionPercent } = usePlatformSettings()
  const [project, setProject] = useState<Project | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [ws, setWs] = useState<Workspace | null>(null)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('proposals')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [profile, setProfile] = useState<FreelancerProfile | null>(null)
  const [hireModalBid, setHireModalBid] = useState<Bid | null>(null)
  const [declineModalBid, setDeclineModalBid] = useState<Bid | null>(null)
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [cancelProjectConfirmOpen, setCancelProjectConfirmOpen] = useState(false)
  const [releaseTarget, setReleaseTarget] = useState<{ id: string; amount: number; freelancerName?: string } | null>(null)
  const [disputeText, setDisputeText] = useState('')
  const filesRef = useRef<HTMLInputElement>(null)

  const flash = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text })
    window.setTimeout(() => setNotice(null), 4500)
  }

  const load = useCallback(async () => {
    try {
      const p = await projectsApi.getProjectById(projectId)
      setProject(p)
      const [b, w, d, wal] = await Promise.allSettled([
        bidsApi.getProjectBids(projectId),
        p.status === 'ACTIVE' || p.status === 'COMPLETED' ? workspaceApi.get(projectId) : Promise.resolve(null),
        p.awardedFreelancerId ? disputesApi.forProject(projectId) : Promise.resolve([] as Dispute[]),
        walletApi.getMyWallet(),
      ])
      if (b.status === 'fulfilled') setBids(b.value)
      if (w.status === 'fulfilled') setWs(w.value)
      if (d.status === 'fulfilled') setDisputes(d.value)
      if (wal.status === 'fulfilled') setWalletBalance(Number(wal.value?.availableBalance ?? 0))
      setError('')
    } catch (err: any) {
      setError(err.status === 403 ? 'This project belongs to another account.' : err.message || 'Could not load this project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])


  // Open the most useful tab once loaded
  useEffect(() => {
    if (project && (project.status === 'ACTIVE' || project.status === 'COMPLETED')) setTab((t) => (t === 'proposals' ? 'workspace' : t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.status])

  const act = async (key: string, fn: () => Promise<unknown>, success: string, reload = true) => {
    setBusy(key)
    try {
      await fn()
      flash('success', success)
      if (reload) await load()
    } catch (err: any) {
      flash('error', err.message || 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const reviewDeliverableItem = async (mId: string, deliverableId: string, approve: boolean) => {
    act(approve ? 'ap-' + mId : 'ch-' + mId, () => clientApi.reviewDeliverable(deliverableId, approve), approve ? 'Work approved' : 'Changes requested — the freelancer has been notified')
  }

  const milestones = ws?.milestones || []
  // Phases come from the agreed milestone plan (server); they run one at a time
  const displayMilestones = milestones
  const unpaid = useMemo(() => displayMilestones.filter((m) => m.milestone.status !== 'PAID'), [displayMilestones])

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center rounded-[24px] bg-white text-[14px] font-semibold text-[#8E8376]">Loading project…</div>
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

  const status = STATUS_BADGE[project.status]
  const activeBids = bids.filter((b) => b.status !== 'WITHDRAWN')
  const canEdit = project.status === 'DRAFT' || (project.status === 'OPEN' && project.bidCount === 0)
  const openDispute = disputes.find((d) => d.status === 'OPEN')

  const hire = (bid: Bid) => {
    setHireModalBid(bid)
  }

  const message = async (freelancerId: string) => {
    try {
      const conv = await messagesApi.startConversation(freelancerId, project.id)
      navigate(`/client/messages?c=${toRouteId(conv.id)}`)
    } catch (err: any) {
      flash('error', err.message)
    }
  }

  const complete = () => {
    setCompleteConfirmOpen(true)
  }

  const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    await act('upload', async () => {
      for (const f of files) await filesApi.upload(f, project.id)
    }, 'File uploaded')
  }

  const raiseDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disputeText.trim().length < 20) return flash('error', 'Please describe the problem in at least 20 characters.')
    await act('dispute', () => disputesApi.raise(project.id, disputeText.trim()), 'Dispute submitted. Hunhar support will contact both of you.')
    setDisputeText('')
  }

  const tabs: [Tab, string][] = [
    ['proposals', `Proposals (${activeBids.length})`],
    ...(ws ? ([['workspace', 'Workspace'], ['files', `Files (${ws.files.length})`]] as [Tab, string][]) : []),
    ...(project.awardedFreelancerId ? ([['disputes', `Disputes${disputes.length ? ` (${disputes.length})` : ''}`]] as [Tab, string][]) : []),
  ]

  return (
    <div className="flex w-full flex-col gap-5 pb-14 font-manrope">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/client/projects" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#64748B] no-underline hover:text-[#08182B]">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="flex items-center gap-4">
          {project.status === 'OPEN' && activeBids.length > 0 && (
            <Link to={`/client/projects/${toRouteId(project.id)}/bids`} className="text-[12.5px] font-bold text-[#C06B3E] no-underline hover:underline">
              Proposals board →
            </Link>
          )}
          {(project.status === 'ACTIVE' || project.status === 'COMPLETED') && (
            <Link to={`/client/projects/${toRouteId(project.id)}/tracking`} className="text-[12.5px] font-bold text-[#C06B3E] no-underline hover:underline">
              Tracking view →
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <div role="status" className={`rounded-[12px] border p-3 text-[13px] font-semibold ${notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {notice.text}
        </div>
      )}

      {/* Header */}
      <div className="rounded-[24px] border border-[#E9EBEF]/60 bg-white p-5 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-makira text-[22px] font-medium tracking-wide text-[#08182B] sm:text-[28px]">{project.title}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold font-manrope ${status.cls}`}>{status.label}</span>
            </div>
            <p className="mt-1 text-[13px] text-[#7A7065]">
              {project.category}
              {project.subCategory ? ` · ${project.subCategory}` : ''} · Posted {formatDate(project.createdAt, true)} · {project.timelineDays} day timeline
              {project.freelancerName ? ` · Hired: ${project.freelancerName}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            <span className="text-[24px] font-extrabold text-[#C06B3E]">{formatINR(ws?.agreedAmount ?? project.budget)}</span>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Link to={`/client/create-project?edit=${toRouteId(project.id)}`} className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E2E8F0] px-3.5 py-2 text-[12.5px] font-bold text-[#08182B] no-underline hover:bg-[#F8FAFC]">
                  <Pencil size={13} /> Edit
                </Link>
              )}
              {project.status === 'DRAFT' && (
                <button type="button" disabled={busy !== null} onClick={() => act('publish', () => clientApi.publishProject(project.id), 'Project published — freelancers can now send proposals.')} className="rounded-[10px] bg-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60">
                  Publish
                </button>
              )}
              {(project.status === 'DRAFT' || project.status === 'OPEN') && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setCancelProjectConfirmOpen(true)}
                  className="rounded-[10px] px-3 py-2 text-[12.5px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] disabled:opacity-60 cursor-pointer"
                >
                  Cancel project
                </button>
              )}
              {project.status === 'ACTIVE' && (
                <button type="button" disabled={busy !== null} onClick={complete} className="rounded-[10px] bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#12294A] disabled:opacity-60">
                  Mark complete
                </button>
              )}
            </div>
          </div>
        </div>

        {(project.status === 'ACTIVE' || project.status === 'COMPLETED') && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[14px] bg-[#FAF6F1] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C9BA8]">Progress</span>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]" style={{ width: `${project.progressPercentage}%` }} />
              </div>
              <span className="mt-1 block text-[13px] font-bold text-[#08182B]">{project.progressPercentage}%</span>
            </div>
            <div className="rounded-[14px] bg-[#FAF6F1] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C9BA8]">Deadline</span>
              <span className="mt-1 flex items-center gap-1.5 text-[14px] font-bold text-[#08182B]">
                <Clock size={14} /> {deadlineLabel(project)}
              </span>
            </div>
            <div className="rounded-[14px] bg-[#FAF6F1] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C9BA8]">Wallet balance</span>
              <span className="mt-1 block text-[14px] font-bold text-[#08182B]">{walletBalance === null ? '—' : formatINR(walletBalance)}</span>
              <Link to="/client/payments" className="text-[12px] font-bold text-[#C06B3E] no-underline">Add funds</Link>
            </div>
          </div>
        )}

        <p className="mt-5 whitespace-pre-line text-[13.5px] leading-relaxed text-[#4A5568]">{project.description}</p>
        {splitList(project.skills).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {splitList(project.skills).map((s) => (
              <span key={s} className="rounded-[8px] bg-[#F5ECE1] px-2.5 py-1 text-[11.5px] font-medium text-[#6F6457]">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 overflow-x-auto border-b border-[#EBEBEB] px-1" role="tablist">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`relative whitespace-nowrap pb-3 text-[14.5px] font-bold ${tab === key ? 'text-[#C06B3E]' : 'text-[#7A7065] hover:text-[#08182B]'}`}
          >
            {label}
            {tab === key && <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-[#C06B3E]" />}
          </button>
        ))}
      </div>

      {/* PROPOSALS */}
      {tab === 'proposals' && (
        <div className="flex flex-col gap-4">
          {project.status === 'DRAFT' && (
            <div className="rounded-[14px] border border-[#FCD34D] bg-[#FFFBEB] p-4 text-[13px] font-semibold text-[#92400E]">
              This is a draft. Publish it so freelancers can see it and send proposals.
            </div>
          )}
          {activeBids.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#E2E8F0] bg-white p-10 text-center text-[13.5px] text-[#8C9BA8]">
              {project.status === 'OPEN' ? 'No proposals yet. You will get a notification for every new proposal.' : 'No proposals.'}
            </div>
          ) : (
            activeBids.map((b) => (
              <div key={b.id} className="rounded-[18px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={b.freelancerName} url={b.freelancerAvatarUrl} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-bold text-[#08182B]">{b.freelancerName || 'Freelancer'}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${BID_STATUS_STYLE[b.status]}`}>{BID_STATUS_LABEL[b.status]}</span>
                      </div>
                      <p className="text-[12px] text-[#8C9BA8]">Sent {timeAgo(b.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="block text-[18px] font-extrabold text-[#08182B]">{formatINR(b.proposedCost)}</span>
                    <span className="text-[12px] text-[#8C9BA8]">in {b.deliveryTimelineDays} day{b.deliveryTimelineDays === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[#4A5568]">{b.proposalMessage}</p>
                {splitList(b.attachmentUrls).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {splitList(b.attachmentUrls).map((u, i) => (
                      <a key={u} href={fileUrl(u) + '?download=true'} className="flex items-center gap-1 rounded-full bg-[#FAF7F2] px-3 py-1 text-[11.5px] font-semibold text-[#08182B] no-underline">
                        <Paperclip size={12} /> Sample {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#F5F2ED] pt-3">
                  <button type="button" onClick={() => profileApi.getPublic(b.freelancerId).then(setProfile).catch((e) => flash('error', e.message))} className="rounded-[10px] border border-[#E2E8F0] px-3.5 py-1.5 text-[12.5px] font-bold text-[#08182B] hover:bg-[#F8FAFC]">
                    View profile
                  </button>
                  <button type="button" onClick={() => message(b.freelancerId)} className="flex items-center gap-1 rounded-[10px] border border-[#E2E8F0] px-3.5 py-1.5 text-[12.5px] font-bold text-[#08182B] hover:bg-[#F8FAFC]">
                    <MessageSquare size={13} /> Message
                  </button>
                  {project.status === 'OPEN' && (b.status === 'SUBMITTED' || b.status === 'SHORTLISTED') && (
                    <>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => act('sl-' + b.id, () => clientApi.shortlistBid(b.id, b.status !== 'SHORTLISTED'), b.status === 'SHORTLISTED' ? 'Removed from shortlist' : 'Shortlisted — the freelancer has been notified')}
                        className="flex items-center gap-1 rounded-[10px] border border-[#E2E8F0] px-3.5 py-1.5 text-[12.5px] font-bold text-[#6D28D9] hover:bg-[#F5F3FF] disabled:opacity-60"
                      >
                        <Star size={13} className={b.status === 'SHORTLISTED' ? 'fill-[#6D28D9]' : ''} /> {b.status === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist'}
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => setDeclineModalBid(b)}
                        className="rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] disabled:opacity-60 cursor-pointer transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => hire(b)}
                        className="ml-auto rounded-[10px] bg-[#C06B3E] px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-[#A95A30] disabled:opacity-60 cursor-pointer transition-colors"
                      >
                        {busy === 'hire-' + b.id ? 'Hiring…' : 'Hire'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* WORKSPACE */}
      {tab === 'workspace' && ws && (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-makira text-[17px] font-medium uppercase tracking-wider text-[#08182B]">Milestones</h3>
              </div>
              <p className="mt-1 text-[12.5px] text-[#8C9BA8]">
                Phases run one at a time. In each phase the freelancer lists the sub-tasks; you approve them and pay (held in escrow), the freelancer delivers, you approve and release the payment — then the next phase opens. The freelancer receives each payment minus the {commissionPercent}% platform fee.
              </p>


              <div className="mt-4 flex flex-col gap-3">
                {displayMilestones.length === 0 && <p className="rounded-[14px] border border-dashed border-[#DCD3C7] p-5 text-center text-[13px] text-[#8E8376]">No phases yet. They appear once the milestone plan is accepted.</p>}
                {displayMilestones.map((view) => {
                  const { milestone: m, deliverables } = view
                  const latest = deliverables[0]
                  const locked = view.phaseState === 'LOCKED'
                  return (
                    <div key={m.id} className="rounded-[14px] border border-[#F0ECE6] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-[14px] font-bold text-[#08182B]">
                            {view.phaseNumber ? <span className="mr-1.5 rounded-full bg-[#F4EFE6] px-2 py-0.5 text-[11px] font-bold text-[#6B5E51]">Phase {view.phaseNumber}</span> : null}
                            {m.title}
                          </h4>
                          <p className="text-[12px] text-[#8C9BA8]">
                            {formatINR(m.amount)}
                            {m.dueDate ? ` · due ${formatDate(m.dueDate)}` : ''}
                            {m.funded && m.status !== 'PAID' ? ' · in escrow' : ''}
                            {m.paidAt ? ` · paid ${formatDate(m.paidAt)}` : ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${locked ? 'bg-[#F1F5F9] text-[#64748B]' : MILESTONE_STYLE[m.status]}`}>
                          {locked ? 'Locked' : m.status === 'PENDING' && m.funded ? 'Funded' : m.status === 'PENDING' && m.tasksSubmittedAt ? 'Awaiting your approval' : MILESTONE_LABEL[m.status]}
                        </span>
                      </div>
                      {m.description && <p className="mt-1.5 text-[12.5px] text-[#5C5248]">{m.description}</p>}

                      <MilestoneCardBoard view={view} role={project.status === 'ACTIVE' ? 'CLIENT' : 'VIEWER'} onChanged={load} />

                      {latest && (
                        <div className="mt-2.5 rounded-[10px] bg-[#FAF7F2] p-3 text-[12.5px] text-[#4A4036]">
                          <span className="font-bold">Submitted {formatDate(latest.createdAt)}:</span> {latest.notes}
                          {splitList(latest.fileUrls).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {splitList(latest.fileUrls).map((u, i) => (
                                <a key={u} href={fileUrl(u) + '?download=true'} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#08182B] no-underline">
                                  <Paperclip size={11} /> File {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {project.status === 'ACTIVE' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.status === 'SUBMITTED' && latest && (
                            <>
                              <button type="button" disabled={busy !== null} onClick={() => reviewDeliverableItem(m.id, latest.id, true)} className="flex items-center gap-1 rounded-[10px] bg-[#16A34A] px-3.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-60 cursor-pointer">
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button type="button" disabled={busy !== null} onClick={() => reviewDeliverableItem(m.id, latest.id, false)} className="rounded-[10px] border border-[#E2E8F0] px-3.5 py-1.5 text-[12px] font-bold text-[#B45309] disabled:opacity-60 cursor-pointer">
                                Request changes
                              </button>
                            </>
                          )}
                          {m.status === 'APPROVED' && (
                            <button
                              type="button"
                              disabled={busy !== null || !m.funded}
                              title={!m.funded ? 'Fund the milestone first' : undefined}
                              onClick={() => setReleaseTarget({ id: m.id, amount: m.amount, freelancerName: project.freelancerName || 'the freelancer' })}
                              className="rounded-[10px] bg-[#C06B3E] px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-[#AA572D] disabled:opacity-60 cursor-pointer"
                            >
                              {busy === 'rel-' + m.id ? 'Releasing…' : 'Release payment'}
                            </button>
                          )}
                        </div>
                      )}
                      {m.invoiceNumber && (
                        <button type="button" onClick={() => invoicesApi.download(m.invoiceNumber!).catch((e) => flash('error', e.message))} className="mt-2 flex items-center gap-1 text-[12px] font-bold text-[#C06B3E]">
                          <ArrowDownCircle size={13} /> Invoice {m.invoiceNumber}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
              <h3 className="font-makira text-[15px] font-medium uppercase tracking-wider text-[#08182B]">Freelancer</h3>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={project.freelancerName} />
                <div>
                  <h4 className="text-[15px] font-bold text-[#08182B]">{project.freelancerName || 'Freelancer'}</h4>
                  <span className="text-[12px] text-[#8C9BA8]">Agreed {formatINR(ws.agreedAmount)} · {ws.agreedTimelineDays} days</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => project.awardedFreelancerId && profileApi.getPublic(project.awardedFreelancerId).then(setProfile)} className="rounded-[10px] border border-[#E2E8F0] py-2 text-[12.5px] font-bold text-[#08182B]">
                  Profile
                </button>
                <button type="button" onClick={() => project.awardedFreelancerId && message(project.awardedFreelancerId)} className="rounded-[10px] bg-[#08182B] py-2 text-[12.5px] font-bold text-white">
                  Message
                </button>
              </div>
            </div>

            {ws.team.filter((t) => t.status === 'ACCEPTED').length > 0 && (
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5">
                <h3 className="flex items-center gap-1.5 font-makira text-[15px] font-medium uppercase tracking-wider text-[#08182B]">
                  <Users2 size={15} /> Team
                </h3>
                {ws.team.filter((t) => t.status === 'ACCEPTED').map((t) => (
                  <div key={t.id} className="mt-3 flex items-center gap-2.5">
                    <Avatar name={t.collaboratorName} url={t.collaboratorAvatarUrl} size="h-9 w-9" />
                    <div>
                      <span className="block text-[13px] font-bold text-[#08182B]">{t.collaboratorName}</span>
                      <span className="text-[11.5px] text-[#8C9BA8]">{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILES */}
      {tab === 'files' && ws && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#8C9BA8]">Files shared on this project.</p>
            <input ref={filesRef} type="file" multiple className="hidden" onChange={uploadFiles} />
            <button type="button" disabled={busy !== null} onClick={() => filesRef.current?.click()} className="flex items-center gap-1.5 rounded-full bg-[#08182B] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60">
              <UploadCloud size={15} /> {busy === 'upload' ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          {ws.files.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#DCD3C7] bg-white p-8 text-center text-[13px] text-[#8E8376]">No files yet.</div>
          ) : (
            ws.files.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[#EBEBEB] bg-white px-5 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#F4F4F4] text-[11px] font-bold text-[#6B7280]">{fileExtension(f.originalName)}</div>
                  <div className="min-w-0">
                    <h4 className="truncate text-[14.5px] font-bold text-[#08182B]">{f.originalName}</h4>
                    <p className="text-[12.5px] text-[#8E8376]">{formatBytes(f.sizeBytes)} · {f.ownerName || 'Team'} · {formatDate(f.createdAt)}</p>
                  </div>
                </div>
                <a href={fileUrl(f.url) + '?download=true'} className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 text-[13px] font-bold text-white no-underline" aria-label={`Download ${f.originalName}`}>
                  <ArrowDownCircle size={16} />
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* DISPUTES */}
      {tab === 'disputes' && (
        <div className="flex flex-col gap-4">
          {disputes.map((d) => (
            <div key={d.id} className="rounded-[18px] border border-[#E5E7EB] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-[#08182B]">Raised by {d.raisedByName || 'participant'} · {formatDate(d.createdAt, true)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${d.status === 'OPEN' ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#DCFCE7] text-[#15803D]'}`}>{d.status}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-[13px] text-[#4A5568]">{d.reason}</p>
              {d.resolutionNotes && <p className="mt-2 rounded-[10px] bg-[#F0FDF4] p-3 text-[12.5px] text-[#166534]"><strong>Decision:</strong> {d.resolutionNotes}</p>}
            </div>
          ))}
          {!openDispute && project.status === 'ACTIVE' && (
            <form onSubmit={raiseDispute} className="rounded-[18px] border border-[#FECACA] bg-[#FFF5F5] p-5">
              <h3 className="flex items-center gap-1.5 font-makira text-[16px] font-medium uppercase tracking-wider text-[#B91C1C]"><ShieldAlert size={16} /> Raise a dispute</h3>
              <p className="mt-1 text-[12.5px] text-[#7F1D1D]">Use this only if you can't sort it out with the freelancer. Hunhar support will review and contact both of you.</p>
              <textarea value={disputeText} onChange={(e) => setDisputeText(e.target.value)} maxLength={4000} placeholder="What went wrong? Include dates and what you expected." className={input + ' mt-3 h-28 py-2'} />
              <button type="submit" disabled={busy !== null} className="mt-3 rounded-full bg-[#DC2626] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
                {busy === 'dispute' ? 'Submitting…' : 'Submit dispute'}
              </button>
            </form>
          )}
          {disputes.length === 0 && project.status !== 'ACTIVE' && <p className="text-[13px] text-[#8C9BA8]">No disputes.</p>}
        </div>
      )}

      {/* Freelancer profile modal */}
      {profile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" onClick={() => setProfile(null)}>
          <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] bg-white p-6 sm:max-w-[560px] sm:rounded-[24px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={profile.fullName} url={profile.avatarUrl} size="h-14 w-14" />
                <div>
                  <h3 className="text-[18px] font-extrabold text-[#08182B]">{profile.fullName}</h3>
                  <p className="text-[13px] text-[#7A7065]">{profile.professionalTitle || 'Freelancer'}{profile.location ? ` · ${profile.location}` : ''}</p>
                  <p className="text-[12px] text-[#8C9BA8]">
                    {profile.completedProjects > 0 ? `★ ${profile.rating.toFixed(1)} · ${profile.completedProjects} projects` : 'New on Hunhar'}
                    {profile.kycStatus === 'VERIFIED' ? ' · KYC verified' : ''}
                    {profile.hourlyRate != null ? ` · ${formatINR(profile.hourlyRate)}/hr` : ''}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setProfile(null)} aria-label="Close" className="rounded-full bg-[#F4F4F5] p-1.5 text-[#71717A]"><X size={16} /></button>
            </div>
            <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-[#4A5568]">{profile.bio || 'No bio yet.'}</p>
            {profile.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((s) => <span key={s} className="rounded-[8px] bg-[#F5ECE1] px-2.5 py-1 text-[11.5px] text-[#6F6457]">{s}</span>)}
              </div>
            )}
            {profile.portfolio.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {profile.portfolio.slice(0, 4).map((p) => (
                  <a key={p.id} href={p.link || undefined} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-[12px] border border-[#EFECE6] no-underline">
                    {p.imageUrl ? <img src={fileUrl(p.imageUrl)} alt="" className="h-20 w-full object-cover" /> : <div className="h-20 bg-[#F5ECE1]" />}
                    <span className="block truncate p-2 text-[12px] font-bold text-[#08182B]">{p.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Hire / Accept Bid Confirmation Modal */}
      {hireModalBid && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-manrope backdrop-blur-xs animate-fade-in"
          onClick={() => setHireModalBid(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[24px] border border-[#E5DACD] bg-white p-6 shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setHireModalBid(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#94A3B8] transition-colors hover:bg-[#FAF8F5] hover:text-[#08182B] cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF7EE] text-[#16A34A] shadow-xs">
              <ShieldCheck size={30} strokeWidth={2.2} />
            </div>

            {/* Title & Description */}
            <h3 className="text-center font-makira text-[20px] font-medium tracking-wide text-[#08182B]">
              Hire {hireModalBid.freelancerName || 'this freelancer'}?
            </h3>
            <p className="mt-2 text-center text-[12.5px] sm:text-[13px] leading-relaxed text-[#64748B]">
              The project will be awarded and other proposals will be declined. No payment moves now — you&apos;ll fund milestones as work progresses.
            </p>

            {/* Summary Box */}
            <div className="my-5 space-y-2.5 rounded-[18px] border border-[#F0ECE6] bg-[#FAF8F5] p-4 text-[12.5px] sm:text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#7A7065]">Freelancer:</span>
                <span className="font-bold text-[#08182B] flex items-center gap-2">
                  <Avatar name={hireModalBid.freelancerName} url={hireModalBid.freelancerAvatarUrl} size="h-6 w-6" />
                  <span className="truncate max-w-[160px]">{hireModalBid.freelancerName || 'Freelancer'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7A7065]">Agreed Price:</span>
                <span className="font-extrabold text-[#C06B3E] text-[15px]">{formatINR(hireModalBid.proposedCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7A7065]">Delivery Timeline:</span>
                <span className="font-semibold text-[#08182B]">
                  {hireModalBid.deliveryTimelineDays} day{hireModalBid.deliveryTimelineDays === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHireModalBid(null)}
                className="flex-1 cursor-pointer rounded-[12px] border border-[#E5DACD] bg-white py-2.5 text-[13px] font-bold text-[#64748B] transition-colors hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={async () => {
                  const b = hireModalBid
                  setHireModalBid(null)
                  await act(
                    'hire-' + b.id,
                    () => bidsApi.awardBid(b.id),
                    `${b.freelancerName || 'Freelancer'} hired! A chat has been opened with them.`
                  )
                }}
                className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-[#C06B3E] py-2.5 text-[13px] font-extrabold text-white shadow-sm transition-all hover:bg-[#A95A30] active:scale-98 disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Hire</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Decline Confirmation Modal */}
      {declineModalBid && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-manrope backdrop-blur-xs animate-fade-in"
          onClick={() => setDeclineModalBid(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-[24px] border border-[#FEE2E2] bg-white p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#EF4444]">
              <X size={24} strokeWidth={2.5} />
            </div>
            <h3 className="font-makira text-[19px] font-medium tracking-wide text-[#08182B]">Decline Proposal?</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#64748B]">
              Are you sure you want to decline {declineModalBid.freelancerName || 'this freelancer'}&apos;s proposal? They will be notified.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeclineModalBid(null)}
                className="flex-1 cursor-pointer rounded-[12px] border border-[#E5DACD] bg-white py-2.5 text-[13px] font-bold text-[#64748B] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={async () => {
                  const b = declineModalBid
                  setDeclineModalBid(null)
                  await act('rj-' + b.id, () => clientApi.rejectBid(b.id), 'Proposal declined')
                }}
                className="flex-1 cursor-pointer rounded-[12px] bg-[#EF4444] hover:bg-[#DC2626] py-2.5 text-[13px] font-bold text-white transition-colors disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Project Complete Custom Dialog */}
      <ConfirmDialog
        isOpen={completeConfirmOpen}
        onClose={() => setCompleteConfirmOpen(false)}
        onConfirm={async () => {
          setCompleteConfirmOpen(false)
          act('complete', () => projectsApi.completeProject(project.id), 'Project marked complete. Thank you!')
        }}
        title="Mark Project as Complete?"
        message={`Are you sure you want to mark "${project.title}" as complete?`}
        warning={unpaid.length ? `${unpaid.length} milestone(s) are not paid yet.` : undefined}
        confirmText="Yes, Mark Complete"
        cancelText="Cancel"
        variant={unpaid.length ? 'warning' : 'primary'}
        confirmLoading={busy === 'complete'}
      />

      {/* Cancel Project Custom Dialog */}
      <ConfirmDialog
        isOpen={cancelProjectConfirmOpen}
        onClose={() => setCancelProjectConfirmOpen(false)}
        onConfirm={() => {
          setCancelProjectConfirmOpen(false)
          act('cancel', () => clientApi.cancelProject(project.id), 'Project cancelled')
        }}
        title="Cancel this project?"
        message="Are you sure you want to cancel this project? Freelancers who applied or submitted proposals will be notified."
        confirmText="Yes, Cancel Project"
        cancelText="Keep Project"
        variant="danger"
        confirmLoading={busy === 'cancel'}
      />

      {/* Release Milestone Payment Custom Dialog */}
      <ConfirmDialog
        isOpen={releaseTarget !== null}
        onClose={() => setReleaseTarget(null)}
        onConfirm={() => {
          if (!releaseTarget) return
          const target = releaseTarget
          setReleaseTarget(null)
          act('rel-' + target.id, () => clientApi.releaseMilestone(target.id), 'Payment released. An invoice was created.')
        }}
        title="Release Milestone Payment?"
        message={`Are you sure you want to release ${releaseTarget ? formatINR(releaseTarget.amount) : ''} to ${releaseTarget?.freelancerName || 'the freelancer'}?`}
        confirmText="Release Payment"
        cancelText="Cancel"
        variant="primary"
        confirmLoading={!!busy?.startsWith('rel-')}
      />
    </div>
  )
}
