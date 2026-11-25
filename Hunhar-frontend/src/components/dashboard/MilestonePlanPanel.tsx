import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Plus, Send, Trash2, Clock, AlertCircle } from 'lucide-react'
import { workspaceApi, type MilestonePlan, type MilestonePlanItem } from '../../services/api'
import { formatDate, formatINR } from '../../services/format'
import ConfirmDialog from '../common/ConfirmDialog'

interface Props {
  projectId: string
  /** Called after the plan is accepted (milestones were created), so the page can reload them */
  onAccepted?: () => void
}

interface Row {
  title: string
  description: string
  amount: string
  dueDate: string
}

const emptyRow = (): Row => ({ title: '', description: '', amount: '', dueDate: '' })
const toRows = (items: MilestonePlanItem[]): Row[] =>
  items.map((i) => ({ title: i.title, description: i.description || '', amount: String(Number(i.amount)), dueDate: i.dueDate || '' }))
const toItems = (rows: Row[]): MilestonePlanItem[] =>
  rows
    .filter((r) => r.title.trim() || r.amount.trim())
    .map((r) => ({ title: r.title.trim(), description: r.description.trim() || null, amount: Number(r.amount) || 0, dueDate: r.dueDate || null }))
const same = (a: Row[], b: Row[]) => JSON.stringify(toItems(a)) === JSON.stringify(toItems(b))

const who = (role?: string | null) => (role === 'CLIENT' ? 'client' : role === 'FREELANCER' ? 'freelancer' : '')

/**
 * Milestone plan agreed between client and freelancer after hiring:
 * freelancer proposes -> client accepts, or edits and sends back -> freelancer accepts, or edits and sends again.
 * Accepting creates the milestones, which are then funded, delivered, approved and paid one by one.
 */
export default function MilestonePlanPanel({ projectId, onAccepted }: Props): React.JSX.Element | null {
  const [plan, setPlan] = useState<MilestonePlan | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false)

  const apply = useCallback((p: MilestonePlan) => {
    setPlan(p)
    const r = toRows(p.items)
    setRows(p.canEdit && r.length === 0 ? [emptyRow()] : r)
    setNote('')
  }, [])

  const load = useCallback(() => {
    workspaceApi
      .milestonePlan(projectId)
      .then(apply)
      .catch((e) => setError(e.message || 'Could not load the milestone plan'))
  }, [projectId, apply])

  useEffect(() => {
    load()
  }, [load])

  const original = useMemo(() => toRows(plan?.items || []), [plan])
  const edited = plan ? !same(rows, original) : false
  const total = toItems(rows).reduce((s, i) => s + (Number(i.amount) || 0), 0)

  if (!plan) {
    return error ? (
      <div className="rounded-[18px] border border-red-200 bg-red-50 p-4 text-[13px] font-semibold text-red-700">{error}</div>
    ) : null
  }

  const run = async (key: string, fn: () => Promise<MilestonePlan>, ok: string, accepted = false) => {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      apply(await fn())
      setNotice(ok)
      if (accepted) onAccepted?.()
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const update = (i: number, field: keyof Row, value: string) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  const other = plan.myRole === 'CLIENT' ? 'freelancer' : 'client'
  const withMe = plan.canAccept
  const editing = plan.canEdit
  const difference = Math.round((total - Number(plan.agreedAmount)) * 100) / 100

  // --- status line
  let statusText = ''
  let statusTone = 'bg-[#FAF4EE] text-[#C06B3E]'
  switch (plan.status) {
    case 'NONE':
      statusText = plan.myRole === 'FREELANCER' ? 'Propose your milestone plan to the client' : 'Waiting for the freelancer to propose milestones'
      break
    case 'DRAFT':
      statusText = editing ? `Draft — not sent to the ${other} yet` : `The ${who(plan.draftBy)} is preparing the plan`
      break
    case 'WITH_CLIENT':
      statusText = plan.myRole === 'CLIENT' ? 'The freelancer sent this plan — accept it, or edit and send it back' : 'Sent to the client for review'
      break
    case 'WITH_FREELANCER':
      statusText = plan.myRole === 'FREELANCER' ? 'The client changed the plan — accept it, or edit and send it back' : 'Sent back to the freelancer for review'
      break
    case 'ACCEPTED':
      statusText = `Agreed${plan.acceptedAt ? ` on ${formatDate(plan.acceptedAt, true)}` : ''} — fund each milestone to start its work`
      statusTone = 'bg-green-50 text-green-700'
      break
  }

  const readOnlyItems = !editing && plan.items.length > 0

  return (
    <div className="rounded-[20px] border border-[#DECFBE] bg-white p-4 sm:p-5 font-manrope">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-[#C06B3E]" />
          <h3 className="text-[16px] font-extrabold text-[#08182B]">
            Milestone plan{plan.round > 1 ? ` · round ${plan.round}` : ''}
          </h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11.5px] font-bold ${statusTone}`}>{statusText}</span>
      </div>

      {plan.lastEditedAt && plan.status !== 'NONE' && (
        <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#8E8376]">
          <Clock size={12} /> Last change by the {who(plan.lastEditedBy)} · {formatDate(plan.lastEditedAt, true)}
          {plan.revisions > 0 ? ` · ${plan.revisions} revision${plan.revisions > 1 ? 's' : ''}` : ''}
        </p>
      )}

      {plan.note && plan.status !== 'ACCEPTED' && (
        <div className="mt-3 rounded-[12px] border-l-4 border-l-[#C06B3E] bg-[#FAF4EE] px-3 py-2 text-[12.5px] text-[#4A4036]">
          <span className="font-bold">Message from the {who(plan.lastEditedBy)}:</span> {plan.note}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {notice && <div className="mt-3 rounded-[12px] border border-green-200 bg-green-50 px-3 py-2 text-[12.5px] font-semibold text-green-700">{notice}</div>}

      {/* ---------- read-only list ---------- */}
      {readOnlyItems && (
        <div className="mt-4 divide-y divide-[#F2E8DC] rounded-[14px] border border-[#F2E8DC]">
          {plan.items.map((it, i) => (
            <div key={i} className="flex flex-wrap items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-[#08182B]">
                  {i + 1}. {it.title}
                </p>
                {it.description && <p className="mt-0.5 text-[12px] text-[#7A7065]">{it.description}</p>}
                {it.dueDate && <p className="mt-0.5 text-[11.5px] text-[#8E8376]">Due {formatDate(it.dueDate, true)}</p>}
              </div>
              <span className="shrink-0 text-[14px] font-extrabold text-[#C06B3E]">{formatINR(it.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ---------- editor ---------- */}
      {editing && (
        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-[14px] border border-[#E5DACD] bg-[#FDFBF7] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-wide text-[#8E8376]">Milestone {i + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-full p-1 text-[#9A8E80] hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove milestone ${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_130px_150px]">
                <input
                  value={r.title}
                  onChange={(e) => update(i, 'title', e.target.value)}
                  placeholder="Title, e.g. Homepage design"
                  maxLength={150}
                  className="h-10 rounded-[10px] border border-[#DECFBE] bg-white px-3 text-[13px] focus:border-[#C06B3E] focus:outline-none"
                />
                <input
                  value={r.amount}
                  onChange={(e) => update(i, 'amount', e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="Amount ₹"
                  inputMode="decimal"
                  className="h-10 rounded-[10px] border border-[#DECFBE] bg-white px-3 text-[13px] focus:border-[#C06B3E] focus:outline-none"
                />
                <input
                  type="date"
                  value={r.dueDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => update(i, 'dueDate', e.target.value)}
                  className="h-10 rounded-[10px] border border-[#DECFBE] bg-white px-3 text-[13px] focus:border-[#C06B3E] focus:outline-none"
                />
              </div>
              <textarea
                value={r.description}
                onChange={(e) => update(i, 'description', e.target.value)}
                placeholder="What will be delivered (optional)"
                rows={2}
                maxLength={1000}
                className="mt-2 w-full rounded-[10px] border border-[#DECFBE] bg-white px-3 py-2 text-[13px] focus:border-[#C06B3E] focus:outline-none"
              />
            </div>
          ))}
          {rows.length < 20 && (
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, emptyRow()])}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#C06B3E] px-4 py-1.5 text-[12.5px] font-bold text-[#C06B3E] hover:bg-[#FAF4EE]"
            >
              <Plus size={14} /> Add milestone
            </button>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Message to the ${other} (optional), e.g. why you changed the amounts`}
            rows={2}
            maxLength={600}
            className="w-full rounded-[10px] border border-[#DECFBE] bg-white px-3 py-2 text-[13px] focus:border-[#C06B3E] focus:outline-none"
          />
        </div>
      )}

      {/* ---------- totals ---------- */}
      {(editing || readOnlyItems) && plan.round <= 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#F8F4EE] px-3 py-2 text-[12.5px]">
          <span className="text-[#7A7065]">
            Agreed project amount <span className="font-bold text-[#08182B]">{formatINR(plan.agreedAmount)}</span>
          </span>
          <span className="text-[#7A7065]">
            Plan total <span className="font-bold text-[#08182B]">{formatINR(editing ? total : plan.items.reduce((s, i) => s + Number(i.amount), 0))}</span>
            {editing && difference !== 0 && (
              <span className={`ml-1 font-bold ${difference > 0 ? 'text-amber-700' : 'text-[#7A7065]'}`}>
                ({difference > 0 ? '+' : ''}
                {formatINR(difference)} vs agreed)
              </span>
            )}
          </span>
        </div>
      )}
      {plan.status === 'ACCEPTED' && (
        <p className="mt-3 text-[12.5px] text-[#7A7065]">
          Milestones total <span className="font-bold text-[#08182B]">{formatINR(plan.milestonesTotal)}</span>. Payment works milestone by milestone: the
          client funds it (held in escrow), the freelancer submits the work, the client approves and releases the payment.
        </p>
      )}

      {/* ---------- actions ---------- */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {editing && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('save', () => workspaceApi.saveMilestonePlan(projectId, toItems(rows), note), 'Saved')}
            className="rounded-full border border-[#DECFBE] px-4 py-2 text-[12.5px] font-bold text-[#08182B] hover:bg-[#FAF4EE] disabled:opacity-50"
          >
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
        )}
        {editing && (!withMe || edited) && (
          <button
            type="button"
            disabled={!!busy || toItems(rows).length === 0}
            onClick={() =>
              run('send', () => workspaceApi.sendMilestonePlan(projectId, toItems(rows), note), `Sent to the ${other} for review`)
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#13294A] disabled:opacity-50"
          >
            <Send size={13} /> {busy === 'send' ? 'Sending…' : withMe ? `Send changes to the ${other}` : `Send to the ${other}`}
          </button>
        )}
        {withMe && (
          <button
            type="button"
            disabled={!!busy || edited}
            title={edited ? `You changed the plan — send it to the ${other} instead` : undefined}
            onClick={() => setConfirmAcceptOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#AA572D] disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 size={14} /> {busy === 'accept' ? 'Accepting…' : 'Accept plan'}
          </button>
        )}
        {plan.canStartRound && plan.status === 'ACCEPTED' && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run('round', () => workspaceApi.newMilestoneRound(projectId), 'Add the new milestones, then send them for approval')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-[#C06B3E] hover:bg-[#FAF4EE] disabled:opacity-50"
          >
            <Plus size={14} /> Propose more milestones
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmAcceptOpen}
        onClose={() => setConfirmAcceptOpen(false)}
        onConfirm={() => {
          setConfirmAcceptOpen(false)
          run('accept', () => workspaceApi.acceptMilestonePlan(projectId), 'Plan accepted — milestones created', true)
        }}
        title="Accept Milestone Plan?"
        message={`Accept this plan? ${plan.items.length} milestone(s) will be created and added to your project workspace.`}
        confirmText="Yes, Accept Plan"
        cancelText="Cancel"
        variant="primary"
        confirmLoading={busy === 'accept'}
      />
    </div>
  )
}
