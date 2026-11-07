import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Lock, Unlock, ChevronLeft, ChevronRight, TrendingUp, Clock, Send, Plus, X, CreditCard, ShieldCheck, AlertCircle, FileText, Paperclip, Upload } from 'lucide-react'
import { clientApi, fileUrl, filesApi, projectsApi, workspaceApi, type Deliverable, type Milestone, type Project, type StoredFile, type Workspace } from '../../services/api'
import { formatDate, formatINR, splitList, timeAgo } from '../../services/format'
import { fromRouteId, toRouteId } from '../../services/routeIds'

interface ProjectTrackingViewProps {
  role: 'client' | 'freelancer'
}

type Row = { milestone: Milestone; deliverables: Deliverable[] }

const isDone = (m: Milestone) => m.status === 'APPROVED' || m.status === 'PAID'
const isFunded = (m: Milestone) => m.funded || m.status !== 'PENDING'
const isOverdue = (m: Milestone) => !!m.dueDate && !isDone(m) && new Date(m.dueDate).getTime() < Date.now()

/** 4 real steps: funded -> work submitted -> approved -> paid */
const stepOf = (m: Milestone) => (m.status === 'PAID' ? 4 : m.status === 'APPROVED' ? 3 : m.status === 'SUBMITTED' ? 2 : isFunded(m) ? 1 : 0)
const STEP_LABEL = ['Waiting for funding', 'Funded · work in progress', 'Work submitted · in review', 'Approved · payment pending', 'Paid']

const fileName = (url: string) => decodeURIComponent(url.split('/').pop() || 'file')

/** /client/tracking and /freelancer/tracking without a project: pick one */
function ProjectPicker({ role }: ProjectTrackingViewProps) {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    ;(role === 'client' ? projectsApi.getClientProjects() : projectsApi.getFreelancerProjects())
      .then((list) => setProjects(list.filter((p) => p.status === 'ACTIVE' || p.status === 'COMPLETED')))
      .catch((err) => setError(err.message || 'Could not load your projects'))
  }, [role])
  return (
    <div className="w-full rounded-[24px] border border-[#E9EBEF]/60 bg-white p-6 font-manrope shadow-xs sm:p-8">
      <h1 className="text-[22px] font-extrabold text-[#08182B]">Project Tracking</h1>
      <p className="mt-1 text-[13px] text-[#7A7065]">Choose a project to see its milestones, submissions and payments.</p>
      {error && <p className="mt-4 text-[13px] font-semibold text-[#B91C1C]">{error}</p>}
      {!projects && !error && <p className="mt-6 text-[13px] text-[#8E8376]">Loading…</p>}
      {projects && projects.length === 0 && (
        <p className="mt-6 rounded-[16px] border border-dashed border-[#E5DACD] p-6 text-center text-[13px] text-[#7A7065]">
          No active projects yet. Projects appear here once a freelancer is hired.
        </p>
      )}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {projects?.map((p) => (
          <Link
            key={p.id}
            to={`/${role}/projects/${toRouteId(p.id)}/tracking`}
            className="rounded-[18px] border border-[#E5E7EB] p-4 no-underline transition-all hover:border-[#DEBBA5] hover:shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold text-[#08182B]">{p.title}</span>
              <span className="text-[12px] font-bold text-[#C06B3E]">{p.progressPercentage}%</span>
            </div>
            <p className="mt-1 text-[12px] text-[#8C9BA8]">
              {role === 'client' ? p.freelancerName || 'Freelancer' : p.clientName || 'Client'} · {formatINR(p.budget)}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
              <div className="h-full rounded-full bg-[#C06B3E]" style={{ width: `${p.progressPercentage}%` }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function ProjectTrackingView({ role }: ProjectTrackingViewProps): React.JSX.Element {
  const { projectId: token = '' } = useParams<{ projectId: string }>()
  if (!token) return <ProjectPicker role={role} />
  return <TrackingBoard role={role} projectId={fromRouteId(token)} />
}

function TrackingBoard({ role, projectId }: { role: 'client' | 'freelancer'; projectId: string }) {
  const [ws, setWs] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [msForm, setMsForm] = useState({ title: '', amount: '', due: '', description: '' })
  const [payingFor, setPayingFor] = useState<Milestone | null>(null)
  const [releasingFor, setReleasingFor] = useState<Milestone | null>(null)
  const [submitFor, setSubmitFor] = useState<Milestone | null>(null)
  const [workNotes, setWorkNotes] = useState('')
  const [workFiles, setWorkFiles] = useState<StoredFile[]>([])
  const [uploading, setUploading] = useState(false)

  const phasesRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dx: number) => ref.current?.scrollBy({ left: dx, behavior: 'smooth' })

  const flash = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    window.setTimeout(() => setToast(null), 4500)
  }

  const load = useCallback(async () => {
    try {
      setWs(await workspaceApi.get(projectId))
      setError('')
    } catch (err: any) {
      setError(err.status === 403 ? 'You are not part of this project.' : err.message || 'Could not load the project')
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
      flash('success', success)
      await load()
    } catch (err: any) {
      flash('error', err.message || 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const rows: Row[] = useMemo(() => ws?.milestones || [], [ws])

  // Latest activity from real timestamps
  const activity = useMemo(() => {
    const items: { at: string; text: string; tone: 'green' | 'amber' | 'blue' | 'grey' }[] = []
    rows.forEach(({ milestone: m, deliverables }) => {
      items.push({ at: m.createdAt, text: `Milestone added: ${m.title}`, tone: 'grey' })
      if (m.fundedAt) items.push({ at: m.fundedAt, text: `${formatINR(m.amount)} funded for ${m.title}`, tone: 'blue' })
      deliverables.forEach((d) => items.push({ at: d.createdAt, text: `Work submitted for ${m.title}${d.approved ? ' · approved' : ''}`, tone: 'amber' }))
      if (m.paidAt) items.push({ at: m.paidAt, text: `${formatINR(m.amount)} paid for ${m.title}`, tone: 'green' })
    })
    return items.filter((i) => i.at).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8)
  }, [rows])

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center rounded-[24px] bg-white font-manrope text-[14px] font-semibold text-[#8E8376]">Loading project tracking…</div>
  }
  if (error || !ws) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center font-manrope">
        <p className="text-[15px] font-bold text-[#08182B]">{error || 'Project not found'}</p>
        <Link to={`/${role}/projects`} className="mt-4 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white no-underline">
          Back to Projects
        </Link>
      </div>
    )
  }

  const { project } = ws
  const isClient = ws.myRole === 'CLIENT'
  const canDeliver = ws.myRole === 'OWNER' || ws.myRole === 'COLLABORATOR'
  const canAddMilestone = project.status === 'ACTIVE' && (isClient || ws.myRole === 'OWNER')
  const active = project.status === 'ACTIVE'
  const total = rows.length
  const completed = rows.filter((r) => isDone(r.milestone)).length
  const inProgress = rows.filter((r) => isFunded(r.milestone) && !isDone(r.milestone)).length
  const overdue = rows.filter((r) => isOverdue(r.milestone)).length
  const backLink = role === 'client' ? `/client/projects/${toRouteId(project.id)}` : `/freelancer/projects/${toRouteId(project.id)}`

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(msForm.amount)
    if (!msForm.title.trim()) return flash('error', 'Give the milestone a title.')
    if (!(amount >= 50)) return flash('error', 'Milestone amount must be at least ₹50.')
    await act(
      'add',
      () =>
        workspaceApi.addMilestone(project.id, {
          title: msForm.title.trim(),
          description: msForm.description.trim() || undefined,
          amount,
          dueDate: msForm.due ? new Date(msForm.due + 'T18:00:00').toISOString() : undefined,
        }),
      'Milestone added'
    )
    setShowAdd(false)
    setMsForm({ title: '', amount: '', due: '', description: '' })
  }

  const uploadWork = async (list: FileList | null) => {
    if (!list?.length) return
    setUploading(true)
    try {
      for (const f of Array.from(list)) {
        const stored = await filesApi.upload(f, project.id)
        setWorkFiles((prev) => [...prev, stored])
      }
    } catch (err: any) {
      flash('error', err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitFor) return
    if (!workNotes.trim()) return flash('error', 'Describe what you are submitting.')
    const m = submitFor
    setSubmitFor(null)
    await act('sub-' + m.id, () => workspaceApi.submitDeliverable(m.id, { notes: workNotes.trim(), fileUrls: workFiles.map((f) => f.url) }), 'Work submitted. The client will review it.')
    setWorkNotes('')
    setWorkFiles([])
  }

  const stats = [
    { label: 'MILESTONES', value: total, sub: formatINR(rows.reduce((s, r) => s + Number(r.milestone.amount || 0), 0)) + ' in total', icon: FileText },
    { label: 'IN PROGRESS', value: inProgress, sub: 'funded, not finished', icon: Clock },
    { label: 'COMPLETED', value: completed, sub: 'approved or paid', icon: CheckCircle2 },
    { label: 'OVERDUE', value: overdue, sub: overdue ? 'past due date' : 'nothing late', icon: AlertCircle },
  ]

  return (
    <div className="w-full pb-12 font-manrope text-[#08182B]">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[16px] px-5 py-3.5 text-[13.5px] font-bold text-white shadow-2xl ${
            toast.type === 'success' ? 'bg-[#08182B]' : 'bg-[#B91C1C]'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-[#22C55E]" /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="w-full rounded-[24px] border border-[#E9EBEF]/60 bg-white p-5 shadow-xs sm:p-7 lg:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-3">
            <Link to={backLink} className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#F4EFE6] hover:text-[#08182B]" aria-label="Back">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-manrope text-[20px] font-extrabold text-[#08182B] sm:text-[22px]">Project Tracking</h1>
              <p className="text-[12.5px] text-[#7A7065]">
                {isClient ? `with ${project.freelancerName || 'your freelancer'}` : `for ${project.clientName || 'the client'}`} · {project.title} · {project.progressPercentage}% done
              </p>
            </div>
          </div>
          {canAddMilestone && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#DECFBE] bg-[#FAF8F5] px-3.5 py-2 font-manrope text-[12.5px] font-bold text-[#863D1A] shadow-2xs transition-all hover:bg-[#F3ECE1]"
            >
              <Plus size={15} />
              <span>Add Milestone</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col justify-between rounded-[20px] border border-[#F3DAC5] bg-[#FDF4EC] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="font-manrope text-[10.5px] font-extrabold uppercase tracking-wider text-[#A05C35] sm:text-[11px]">{s.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#EACBB2] text-[#A05C35]">
                  <s.icon size={13} />
                </div>
              </div>
              <div className="mt-4 sm:mt-5">
                <span className="font-manrope text-[28px] font-extrabold leading-none text-[#08182B] sm:text-[34px]">{s.value}</span>
                <span className="mt-1 block font-manrope text-[11.5px] text-[#8C7A6B]">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {total === 0 ? (
          <div className="mt-9 rounded-[20px] border border-dashed border-[#E5DACD] p-10 text-center">
            <p className="text-[15px] font-bold text-[#08182B]">No milestones yet</p>
            <p className="mt-1 text-[13px] text-[#7A7065]">
              {canAddMilestone ? 'Split the work into milestones: each is funded, delivered, approved and paid on its own.' : 'Milestones appear here once they are added.'}
            </p>
            {canAddMilestone && (
              <button type="button" onClick={() => setShowAdd(true)} className="mt-4 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white">
                Add the first milestone
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Milestones (phases) */}
            <div className="mt-9">
              <div className="flex items-center justify-between pb-3.5">
                <h2 className="font-manrope text-[17px] font-bold text-[#08182B] sm:text-[18px]">Milestones</h2>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => scroll(phasesRef, -260)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#64748B] hover:bg-[#FAF8F5]" aria-label="Scroll left">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => scroll(phasesRef, 260)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#64748B] hover:bg-[#FAF8F5]" aria-label="Scroll right">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div ref={phasesRef} className="flex items-stretch gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 [scrollbar-color:#DECFBE_transparent] [scrollbar-width:thin]">
                {rows.map(({ milestone: m }, i) => {
                  const step = stepOf(m)
                  const percent = Math.round((step / 4) * 100)
                  const green = m.status === 'PAID'
                  const amber = !green && isFunded(m)
                  return (
                    <div
                      key={m.id}
                      className={`flex w-[220px] shrink-0 flex-col justify-between rounded-[20px] bg-white p-4 transition-all sm:w-[235px] ${
                        green ? 'border-2 border-[#86EFAC] shadow-xs' : amber ? 'border-2 border-[#E7A67D] shadow-xs' : 'border border-[#E5E5E5]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-manrope text-[10.5px] font-extrabold uppercase tracking-wider text-[#8A7F73]">MILESTONE {i + 1}</span>
                          {green ? <CheckCircle2 size={16} className="text-[#22C55E]" /> : isFunded(m) ? <Unlock size={15} className="text-[#C06B3E]" /> : <Lock size={15} className="text-[#9CA3AF]" />}
                        </div>
                        <h3 className="mt-2 font-manrope text-[16px] font-extrabold text-[#08182B]">{m.title}</h3>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {m.status === 'PAID' ? (
                            <span className="rounded-[8px] bg-[#E9F9EE] px-2.5 py-1 text-[11px] font-bold text-[#1F874C]">₹ Paid {formatINR(m.amount)}</span>
                          ) : isFunded(m) ? (
                            <span className="rounded-[8px] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#D97706]">₹ In escrow {formatINR(m.amount)}</span>
                          ) : (
                            <span className="rounded-[8px] bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-bold text-[#64748B]">₹ Not funded {formatINR(m.amount)}</span>
                          )}
                        </div>
                        <p className="mt-3 text-[11.5px] text-[#786D61]">{STEP_LABEL[step]}</p>
                        {m.dueDate && (
                          <p className={`mt-0.5 text-[11.5px] ${isOverdue(m) ? 'font-bold text-[#B91C1C]' : 'text-[#786D61]'}`}>
                            Due {formatDate(m.dueDate, true)}
                            {isOverdue(m) ? ' · overdue' : ''}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-2">
                        {isClient && active && !isFunded(m) ? (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => setPayingFor(m)}
                            className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#C06B3E] text-[13px] font-bold text-white shadow-xs transition-all hover:bg-[#AA572D] disabled:opacity-60"
                          >
                            Fund {formatINR(m.amount)}
                          </button>
                        ) : isClient && m.status === 'APPROVED' ? (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => setReleasingFor(m)}
                            className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#16A34A] text-[13px] font-bold text-white shadow-xs transition-all hover:bg-[#15803D] disabled:opacity-60"
                          >
                            Release payment
                          </button>
                        ) : (
                          <div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                              <div className={`h-full rounded-full transition-all duration-300 ${green ? 'bg-[#22C55E]' : amber ? 'bg-[#C06B3E]' : 'bg-[#CBD5E1]'}`} style={{ width: `${percent}%` }} />
                            </div>
                            <span className="mt-2 block text-[11.5px] font-bold text-[#08182B]">
                              Step {step} of 4
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submissions board */}
            <div className="mt-10">
              <div className="flex items-center justify-between pb-3.5">
                <h2 className="font-manrope text-[17px] font-bold text-[#08182B] sm:text-[18px]">Work Submissions</h2>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => scroll(boardRef, -300)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#64748B] hover:bg-[#FAF8F5]" aria-label="Scroll left">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" onClick={() => scroll(boardRef, 300)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#64748B] hover:bg-[#FAF8F5]" aria-label="Scroll right">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div ref={boardRef} className="flex items-start gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-color:#DECFBE_transparent] [scrollbar-width:thin]">
                {rows.map(({ milestone: m, deliverables }) => {
                  const latest = deliverables[deliverables.length - 1]
                  return (
                    <div key={m.id} className="flex w-[280px] shrink-0 flex-col rounded-[20px] border border-[#EFE8DF] bg-[#FAF8F5] p-3.5">
                      <div className="flex items-center justify-between px-1 pb-3">
                        <span className="text-[13.5px] font-extrabold text-[#08182B]">{m.title}</span>
                        <span className="text-[11.5px] font-bold text-[#8A7F73]">
                          {deliverables.length} {deliverables.length === 1 ? 'submission' : 'submissions'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {deliverables.length === 0 && <p className="rounded-[14px] border border-dashed border-[#E5DACD] bg-white p-3 text-[12px] text-[#94A3B8]">Nothing submitted yet.</p>}
                        {[...deliverables].reverse().map((d) => (
                          <div key={d.id} className="rounded-[14px] border border-[#EDE6DC] bg-white p-3">
                            <div className="flex items-center justify-between">
                              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${d.approved ? 'bg-[#E9F9EE] text-[#1F874C]' : 'bg-[#FEF3C7] text-[#B45309]'}`}>
                                {d.approved ? 'Approved' : d.id === latest?.id && m.status === 'SUBMITTED' ? 'Waiting for review' : 'Earlier version'}
                              </span>
                              <span className="text-[11px] text-[#94A3B8]">{timeAgo(d.createdAt)}</span>
                            </div>
                            <p className="mt-2 line-clamp-3 whitespace-pre-line text-[12.5px] leading-relaxed text-[#475569]">{d.notes}</p>
                            {splitList(d.fileUrls).map((u) => (
                              <a key={u} href={fileUrl(u)} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-[#C06B3E] no-underline hover:underline">
                                <Paperclip size={12} />
                                <span className="truncate">{fileName(u)}</span>
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        {m.status === 'PAID' ? (
                          <div className="flex h-9 items-center justify-center rounded-[10px] bg-[#E9F9EE] text-[12.5px] font-bold text-[#1F874C]">✓ Done · paid</div>
                        ) : isClient && m.status === 'SUBMITTED' && latest ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => act('ap-' + m.id, () => clientApi.reviewDeliverable(latest.id, true), 'Work approved — release the payment when ready')}
                              className="h-9 flex-1 rounded-[10px] bg-[#16A34A] text-[12.5px] font-bold text-white hover:bg-[#15803D] disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => act('ch-' + m.id, () => clientApi.reviewDeliverable(latest.id, false), 'Changes requested — the freelancer has been notified')}
                              className="h-9 flex-1 rounded-[10px] border border-[#E5DACD] bg-white text-[12.5px] font-bold text-[#524B42] hover:bg-[#FAF8F5] disabled:opacity-60"
                            >
                              Request changes
                            </button>
                          </div>
                        ) : canDeliver && active && isFunded(m) && !isDone(m) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSubmitFor(m)
                              setWorkNotes('')
                              setWorkFiles([])
                            }}
                            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#08182B] text-[12.5px] font-bold text-white hover:bg-[#C06B3E]"
                          >
                            <Send size={13} />
                            {m.status === 'SUBMITTED' ? 'Resubmit work' : 'Submit work for review'}
                          </button>
                        ) : (
                          <div className="flex h-9 items-center justify-center rounded-[10px] bg-white text-[12px] font-semibold text-[#94A3B8]">{STEP_LABEL[stepOf(m)]}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress + activity */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-[20px] border border-[#EFE8DF] p-5">
                <h3 className="flex items-center gap-2 font-manrope text-[16px] font-extrabold text-[#08182B]">
                  <TrendingUp size={17} className="text-[#C06B3E]" />
                  Progress by Milestone
                </h3>
                <div className="mt-4 space-y-3.5">
                  {rows.map(({ milestone: m }) => {
                    const pct = Math.round((stepOf(m) / 4) * 100)
                    return (
                      <div key={m.id}>
                        <div className="flex items-center justify-between text-[12.5px] font-bold">
                          <span className="truncate pr-3 text-[#08182B]">{m.title}</span>
                          <span className="shrink-0 text-[#8A7F73]">{STEP_LABEL[stepOf(m)]}</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F0EAE1]">
                          <div className={`h-full rounded-full ${m.status === 'PAID' ? 'bg-[#22C55E]' : 'bg-[#C06B3E]'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="rounded-[20px] border border-[#EFE8DF] p-5">
                <h3 className="font-manrope text-[16px] font-extrabold text-[#08182B]">Latest Activity</h3>
                <div className="mt-4 space-y-3">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          a.tone === 'green' ? 'bg-[#22C55E]' : a.tone === 'amber' ? 'bg-[#F59E0B]' : a.tone === 'blue' ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                        }`}
                      />
                      <div>
                        <p className="text-[12.5px] font-semibold text-[#08182B]">{a.text}</p>
                        <p className="text-[11px] text-[#94A3B8]">{timeAgo(a.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add milestone */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form onSubmit={addMilestone} className="w-full max-w-md rounded-[24px] border border-[#E5DACD] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-[#08182B]">Add Milestone</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-full p-1.5 text-[#94A3B8] hover:bg-[#FAF8F5]">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input value={msForm.title} onChange={(e) => setMsForm({ ...msForm, title: e.target.value })} placeholder="Title, e.g. Logo concepts" className="w-full rounded-[12px] border border-[#E5DACD] px-3 py-2.5 text-[13px] focus:border-[#C06B3E] focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={50} value={msForm.amount} onChange={(e) => setMsForm({ ...msForm, amount: e.target.value })} placeholder="Amount ₹ (min 50)" className="w-full rounded-[12px] border border-[#E5DACD] px-3 py-2.5 text-[13px] focus:border-[#C06B3E] focus:outline-none" />
                <input type="date" value={msForm.due} onChange={(e) => setMsForm({ ...msForm, due: e.target.value })} className="w-full rounded-[12px] border border-[#E5DACD] px-3 py-2.5 text-[13px] focus:border-[#C06B3E] focus:outline-none" />
              </div>
              <textarea value={msForm.description} onChange={(e) => setMsForm({ ...msForm, description: e.target.value })} rows={3} placeholder="What will be delivered (optional)" className="w-full rounded-[12px] border border-[#E5DACD] px-3 py-2.5 text-[13px] focus:border-[#C06B3E] focus:outline-none" />
            </div>
            <button type="submit" disabled={busy !== null} className="mt-5 w-full rounded-[12px] bg-[#C06B3E] py-2.5 text-[13px] font-bold text-white hover:bg-[#AA572D] disabled:opacity-60">
              Add Milestone
            </button>
          </form>
        </div>
      )}

      {/* Fund */}
      {payingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[24px] border border-[#E5DACD] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C06B3E]">
              <CreditCard size={28} />
            </div>
            <h3 className="text-[20px] font-extrabold text-[#08182B]">Fund “{payingFor.title}”?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
              {formatINR(payingFor.amount)} moves from your wallet into escrow. The freelancer can start, and the money is released only when you approve the work.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setPayingFor(null)} className="flex-1 rounded-[12px] border border-[#E5DACD] py-2.5 text-[13px] font-bold text-[#64748B] hover:bg-[#FAF8F5]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = payingFor
                  setPayingFor(null)
                  act('fund-' + m.id, () => clientApi.fundMilestone(m.id), `${formatINR(m.amount)} moved to escrow`)
                }}
                className="flex-1 rounded-[12px] bg-[#C06B3E] py-2.5 text-[13px] font-bold text-white hover:bg-[#AA572D]"
              >
                Fund from wallet
              </button>
            </div>
            <Link to="/client/payments" className="mt-3 block text-[12px] font-bold text-[#C06B3E] no-underline">
              Add money to wallet →
            </Link>
          </div>
        </div>
      )}

      {/* Release */}
      {releasingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[24px] border border-[#E5DACD] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF7EE] text-[#16A34A]">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-[20px] font-extrabold text-[#08182B]">Release {formatINR(releasingFor.amount)}?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
              The escrowed amount for “{releasingFor.title}” goes to {project.freelancerName || 'the freelancer'} (minus the platform fee) and an invoice is created. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setReleasingFor(null)} className="flex-1 rounded-[12px] border border-[#E5DACD] py-2.5 text-[13px] font-bold text-[#64748B] hover:bg-[#FAF8F5]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = releasingFor
                  setReleasingFor(null)
                  act('rel-' + m.id, () => clientApi.releaseMilestone(m.id), 'Payment released')
                }}
                className="flex-1 rounded-[12px] bg-[#16A34A] py-2.5 text-[13px] font-bold text-white hover:bg-[#15803D]"
              >
                Release payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit work */}
      {submitFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form onSubmit={submitWork} className="w-full max-w-md rounded-[24px] border border-[#E5DACD] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-[#08182B]">Submit work · {submitFor.title}</h3>
              <button type="button" onClick={() => setSubmitFor(null)} className="rounded-full p-1.5 text-[#94A3B8] hover:bg-[#FAF8F5]">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              rows={4}
              placeholder="What are you delivering? Links, notes for the client…"
              className="mt-4 w-full rounded-[12px] border border-[#E5DACD] px-3 py-2.5 text-[13px] focus:border-[#C06B3E] focus:outline-none"
            />
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#DECFBE] py-3 text-[12.5px] font-bold text-[#863D1A] hover:bg-[#FAF8F5]">
              <Upload size={14} />
              {uploading ? 'Uploading…' : 'Attach files'}
              <input type="file" multiple className="hidden" onChange={(e) => uploadWork(e.target.files)} />
            </label>
            {workFiles.map((f) => (
              <p key={f.url} className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#475569]">
                <Paperclip size={12} />
                {f.originalName}
              </p>
            ))}
            <button type="submit" disabled={busy !== null || uploading} className="mt-5 w-full rounded-[12px] bg-[#08182B] py-2.5 text-[13px] font-bold text-white hover:bg-[#C06B3E] disabled:opacity-60">
              Submit for review
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
