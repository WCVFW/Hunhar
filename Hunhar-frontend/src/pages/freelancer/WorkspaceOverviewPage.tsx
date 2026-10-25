import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Send,
  Paperclip,
  TrendingUp,
  ArrowDownCircle,
  Receipt,
  UserPlus,
  Plus,
  UploadCloud,
  X,
  FileText,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'
import {
  fileUrl,
  filesApi,
  messagesApi,
  tokenStorage,
  workspaceApi,
  type Milestone,
  type MilestoneStatus,
  type StoredFile,
  type Workspace,
} from '../../services/api'
import {
  PROJECT_STATUS_LABEL,
  deadlineLabel,
  fileExtension,
  formatBytes,
  formatDate,
  formatINR,
  initials,
  isOverdue,
  splitList,
} from '../../services/format'

type TabType = 'overview' | 'files' | 'payments' | 'hustlers'

const MILESTONE_LABEL: Record<MilestoneStatus, string> = {
  PENDING: 'Not started',
  IN_PROGRESS: 'Changes requested',
  SUBMITTED: 'Awaiting review',
  APPROVED: 'Approved',
  PAID: 'Paid',
}

const MILESTONE_STYLE: Record<MilestoneStatus, string> = {
  PENDING: 'bg-[#F1F5F9] text-[#64748B]',
  IN_PROGRESS: 'bg-[#FEF3C7] text-[#B45309]',
  SUBMITTED: 'bg-[#EDE9FE] text-[#6D28D9]',
  APPROVED: 'bg-[#DCFCE7] text-[#15803D]',
  PAID: 'bg-[#DCFCE7] text-[#15803D]',
}

const inputClass =
  'h-10 w-full rounded-[12px] border border-[#DECFBE] bg-[#FDFBF7] px-3 font-manrope text-[13px] text-[#08182B] focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20'

export default function WorkspaceOverviewPage(): React.JSX.Element {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const me = tokenStorage.getUser()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [ws, setWs] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Add milestone form
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msAmount, setMsAmount] = useState('')
  const [msDue, setMsDue] = useState('')
  const [msDesc, setMsDesc] = useState('')
  const [savingMilestone, setSavingMilestone] = useState(false)

  // Submit work form
  const [submitFor, setSubmitFor] = useState<Milestone | null>(null)
  const [workNotes, setWorkNotes] = useState('')
  const [workFiles, setWorkFiles] = useState<StoredFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [submittingWork, setSubmittingWork] = useState(false)
  const workFileRef = useRef<HTMLInputElement>(null)
  const filesTabRef = useRef<HTMLInputElement>(null)

  // Progress
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressDraft, setProgressDraft] = useState(0)
  const [openingChat, setOpeningChat] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await workspaceApi.get(projectId)
      setWs(data)
      setProgressDraft(data.project.progressPercentage)
      setError('')
    } catch (err: any) {
      setError(err.status === 403 ? 'You are not part of this project.' : err.message || 'Could not load the workspace')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const flash = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text })
    window.setTimeout(() => setNotice(null), 4000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[350px] w-full items-center justify-center rounded-[24px] bg-white p-8">
        <span className="font-manrope text-[15px] font-semibold text-[#8E8376]">Loading workspace…</span>
      </div>
    )
  }

  if (error || !ws) {
    return (
      <div className="flex min-h-[350px] w-full flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center font-manrope">
        <h3 className="text-[18px] font-bold text-[#08182B]">Workspace unavailable</h3>
        <p className="mt-1 text-[13px] text-[#7A7065]">{error}</p>
        <Link to="/freelancer/projects" className="mt-4 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white no-underline">
          Back to My Projects
        </Link>
      </div>
    )
  }

  const { project } = ws
  const isLead = ws.myRole === 'OWNER'
  const canDeliver = ws.myRole === 'OWNER' || ws.myRole === 'COLLABORATOR'
  const active = project.status === 'ACTIVE'
  const milestones = ws.milestones
  const current = milestones.find((m) => m.milestone.status !== 'APPROVED' && m.milestone.status !== 'PAID')
  const clientName = project.clientName || 'Client'
  const team = ws.team.filter((t) => t.status === 'ACCEPTED')
  const pendingInvites = ws.team.filter((t) => t.status === 'INVITED')
  const attachments = splitList(project.attachmentUrls)
  const milestoneTotal = milestones.reduce((sum, m) => sum + Number(m.milestone.amount || 0), 0)

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(msAmount)
    if (!msTitle.trim()) return flash('error', 'Please give the milestone a title.')
    if (!(amount >= 50)) return flash('error', 'Milestone amount must be at least ₹50.')
    setSavingMilestone(true)
    try {
      await workspaceApi.addMilestone(projectId, {
        title: msTitle.trim(),
        description: msDesc.trim() || undefined,
        amount,
        dueDate: msDue ? new Date(msDue + 'T18:00:00').toISOString() : undefined,
      })
      setMsTitle('')
      setMsAmount('')
      setMsDue('')
      setMsDesc('')
      setShowMilestoneForm(false)
      flash('success', 'Milestone added. The client has been notified.')
      await load()
    } catch (err: any) {
      flash('error', err.message)
    } finally {
      setSavingMilestone(false)
    }
  }

  const uploadFiles = async (list: FileList | null, onDone: (f: StoredFile) => void) => {
    const files = Array.from(list || [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) onDone(await filesApi.upload(file, projectId))
    } catch (err: any) {
      flash('error', err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitFor) return
    if (!workNotes.trim()) return flash('error', 'Describe what you are submitting.')
    setSubmittingWork(true)
    try {
      await workspaceApi.submitDeliverable(submitFor.id, { notes: workNotes.trim(), fileUrls: workFiles.map((f) => f.url) })
      setSubmitFor(null)
      setWorkNotes('')
      setWorkFiles([])
      flash('success', 'Work submitted. The client will review it.')
      await load()
    } catch (err: any) {
      flash('error', err.message)
    } finally {
      setSubmittingWork(false)
    }
  }

  const saveProgress = async () => {
    try {
      await workspaceApi.updateProgress(projectId, progressDraft)
      setEditingProgress(false)
      flash('success', 'Progress updated.')
      await load()
    } catch (err: any) {
      flash('error', err.message)
    }
  }

  const messageClient = async () => {
    setOpeningChat(true)
    try {
      const conv = await messagesApi.startConversation(project.clientId, project.id)
      navigate(`/freelancer/messages?c=${conv.id}`)
    } catch (err: any) {
      flash('error', err.message)
      setOpeningChat(false)
    }
  }

  const fileRow = (file: StoredFile) => (
    <div
      key={file.id}
      className="flex items-center justify-between gap-3 rounded-[16px] border border-[#EBEBEB] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/40"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#F4F4F4] font-manrope text-[11px] font-bold text-[#6B7280]">
          {fileExtension(file.originalName)}
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-manrope text-[15px] font-bold text-[#08182B]">{file.originalName}</h4>
          <p className="mt-0.5 font-manrope text-[13px] text-[#8E8376]">
            {formatBytes(file.sizeBytes)} · {file.ownerId === me?.id ? 'You' : file.ownerName || 'Team'} · {formatDate(file.createdAt)}
          </p>
        </div>
      </div>
      <a
        href={fileUrl(file.url) + '?download=true'}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 font-manrope text-[13px] font-bold text-white no-underline shadow-sm transition-all hover:bg-[#AA572D]"
      >
        <span className="hidden sm:inline">Download</span>
        <ArrowDownCircle size={17} />
      </a>
    </div>
  )

  return (
    <div className="flex w-full flex-col gap-5 pb-16 font-manrope">
      {/* 1. BREADCRUMB / TOP TITLE */}
      <div className="flex items-center gap-2 text-[#08182B]">
        <Briefcase size={20} className="text-[#8E8376]" />
        <h1 className="font-manrope text-[18px] sm:text-[20px] font-bold text-[#08182B]">
          <Link to="/freelancer/projects" className="text-[#8E8376] no-underline hover:text-[#C06B3E]">Projects</Link> / Workspace
        </h1>
      </div>

      {notice && (
        <div
          role="status"
          className={`rounded-[12px] border p-3 text-[13px] font-semibold ${
            notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 2. TOP HERO WORKSPACE CARD */}
      <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 flex flex-col">
            <div className="relative h-[200px] sm:h-[260px] w-full overflow-hidden rounded-[20px] bg-[#E8DDD0]">
              <img src={cardDeskMascot} alt={project.title} className="h-full w-full object-cover" />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-manrope text-[24px] sm:text-[26px] font-extrabold text-[#08182B]">{project.title}</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F9EE] px-3 py-1 font-manrope text-[12px] font-bold text-[#1F874C]">
                    <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                    {PROJECT_STATUS_LABEL[project.status] || project.status}
                  </span>
                  {ws.myRole === 'COLLABORATOR' && (
                    <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-[12px] font-bold text-[#6D28D9]">Team member</span>
                  )}
                </div>
                <p className="mt-1 font-manrope text-[14px] text-[#786D61]">{clientName}</p>
              </div>

              <div className="text-right">
                <span className="font-manrope text-[24px] sm:text-[26px] font-extrabold text-[#C06B3E]">{formatINR(ws.agreedAmount)}</span>
                <span className="block text-[12px] font-medium text-[#8E8376]">Fixed price · {ws.agreedTimelineDays} days</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-[20px] bg-[#FAF8F5] p-5 lg:col-span-4 lg:min-h-[320px]">
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between font-manrope text-[12px] font-bold text-[#8A7F73]">
                  <span>PROGRESS</span>
                  <span className="text-[#08182B]">{editingProgress ? progressDraft : project.progressPercentage}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EADDCF]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E] transition-all"
                    style={{ width: `${editingProgress ? progressDraft : project.progressPercentage}%` }}
                  />
                </div>
                {editingProgress && (
                  <div className="mt-3">
                    <input
                      type="range"
                      min={0}
                      max={99}
                      value={progressDraft}
                      onChange={(e) => setProgressDraft(Number(e.target.value))}
                      aria-label="Project progress"
                      className="w-full accent-[#C06B3E]"
                    />
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={saveProgress} className="flex-1 rounded-[10px] bg-[#C06B3E] py-1.5 text-[12px] font-bold text-white">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProgress(false)
                          setProgressDraft(project.progressPercentage)
                        }}
                        className="flex-1 rounded-[10px] border border-[#DECFBE] bg-white py-1.5 text-[12px] font-bold text-[#5C5248]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#8A7F73]">CURRENT MILESTONE</span>
                <span className="mt-1 block font-manrope text-[14px] font-bold text-[#08182B]">
                  {current ? current.milestone.title : milestones.length ? 'All milestones approved' : 'No milestones yet'}
                </span>
              </div>

              <div>
                <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#8A7F73]">DEADLINE</span>
                <div className={`mt-1 flex items-center gap-1.5 font-manrope text-[13px] font-semibold ${isOverdue(project) ? 'text-[#D34026]' : 'text-[#665B50]'}`}>
                  <Clock size={14} />
                  <span>
                    {deadlineLabel(project)}
                    {project.deadline ? ` · ${formatDate(project.deadline, true)}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {isLead && active && !editingProgress && (
              <button
                type="button"
                onClick={() => setEditingProgress(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#08182B] font-manrope text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[#12294A]"
              >
                <TrendingUp size={16} />
                <span>Update Progress</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-[#EBEBEB] px-2 pt-2 sm:gap-8" role="tablist">
        {(['overview', 'files', 'payments', 'hustlers'] as TabType[]).map((tab) => {
          const tabLabels: Record<TabType, string> = {
            overview: 'Overview',
            files: `Files (${ws.files.length})`,
            payments: 'Payments',
            hustlers: 'Hustlers',
          }
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`relative whitespace-nowrap pb-3 font-manrope text-[15px] font-bold transition-colors ${
                isActive ? 'text-[#C06B3E]' : 'text-[#7A7065] hover:text-[#08182B]'
              }`}
            >
              {tabLabels[tab]}
              {isActive && <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-[#C06B3E]" />}
            </button>
          )
        })}
      </div>

      {/* 4. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-8">
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Project Description</h3>
              <p className="mt-2.5 whitespace-pre-line font-manrope text-[14px] leading-relaxed text-[#594E42]">{project.description}</p>
            </div>

            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Milestones</h3>
                {isLead && active && (
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm((v) => !v)}
                    className="flex items-center gap-1 rounded-full bg-[#F5ECE1] px-3 py-1.5 text-[12px] font-bold text-[#9C5128] hover:bg-[#EBDDCF]"
                  >
                    <Plus size={14} /> Add milestone
                  </button>
                )}
              </div>

              {showMilestoneForm && (
                <form onSubmit={handleAddMilestone} className="mt-4 grid grid-cols-1 gap-3 rounded-[16px] border border-[#EFE4D7] bg-[#FAF7F2] p-4 sm:grid-cols-2">
                  <input className={inputClass + ' sm:col-span-2'} placeholder="Milestone title (e.g. First draft)" value={msTitle} maxLength={150} onChange={(e) => setMsTitle(e.target.value)} />
                  <input className={inputClass} type="number" min={50} placeholder="Amount (₹)" value={msAmount} onChange={(e) => setMsAmount(e.target.value)} />
                  <input className={inputClass} type="date" aria-label="Due date" min={new Date().toISOString().slice(0, 10)} value={msDue} onChange={(e) => setMsDue(e.target.value)} />
                  <textarea
                    className={inputClass + ' h-20 py-2 sm:col-span-2'}
                    placeholder="What will be delivered? (optional)"
                    value={msDesc}
                    onChange={(e) => setMsDesc(e.target.value)}
                  />
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" disabled={savingMilestone} className="rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
                      {savingMilestone ? 'Saving…' : 'Add milestone'}
                    </button>
                    <button type="button" onClick={() => setShowMilestoneForm(false)} className="rounded-full border border-[#DECFBE] bg-white px-5 py-2 text-[13px] font-bold text-[#5C5248]">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-4 flex flex-col gap-3.5">
                {milestones.length === 0 && (
                  <p className="rounded-[14px] border border-dashed border-[#DCD3C7] p-5 text-center text-[13px] text-[#8E8376]">
                    {isLead ? 'Break the work into milestones so the client can review and pay in stages.' : 'No milestones have been added yet.'}
                  </p>
                )}
                {milestones.map(({ milestone: m, deliverables }) => {
                  const done = m.status === 'APPROVED' || m.status === 'PAID'
                  const isCurrent = current?.milestone.id === m.id
                  const latest = deliverables[0]
                  return (
                    <div key={m.id} className="rounded-[14px] border border-[#F0ECE6] p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {done ? (
                            <CheckCircle2 size={20} className="text-[#16A34A]" />
                          ) : isCurrent ? (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#7C3AED]">
                              <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-[#D8CDC2]" />
                          )}
                          <div>
                            <span className={`font-manrope text-[14px] ${done || isCurrent ? 'font-bold text-[#08182B]' : 'text-[#8E8376]'}`}>{m.title}</span>
                            <span className="block text-[12px] text-[#8E8376]">
                              {formatINR(m.amount)}
                              {m.dueDate ? ` · due ${formatDate(m.dueDate)}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MILESTONE_STYLE[m.status]}`}>{MILESTONE_LABEL[m.status]}</span>
                          {canDeliver && active && !done && (
                            <button
                              type="button"
                              onClick={() => {
                                setSubmitFor(m)
                                setWorkNotes('')
                                setWorkFiles([])
                              }}
                              className="rounded-full bg-[#08182B] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#12294A]"
                            >
                              {m.status === 'SUBMITTED' ? 'Resubmit' : 'Submit work'}
                            </button>
                          )}
                        </div>
                      </div>
                      {m.description && <p className="mt-2 pl-8 text-[12px] text-[#73685C]">{m.description}</p>}
                      {latest && (
                        <div className="mt-2 ml-8 rounded-[10px] bg-[#FAF7F2] p-2.5 text-[12px] text-[#5C5248]">
                          <span className="font-bold">Last submission {formatDate(latest.createdAt)}:</span> {latest.notes}
                          {splitList(latest.fileUrls).length > 0 && (
                            <span className="ml-1 text-[#8E8376]">({splitList(latest.fileUrls).length} file(s))</span>
                          )}
                        </div>
                      )}

                      {submitFor?.id === m.id && (
                        <form onSubmit={handleSubmitWork} className="mt-3 ml-8 flex flex-col gap-2.5 rounded-[14px] border border-[#EFE4D7] bg-[#FAF7F2] p-3.5">
                          <textarea
                            className={inputClass + ' h-24 py-2'}
                            placeholder="What did you complete? Add links or notes for the client."
                            value={workNotes}
                            maxLength={5000}
                            onChange={(e) => setWorkNotes(e.target.value)}
                          />
                          <input ref={workFileRef} type="file" multiple className="hidden" onChange={(e) => {
                            uploadFiles(e.target.files, (f) => setWorkFiles((prev) => [...prev, f]))
                            e.target.value = ''
                          }} />
                          <div className="flex flex-wrap gap-2">
                            {workFiles.map((f) => (
                              <span key={f.id} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#08182B]">
                                <FileText size={12} /> {f.originalName}
                                <button type="button" aria-label={`Remove ${f.originalName}`} onClick={() => setWorkFiles((prev) => prev.filter((x) => x.id !== f.id))}>
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={uploading || workFiles.length >= 10}
                              onClick={() => workFileRef.current?.click()}
                              className="flex items-center gap-1 rounded-full border border-[#DECFBE] bg-white px-4 py-1.5 text-[12px] font-bold text-[#5C5248] disabled:opacity-60"
                            >
                              <UploadCloud size={14} /> {uploading ? 'Uploading…' : 'Attach files'}
                            </button>
                            <button type="submit" disabled={submittingWork || uploading} className="rounded-full bg-[#C06B3E] px-5 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">
                              {submittingWork ? 'Submitting…' : 'Submit for review'}
                            </button>
                            <button type="button" onClick={() => setSubmitFor(null)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-[#8E8376]">
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-4">
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">Client</h3>
              <div className="mt-4 flex items-center gap-3">
                {project.clientAvatarUrl ? (
                  <img src={fileUrl(project.clientAvatarUrl)} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[16px] font-bold text-white shadow-xs">
                    {initials(clientName)}
                  </div>
                )}
                <div>
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">{clientName}</h4>
                  <span className="text-[12px] text-[#8E8376]">{project.category}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={messageClient}
                disabled={openingChat}
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#DECFBE] bg-white font-manrope text-[13px] font-bold text-[#08182B] shadow-xs transition-all hover:bg-[#FAF7F2] disabled:opacity-60"
              >
                <Send size={14} />
                <span>{openingChat ? 'Opening chat…' : 'Send Message'}</span>
              </button>
            </div>

            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">Recent Files</h3>
              <div className="mt-3.5 flex flex-col divide-y divide-[#F0F0F0]">
                {ws.files.length === 0 && attachments.length === 0 && <p className="py-2 text-[13px] text-[#8E8376]">No files yet.</p>}
                {attachments.map((url, i) => (
                  <a key={url} href={fileUrl(url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-2.5 text-[13px] text-[#08182B] no-underline hover:text-[#C06B3E]">
                    <Paperclip size={15} className="text-[#8E8376]" />
                    <span className="truncate font-medium">Project brief {i + 1}</span>
                  </a>
                ))}
                {ws.files.slice(0, 4).map((file) => (
                  <a key={file.id} href={fileUrl(file.url) + '?download=true'} className="flex items-center gap-2.5 py-2.5 text-[13px] text-[#08182B] no-underline hover:text-[#C06B3E]">
                    <Paperclip size={15} className="text-[#8E8376]" />
                    <span className="truncate font-medium">{file.originalName}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FILES TAB */}
      {activeTab === 'files' && (
        <div className="flex flex-col gap-3.5 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#8E8376]">Files shared by everyone working on this project.</p>
            <input ref={filesTabRef} type="file" multiple className="hidden" onChange={(e) => {
              uploadFiles(e.target.files, (f) => setWs((prev) => (prev ? { ...prev, files: [f, ...prev.files] } : prev)))
              e.target.value = ''
            }} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => filesTabRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-[#08182B] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
            >
              <UploadCloud size={15} /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          {ws.files.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#DCD3C7] p-8 text-center text-[13px] text-[#8E8376]">
              No files yet. Upload drafts, references or final deliverables here.
            </div>
          ) : (
            ws.files.map(fileRow)
          )}
        </div>
      )}

      {/* 6. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[#08182B]">
            <div className="flex items-center gap-2">
              <Receipt size={18} />
              <h3 className="font-manrope text-[16px] font-bold">Milestone payments</h3>
            </div>
            <span className="text-[13px] text-[#8E8376]">
              {formatINR(milestoneTotal)} of {formatINR(ws.agreedAmount)} planned
            </span>
          </div>
          {milestones.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#DCD3C7] p-8 text-center text-[13px] text-[#8E8376]">
              Payments are released per milestone. Add milestones to plan them.
            </div>
          ) : (
            milestones.map(({ milestone: m }) => (
              <div key={m.id} className="flex items-center justify-between rounded-[16px] border border-[#EFEFEF] bg-[#FAF8F5] px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">{m.title}</h4>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MILESTONE_STYLE[m.status]}`}>
                      {m.status === 'PAID' ? 'Paid' : m.status === 'APPROVED' ? 'Approved · payment pending' : MILESTONE_LABEL[m.status]}
                    </span>
                  </div>
                  <p className="mt-1 font-manrope text-[13px] text-[#8E8376]">{m.dueDate ? `Due ${formatDate(m.dueDate, true)}` : `Added ${formatDate(m.createdAt)}`}</p>
                </div>
                <span className="font-manrope text-[16px] font-extrabold text-[#08182B]">{formatINR(m.amount)}</span>
              </div>
            ))
          )}
          <p className="text-[12px] text-[#8E8376]">
            When the client releases a milestone payment, the amount (minus the 10% platform fee) appears in your{' '}
            <Link to="/freelancer/wallet" className="font-bold text-[#C06B3E]">wallet</Link>.
          </p>
        </div>
      )}

      {/* 7. HUSTLERS TAB */}
      {activeTab === 'hustlers' && (
        <div className="flex flex-col gap-6 pt-2">
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Team Members</h3>
              {isLead && active && (
                <Link
                  to={`/freelancer/team?project=${project.id}`}
                  className="flex items-center gap-2 rounded-[12px] bg-[#0A182B] px-4 py-2 font-manrope text-[13px] font-bold text-white no-underline shadow-sm transition-all hover:bg-[#122844]"
                >
                  <UserPlus size={15} />
                  <span>Add Collaborator</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3.5 rounded-[16px] bg-[#F7F7F7] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[16px] font-bold text-white shadow-xs">
                {initials(project.freelancerName)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">{project.freelancerName || 'Lead freelancer'}</h4>
                  {isLead && <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 font-manrope text-[11px] font-bold text-[#7C3AED]">You</span>}
                </div>
                <p className="mt-0.5 font-manrope text-[12px] text-[#786D61]">Lead freelancer</p>
              </div>
            </div>

            {team.map((t) => (
              <div key={t.id} className="mt-3 flex items-center gap-3.5 rounded-[16px] bg-[#F7F7F7] p-4">
                {t.collaboratorAvatarUrl ? (
                  <img src={fileUrl(t.collaboratorAvatarUrl)} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00966D] font-manrope text-[16px] font-bold text-white">
                    {initials(t.collaboratorName)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">{t.collaboratorName || 'Freelancer'}</h4>
                    {t.collaboratorFreelancerId === me?.id && <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-bold text-[#7C3AED]">You</span>}
                  </div>
                  <p className="mt-0.5 font-manrope text-[12px] text-[#786D61]">{t.role}</p>
                </div>
              </div>
            ))}

            {team.length === 0 && (
              <p className="mt-4 text-center font-manrope text-[13px] text-[#8E8376]">
                {isLead ? 'No collaborators yet. Invite a freelancer to build your team.' : 'No other team members.'}
              </p>
            )}
          </div>

          {isLead && (
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Pending Invitations</h3>
              {pendingInvites.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#DCD3C7] p-8 text-center">
                  <p className="font-manrope text-[13px] text-[#8E8376]">No pending invitations.</p>
                  {active && (
                    <Link to={`/freelancer/team?project=${project.id}`} className="mt-2.5 font-manrope text-[13px] font-bold text-[#5249DE] no-underline hover:underline">
                      Search for freelancers &rarr;
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  {pendingInvites.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-[14px] border border-[#EFE4D7] bg-[#FAF7F2] p-3">
                      <span className="text-[13px] font-semibold text-[#08182B]">
                        {t.collaboratorName} <span className="font-normal text-[#8E8376]">· {t.role}</span>
                      </span>
                      <span className="text-[12px] text-[#8E8376]">Invited {formatDate(t.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
