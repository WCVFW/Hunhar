import React, { useState, useMemo } from 'react'
import { Plus, CheckCircle2, Clock, Trash2, Lock, ListTodo, AlertCircle } from 'lucide-react'
import { workspaceApi, type Milestone, type MilestoneTask } from '../../services/api'
import { phaseSync } from '../../services/phaseSync'

interface Props {
  milestone: Milestone
  canManage: boolean
  onChanged?: () => void
  altProjectId?: string
}

export default function MilestoneCardBoard({ milestone, canManage, onChanged, altProjectId }: Props) {
  const isLocked = milestone.status === 'APPROVED' || milestone.status === 'PAID'
  const projectKey = milestone.projectId
  const keys = useMemo(() => Array.from(new Set([projectKey, altProjectId].filter(Boolean))) as string[], [projectKey, altProjectId])
  const storageKey = `hunhar_phase_tasks_${projectKey}_${milestone.id}`

  const initialTasks = useMemo<MilestoneTask[]>(() => {
    if (milestone.tasksJson) {
      try {
        const parsed = JSON.parse(milestone.tasksJson)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
    }
    for (const k of keys) {
      try {
        const stored = localStorage.getItem(`hunhar_phase_tasks_${k}_${milestone.id}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {}
    }
    return []
  }, [milestone.tasksJson, milestone.id, keys])

  const [tasks, setTasks] = useState<MilestoneTask[]>(initialTasks)
  const [addingInColumn, setAddingInColumn] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync with phaseSync (server/cross-profile endpoint)
  React.useEffect(() => {
    let active = true

    const syncFromRemote = async () => {
      if (!projectKey && !altProjectId) return
      const data = await phaseSync.get(projectKey, altProjectId)
      if (!active) return
      if (data?.tasks?.[milestone.id] && Array.isArray(data.tasks[milestone.id])) {
        setTasks(data.tasks[milestone.id])
        for (const k of keys) {
          try {
            localStorage.setItem(`hunhar_phase_tasks_${k}_${milestone.id}`, JSON.stringify(data.tasks[milestone.id]))
          } catch {}
        }
      } else if (initialTasks.length > 0) {
        // Seed initial local tasks to remote sync store
        phaseSync.update(projectKey || altProjectId!, (prev) => ({
          ...prev,
          tasks: { ...prev.tasks, [milestone.id]: initialTasks },
        }), altProjectId)
      }
    }

    syncFromRemote()
    const timer = setInterval(syncFromRemote, 2000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [projectKey, altProjectId, milestone.id, initialTasks, keys])

  // Sync if milestone.tasksJson changes externally or via another window/tab
  React.useEffect(() => {
    if (initialTasks.length > 0) setTasks(initialTasks)
  }, [initialTasks])

  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && keys.some((k) => e.key === `hunhar_phase_tasks_${k}_${milestone.id}`) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setTasks(parsed)
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [keys, milestone.id])

  const completedCount = tasks.filter((t) => t.status === 'DONE').length
  const totalCount = tasks.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const persistTasks = (nextList: MilestoneTask[]) => {
    setTasks(nextList)
    for (const k of keys) {
      try {
        localStorage.setItem(`hunhar_phase_tasks_${k}_${milestone.id}`, JSON.stringify(nextList))
      } catch {}
    }

    if (projectKey || altProjectId) {
      phaseSync.update(projectKey || altProjectId!, (prev) => ({
        ...prev,
        tasks: { ...prev.tasks, [milestone.id]: nextList },
      }), altProjectId)
    }

    onChanged?.()
  }

  const handleAdd = async (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!newTitle.trim()) return
    setSaving(true)
    setError('')
    const optimisticTask: MilestoneTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      status,
      createdAt: new Date().toISOString(),
      completedAt: status === 'DONE' ? new Date().toISOString() : null,
    }
    const updated = [...tasks, optimisticTask]
    persistTasks(updated)
    setNewTitle('')
    setNewDesc('')
    setAddingInColumn(null)

    if (!milestone.id.startsWith('phase-')) {
      try {
        const apiTasks = await workspaceApi.addMilestoneTask(milestone.id, {
          title: optimisticTask.title,
          description: optimisticTask.description || undefined,
          status,
        })
        persistTasks(apiTasks)
      } catch (err: any) {
        // fallback remains in localStorage
      }
    }
    setSaving(false)
  }

  const handleStatusChange = async (task: MilestoneTask, nextStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (isLocked || !canManage) return
    setError('')
    const updated = tasks.map((t) =>
      t.id === task.id
        ? {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'DONE' ? (t.completedAt || new Date().toISOString()) : null,
        }
        : t
    )
    persistTasks(updated)

    if (!milestone.id.startsWith('phase-')) {
      try {
        const apiTasks = await workspaceApi.updateMilestoneTask(milestone.id, task.id, {
          status: nextStatus,
        })
        persistTasks(apiTasks)
      } catch (err: any) {
        // fallback remains in localStorage
      }
    }
  }

  const handleDelete = async (taskId: string) => {
    if (isLocked || !canManage) return
    if (!window.confirm('Delete this card?')) return
    setError('')
    const updated = tasks.filter((t) => t.id !== taskId)
    persistTasks(updated)

    if (!milestone.id.startsWith('phase-')) {
      try {
        const apiTasks = await workspaceApi.deleteMilestoneTask(milestone.id, taskId)
        persistTasks(apiTasks)
      } catch (err: any) {
        // fallback remains in localStorage
      }
    }
  }

  const columns: Array<{ id: 'TODO' | 'IN_PROGRESS' | 'DONE'; label: string; tone: string; borderTone: string; badge: string }> = [
    { id: 'TODO', label: 'To Do', tone: 'bg-[#F9F7F5]', borderTone: 'border-[#EAE3DA]', badge: 'bg-[#ECE5DC] text-[#6B5E51]' },
    { id: 'IN_PROGRESS', label: 'In Progress', tone: 'bg-[#FFF8F3]', borderTone: 'border-[#FED7AA]', badge: 'bg-[#FFEDD5] text-[#C06B3E]' },
    { id: 'DONE', label: 'Done', tone: 'bg-[#F2FAF4]', borderTone: 'border-[#BBF7D0]', badge: 'bg-[#DCFCE7] text-[#15803D]' },
  ]

  return (
    <div className="mt-4 rounded-[18px] border border-[#EBE3D7] bg-[#FAF8F5]/80 p-3.5 sm:p-4 font-manrope">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE3D7] pb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={17} className="text-[#C06B3E]" />
          <h4 className="text-[13.5px] font-bold text-[#08182B]">Phase Task Cards</h4>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#7A6F62] border border-[#E6DDD0]">
            {completedCount}/{totalCount} completed ({percent}%)
          </span>
        </div>

        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F9EE] px-3 py-1 text-[11px] font-bold text-[#1F874C]">
            <Lock size={12} /> Phase Completed & Locked
          </span>
        ) : canManage ? (
          <span className="text-[11.5px] font-medium text-[#8C8072]">
            Freelancer task breakdown for this phase
          </span>
        ) : (
          <span className="text-[11.5px] font-medium text-[#8C8072]">
            Client live progress view
          </span>
        )}
      </div>

      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-[10px] bg-red-50 p-2 text-[12px] font-semibold text-red-700">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E8E0D5]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#16A34A] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Kanban Board Columns */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          const isAdding = addingInColumn === col.id

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-[14px] border ${col.borderTone} ${col.tone} p-3 min-h-[140px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="text-[12px] font-bold text-[#08182B] flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${col.badge}`}>
                    {colTasks.length}
                  </span>
                  {col.label}
                </span>

                {canManage && !isLocked && !isAdding && (
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

              {/* Tasks List */}
              <div className="mt-2.5 flex flex-col gap-2 flex-1">
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    className="group relative rounded-[12px] border border-white/90 bg-white p-2.5 shadow-xs transition-all hover:shadow-sm"
                  >
                    <p className="text-[12.5px] font-bold text-[#08182B] leading-snug">{t.title}</p>
                    {t.description && (
                      <p className="mt-1 text-[11.5px] text-[#786D61] leading-relaxed line-clamp-2">{t.description}</p>
                    )}

                    {/* Actions and Status Movement */}
                    <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-[#F5F2EC] pt-2">
                      {canManage && !isLocked ? (
                        <div className="flex items-center gap-1">
                          {col.id !== 'TODO' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t, col.id === 'DONE' ? 'IN_PROGRESS' : 'TODO')}
                              title="Move back"
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#7A7065] hover:bg-[#F0ECE4]"
                            >
                              ← {col.id === 'DONE' ? 'In Progress' : 'To Do'}
                            </button>
                          )}
                          {col.id !== 'DONE' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t, col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                              title="Move forward"
                              className="rounded bg-[#FAF4EE] px-1.5 py-0.5 text-[10px] font-bold text-[#C06B3E] hover:bg-[#F3E6D8]"
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

                      {canManage && !isLocked && (
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          title="Delete card"
                          className="opacity-0 group-hover:opacity-100 text-[#9E9081] hover:text-red-600 transition-opacity p-0.5"
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

                {/* Inline Add Card Form */}
                {isAdding && (
                  <div className="rounded-[12px] border border-[#DECFBE] bg-white p-2.5 shadow-sm">
                    <input
                      type="text"
                      autoFocus
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
                      className="mt-1.5 w-full rounded-[8px] border border-[#E5DACD] px-2.5 py-1 text-[11.5px] text-[#08182B] focus:border-[#C06B3E] focus:outline-none"
                    />
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAddingInColumn(null)}
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold text-[#8C8072] hover:bg-[#F5F2EC]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving || !newTitle.trim()}
                        onClick={() => handleAdd(col.id)}
                        className="rounded-full bg-[#C06B3E] px-3.5 py-1 text-[11.5px] font-bold text-white hover:bg-[#A95A30] disabled:opacity-50"
                      >
                        {saving ? 'Adding…' : 'Add Card'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
