import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Clock, Trash2, Lock, ListTodo, AlertCircle, Send, Wallet } from 'lucide-react'
import { clientApi, workspaceApi, type MilestoneTask, type MilestoneView } from '../../services/api'
import { formatINR } from '../../services/format'
import ConfirmDialog from '../common/ConfirmDialog'

interface Props {
  /** The phase as returned by the workspace (milestone + tasks + phase state) */
  view: MilestoneView
  /** CLIENT approves and pays; FREELANCER plans and moves the cards; VIEWER only looks */
  role: 'CLIENT' | 'FREELANCER' | 'VIEWER'
  /** Reload the workspace after a change */
  onChanged?: () => void
}

type Col = 'TODO' | 'IN_PROGRESS' | 'DONE'

/**
 * Kanban board of one phase. Phases run strictly in order:
 * 1. freelancer adds the phase's sub-tasks and sends them to the client
 * 2. client approves them by paying for the phase (escrow), or asks for changes
 * 3. freelancer moves the cards to Done, then submits the phase's work (on the page)
 * 4. client approves the work and releases the payment -> the next phase opens
 */
export default function MilestoneCardBoard({ view, role, onChanged }: Props) {
  const m = view.milestone
  const state = view.phaseState || 'CURRENT'
  const [tasks, setTasks] = useState<MilestoneTask[]>(view.tasks || [])
  const [addingInColumn, setAddingInColumn] = useState<Col | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<null | 'send' | 'fund' | { deleteId: string }>(null)
  const [changeNote, setChangeNote] = useState('')
  const [askingChanges, setAskingChanges] = useState(false)

  useEffect(() => {
    setTasks(view.tasks || [])
  }, [view.tasks])

  const isFreelancer = role === 'FREELANCER'
  const isClient = role === 'CLIENT'
  const current = state === 'CURRENT'
  const funded = m.funded
  const sentForApproval = !!m.tasksSubmittedAt && !funded
  // Freelancer plans (add/delete cards) only before sending; moves cards only after the client paid
  const canPlan = isFreelancer && current && !funded && !sentForApproval
  const canMove = isFreelancer && current && funded && m.status !== 'APPROVED' && m.status !== 'PAID'

  const completedCount = tasks.filter((t) => t.status === 'DONE').length
  const totalCount = tasks.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const run = async (key: string, fn: () => Promise<unknown>, after?: (r: any) => void) => {
    setBusy(key)
    setError('')
    try {
      const r = await fn()
      after?.(r)
      onChanged?.()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const handleAdd = () => {
    if (!newTitle.trim()) return
    run('add', () => workspaceApi.addMilestoneTask(m.id, { title: newTitle.trim(), description: newDesc.trim() || undefined }), (list) => {
      setTasks(list)
      setNewTitle('')
      setNewDesc('')
      setAddingInColumn(null)
    })
  }

  const move = (task: MilestoneTask, next: Col) =>
    run('move-' + task.id, () => workspaceApi.updateMilestoneTask(m.id, task.id, { status: next }), setTasks)

  const columns: Array<{ id: Col; label: string; tone: string; borderTone: string; badge: string }> = [
    { id: 'TODO', label: 'To Do', tone: 'bg-[#F9F7F5]', borderTone: 'border-[#EAE3DA]', badge: 'bg-[#ECE5DC] text-[#6B5E51]' },
    { id: 'IN_PROGRESS', label: 'In Progress', tone: 'bg-[#FFF8F3]', borderTone: 'border-[#FED7AA]', badge: 'bg-[#FFEDD5] text-[#C06B3E]' },
    { id: 'DONE', label: 'Done', tone: 'bg-[#F2FAF4]', borderTone: 'border-[#BBF7D0]', badge: 'bg-[#DCFCE7] text-[#15803D]' },
  ]

  // ---------------------------------------------------------------- locked phase
  if (state === 'LOCKED') {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-[14px] border border-dashed border-[#DCD3C7] bg-[#FAF8F5] px-3.5 py-3 font-manrope text-[12.5px] text-[#7A7065]">
        <Lock size={14} className="shrink-0 text-[#9A8E80]" />
        Phase {view.phaseNumber} is locked. It opens when phase {(view.phaseNumber || 2) - 1} is completed and paid.
      </div>
    )
  }

  // ---------------------------------------------------------------- what happens next (banner)
  let banner: React.ReactNode = null
  if (state === 'DONE') {
    banner = (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F9EE] px-3 py-1 text-[11px] font-bold text-[#1F874C]">
        <Lock size={12} /> Phase completed & paid
      </span>
    )
  } else if (!funded && !sentForApproval) {
    banner = isFreelancer ? (
      <span className="text-[11.5px] font-medium text-[#8C8072]">Step 1 · Add the sub-tasks for this phase, then send them to the client</span>
    ) : (
      <span className="text-[11.5px] font-medium text-[#8C8072]">Step 1 · The freelancer is planning this phase's sub-tasks</span>
    )
  } else if (sentForApproval) {
    banner = isClient ? (
      <span className="text-[11.5px] font-bold text-[#C06B3E]">Step 2 · Approve the sub-tasks and pay {formatINR(m.amount)} to start this phase</span>
    ) : (
      <span className="text-[11.5px] font-medium text-[#8C8072]">Step 2 · Waiting for the client to approve and pay</span>
    )
  } else if (m.status === 'SUBMITTED') {
    banner = <span className="text-[11.5px] font-medium text-[#8C8072]">Step 4 · Work submitted — waiting for the client's review</span>
  } else if (m.status === 'APPROVED') {
    banner = <span className="text-[11.5px] font-medium text-[#8C8072]">Step 5 · Work approved — payment release pending</span>
  } else {
    banner = (
      <span className="text-[11.5px] font-medium text-[#8C8072]">
        Step 3 · Paid and in progress{isFreelancer && totalCount > 0 && completedCount === totalCount ? ' — all done, submit the phase work' : ''}
      </span>
    )
  }

  return (
    <div className="mt-4 rounded-[18px] border border-[#EBE3D7] bg-[#FAF8F5]/80 p-3.5 sm:p-4 font-manrope">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE3D7] pb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={17} className="text-[#C06B3E]" />
          <h4 className="text-[13.5px] font-bold text-[#08182B]">
            {view.phaseNumber ? `Phase ${view.phaseNumber} · ` : ''}Task Cards
          </h4>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#7A6F62] border border-[#E6DDD0]">
            {completedCount}/{totalCount} completed ({percent}%)
          </span>
        </div>
        {banner}
      </div>

      {m.tasksChangeNote && !sentForApproval && !funded && (
        <div className="mt-2.5 rounded-[10px] border-l-4 border-l-[#C06B3E] bg-[#FAF4EE] px-3 py-2 text-[12px] text-[#4A4036]">
          <span className="font-bold">Client asked for changes:</span> {m.tasksChangeNote}
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-[10px] bg-red-50 p-2 text-[12px] font-semibold text-red-700">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E0D5]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#16A34A] transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>

      {/* Kanban Board Columns */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          const isAdding = addingInColumn === col.id
          return (
            <div key={col.id} className={`flex flex-col rounded-[14px] border ${col.borderTone} ${col.tone} p-3 min-h-[140px]`}>
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="text-[12px] font-bold text-[#08182B] flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${col.badge}`}>{colTasks.length}</span>
                  {col.label}
                </span>
                {canPlan && col.id === 'TODO' && !isAdding && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingInColumn(col.id)
                      setNewTitle('')
                      setNewDesc('')
                    }}
                    className="flex items-center gap-1 text-[11.5px] font-bold text-[#C06B3E] hover:text-[#08182B] transition-colors"
                  >
                    <Plus size={13} /> Add
                  </button>
                )}
              </div>

              <div className="mt-2.5 flex flex-col gap-2 flex-1">
                {colTasks.map((t) => (
                  <div key={t.id} className="group relative rounded-[12px] border border-white/90 bg-white p-2.5 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] transition-all hover:shadow-sm">
                    <p className="text-[12.5px] font-bold text-[#08182B] leading-snug">{t.title}</p>
                    {t.description && <p className="mt-1 text-[11.5px] text-[#786D61] leading-relaxed line-clamp-2">{t.description}</p>}
                    <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-[#F5F2EC] pt-2">
                      {canMove ? (
                        <div className="flex items-center gap-1">
                          {col.id !== 'TODO' && (
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={() => move(t, col.id === 'DONE' ? 'IN_PROGRESS' : 'TODO')}
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#7A7065] hover:bg-[#F0ECE4] disabled:opacity-50"
                            >
                              ← {col.id === 'DONE' ? 'In Progress' : 'To Do'}
                            </button>
                          )}
                          {col.id !== 'DONE' && (
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={() => move(t, col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                              className="rounded bg-[#FAF4EE] px-1.5 py-0.5 text-[10px] font-bold text-[#C06B3E] hover:bg-[#F3E6D8] disabled:opacity-50"
                            >
                              {col.id === 'TODO' ? 'Start →' : 'Done ✓'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-[10.5px] text-[#8E8376]">
                          {col.id === 'DONE' ? <CheckCircle2 size={11} className="text-[#16A34A]" /> : <Clock size={11} />}
                          {col.label}
                        </span>
                      )}
                      {canPlan && (
                        <button
                          type="button"
                          onClick={() => setConfirm({ deleteId: t.id })}
                          title="Delete card"
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#9E9081] hover:text-red-600 transition-opacity p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && !isAdding && (
                  <div className="flex-1 flex items-center justify-center p-3 text-center text-[11.5px] text-[#A69B8E] italic">
                    No cards in {col.label.toLowerCase()}
                  </div>
                )}

                {isAdding && (
                  <div className="rounded-[12px] border border-[#DECFBE] bg-white p-2.5 shadow-sm">
                    <input
                      type="text"
                      autoFocus
                      maxLength={150}
                      placeholder="Card title, e.g. Design wireframes..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-[8px] border border-[#E5DACD] px-2.5 py-1.5 text-[12px] font-semibold text-[#08182B] focus:border-[#C06B3E] focus:outline-none"
                    />
                    <textarea
                      placeholder="Notes / deliverables (optional)..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={2}
                      maxLength={500}
                      className="mt-1.5 w-full rounded-[8px] border border-[#E5DACD] px-2.5 py-1 text-[11.5px] text-[#08182B] focus:border-[#C06B3E] focus:outline-none"
                    />
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => setAddingInColumn(null)} className="rounded-full px-2.5 py-1 text-[11px] font-bold text-[#8C8072] hover:bg-[#F5F2EC]">
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!!busy || !newTitle.trim()}
                        onClick={handleAdd}
                        className="rounded-full bg-[#C06B3E] px-3.5 py-1 text-[11.5px] font-bold text-white hover:bg-[#A95A30] disabled:opacity-50"
                      >
                        {busy === 'add' ? 'Adding…' : 'Add Card'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Phase actions */}
      {canPlan && (
        <div className="mt-3.5 flex justify-end">
          <button
            type="button"
            disabled={!!busy || totalCount === 0}
            onClick={() => setConfirm('send')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#13294A] disabled:opacity-50"
          >
            <Send size={13} /> Send {totalCount || ''} sub-task{totalCount === 1 ? '' : 's'} to the client
          </button>
        </div>
      )}

      {isClient && current && sentForApproval && (
        <div className="mt-3.5">
          {askingChanges ? (
            <div className="rounded-[12px] border border-[#DECFBE] bg-white p-3">
              <textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                rows={2}
                maxLength={500}
                autoFocus
                placeholder="What should the freelancer change in these sub-tasks?"
                className="w-full rounded-[8px] border border-[#E5DACD] px-2.5 py-1.5 text-[12px] focus:border-[#C06B3E] focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-1.5">
                <button type="button" onClick={() => setAskingChanges(false)} className="rounded-full px-3 py-1 text-[11.5px] font-bold text-[#8C8072] hover:bg-[#F5F2EC]">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!!busy || !changeNote.trim()}
                  onClick={() =>
                    run('changes', () => workspaceApi.requestTaskChanges(m.id, changeNote.trim()), () => {
                      setAskingChanges(false)
                      setChangeNote('')
                    })
                  }
                  className="rounded-full bg-[#08182B] px-3.5 py-1 text-[11.5px] font-bold text-white disabled:opacity-50"
                >
                  {busy === 'changes' ? 'Sending…' : 'Send to freelancer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={!!busy}
                onClick={() => setAskingChanges(true)}
                className="rounded-full border border-[#DECFBE] px-4 py-2 text-[12.5px] font-bold text-[#08182B] hover:bg-[#FAF4EE] disabled:opacity-50"
              >
                Request changes
              </button>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => setConfirm('fund')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#AA572D] disabled:opacity-50"
              >
                <Wallet size={14} /> Approve & pay {formatINR(m.amount)}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        variant={confirm && typeof confirm === 'object' ? 'danger' : 'primary'}
        confirmLoading={!!busy}
        title={confirm === 'send' ? 'Send sub-tasks to the client?' : confirm === 'fund' ? `Approve and pay ${formatINR(m.amount)}?` : 'Delete this card?'}
        message={
          confirm === 'send'
            ? `The client reviews these ${totalCount} sub-task(s) and pays for "${m.title}" before work starts. You cannot change them while they are with the client.`
            : confirm === 'fund'
              ? `${formatINR(m.amount)} moves from your wallet into escrow for "${m.title}". The freelancer is paid only after you approve the submitted work.`
              : 'The card is removed from this phase.'
        }
        confirmText={confirm === 'send' ? 'Send' : confirm === 'fund' ? 'Approve & pay' : 'Delete'}
        onConfirm={() => {
          const c = confirm
          setConfirm(null)
          if (c === 'send') run('send', () => workspaceApi.submitPhaseTasks(m.id))
          else if (c === 'fund') run('fund', () => clientApi.fundMilestone(m.id))
          else if (c && typeof c === 'object') run('del', () => workspaceApi.deleteMilestoneTask(m.id, c.deleteId), setTasks)
        }}
      />
    </div>
  )
}
