import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
  Trash2,
  Pencil,
  Check,
  Bell,
  Briefcase,
} from 'lucide-react'
import {
  calendarApi,
  projectsApi,
  type CalendarTask,
  type CalendarTaskInput,
  type Project,
} from '../../services/api'
import { useRoleBase } from '../../services/useRoleBase'
import { toRouteId } from '../../services/routeIds'

// ---------------------------------------------------------------- helpers

type TaskType = CalendarTask['type']
type Priority = CalendarTask['priority']

/** A dated item shown on the calendar: a saved task, or a project deadline (read-only). */
interface CalendarItem {
  key: string
  title: string
  type: TaskType
  at: Date
  allDay: boolean
  done: boolean
  projectTitle?: string | null
  task?: CalendarTask
  projectId?: string
}

const TYPE_META: Record<TaskType, { label: string; dot: string; chip: string }> = {
  TASK: { label: 'Task', dot: 'bg-[#4F46E5]', chip: 'bg-[#EEF2FF] text-[#4338CA]' },
  MEETING: { label: 'Meeting', dot: 'bg-[#0EA5E9]', chip: 'bg-[#E0F2FE] text-[#0369A1]' },
  DEADLINE: { label: 'Deadline', dot: 'bg-[#EF4444]', chip: 'bg-[#FEE2E2] text-[#B91C1C]' },
  MILESTONE: { label: 'Milestone', dot: 'bg-[#F59E0B]', chip: 'bg-[#FEF3C7] text-[#B45309]' },
  REVIEW: { label: 'Review', dot: 'bg-[#8B5CF6]', chip: 'bg-[#EDE9FE] text-[#6D28D9]' },
}

const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: 'text-[#64748B]',
  MEDIUM: 'text-[#B45309]',
  HIGH: 'text-[#DC2626]',
}

const REMINDERS: { label: string; minutes: number | null }[] = [
  { label: 'No reminder', minutes: null },
  { label: 'At time of task', minutes: 0 },
  { label: '15 minutes before', minutes: 15 },
  { label: '1 hour before', minutes: 60 },
  { label: '1 day before', minutes: 1440 },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
/** Monday of the week containing d */
const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const toTimeInput = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const timeLabel = (item: CalendarItem) =>
  item.allDay ? 'All day' : item.at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

interface TaskForm {
  id?: string
  title: string
  type: TaskType
  priority: Priority
  date: string
  time: string
  projectId: string
  notes: string
  reminder: number | null
}

const emptyForm = (date: Date): TaskForm => ({
  title: '',
  type: 'TASK',
  priority: 'MEDIUM',
  date: toDateInput(date),
  time: '',
  projectId: '',
  notes: '',
  reminder: null,
})

const inputClass =
  'h-10 w-full rounded-[12px] border border-[#E5DACD] bg-[#FDFBF7] px-3 font-manrope text-[13px] text-[#08182B] outline-none focus:border-[#C06B3E] focus:bg-white focus:ring-2 focus:ring-[#C06B3E]/20'

// ---------------------------------------------------------------- page

export default function CalendarPage(): React.JSX.Element {
  const base = useRoleBase()
  const today = startOfDay(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date>(today)

  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [summary, setSummary] = useState<{ todo: number; inProgress: number; done: number; overdue: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<TaskForm>(emptyForm(today))
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Visible range: the 6-week month grid plus the selected week (for the roadmap)
  const gridStart = weekStart(new Date(currentYear, currentMonth, 1))
  const gridEnd = addDays(gridStart, 42)
  const roadmapStart = weekStart(selectedDate)
  const rangeFrom = roadmapStart < gridStart ? roadmapStart : gridStart
  const rangeTo = addDays(roadmapStart, 7) > gridEnd ? addDays(roadmapStart, 7) : gridEnd

  const loadTasks = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([calendarApi.getTasks(rangeFrom, rangeTo), calendarApi.getSummary()])
      setTasks(list)
      setSummary(sum)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Could not load your calendar')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeFrom.getTime(), rangeTo.getTime()])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    ;(base === '/client' ? projectsApi.getClientProjects() : projectsApi.getFreelancerProjects())
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [base])

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE')

  // Merge saved tasks with active project deadlines
  const items: CalendarItem[] = useMemo(() => {
    const list: CalendarItem[] = tasks
      .filter((t) => t.dueAt)
      .map((t) => ({
        key: 't-' + t.id,
        title: t.title,
        type: t.type,
        at: new Date(t.dueAt!),
        allDay: t.allDay,
        done: t.status === 'DONE',
        projectTitle: t.projectTitle,
        task: t,
      }))
    activeProjects.forEach((p) => {
      if (!p.deadline) return
      list.push({
        key: 'p-' + p.id,
        title: `${p.title} — final delivery`,
        type: 'DEADLINE',
        at: new Date(p.deadline),
        allDay: true,
        done: false,
        projectTitle: base === '/client' ? p.freelancerName || p.category : p.clientName || p.category,
        projectId: p.id,
      })
    })
    return list.sort((a, b) => a.at.getTime() - b.at.getTime())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, projects])

  const itemsByDay = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    items.forEach((i) => {
      const k = dayKey(i.at)
      ;(map[k] ||= []).push(i)
    })
    return map
  }, [items])

  const flash = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3000)
  }

  // ------------------------------------------------------------ actions

  const openDay = (date: Date) => {
    setSelectedDate(date)
    setForm(emptyForm(date))
    setShowForm((itemsByDay[dayKey(date)] || []).length === 0)
    setFormError('')
    setIsModalOpen(true)
  }

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    openDay(today)
  }

  const startEdit = (t: CalendarTask) => {
    const due = t.dueAt ? new Date(t.dueAt) : selectedDate
    setForm({
      id: t.id,
      title: t.title,
      type: t.type,
      priority: t.priority,
      date: toDateInput(due),
      time: t.allDay || !t.dueAt ? '' : toTimeInput(due),
      projectId: t.projectId || '',
      notes: t.notes || '',
      reminder: t.reminderMinutes ?? null,
    })
    setFormError('')
    setShowForm(true)
  }

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return setFormError('Please enter a title.')
    if (!form.date) return setFormError('Please pick a date.')
    const [y, m, d] = form.date.split('-').map(Number)
    const [hh, mm] = form.time ? form.time.split(':').map(Number) : [9, 0]
    const due = new Date(y, m - 1, d, hh, mm)
    const project = activeProjects.find((p) => p.id === form.projectId)
    const payload: CalendarTaskInput = {
      title: form.title.trim(),
      notes: form.notes.trim() || undefined,
      type: form.type,
      priority: form.priority,
      dueAt: due.toISOString(),
      allDay: !form.time,
      projectId: project?.id ?? null,
      projectTitle: project?.title ?? null,
      reminderMinutes: form.reminder,
    }
    setSaving(true)
    setFormError('')
    try {
      if (form.id) {
        const existing = tasks.find((t) => t.id === form.id)
        await calendarApi.updateTask(form.id, { ...payload, status: existing?.status })
        flash('Task updated')
      } else {
        await calendarApi.createTask(payload)
        flash('Task added')
      }
      setForm(emptyForm(selectedDate))
      setShowForm(false)
      // follow the task if it moved to another day
      if (!sameDay(due, selectedDate)) setSelectedDate(startOfDay(due))
      await loadTasks()
    } catch (err: any) {
      setFormError(err.message || 'Could not save the task')
    } finally {
      setSaving(false)
    }
  }

  const toggleDone = async (t: CalendarTask) => {
    const next = t.status === 'DONE' ? 'TODO' : 'DONE'
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)))
    try {
      await calendarApi.setStatus(t.id, next)
      calendarApi.getSummary().then(setSummary).catch(() => {})
    } catch (err: any) {
      setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))
      setError(err.message)
    }
  }

  const deleteTask = async (t: CalendarTask) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return
    try {
      await calendarApi.deleteTask(t.id)
      setTasks((prev) => prev.filter((x) => x.id !== t.id))
      calendarApi.getSummary().then(setSummary).catch(() => {})
      flash('Task deleted')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Close modal with Escape
  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsModalOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isModalOpen])

  // ------------------------------------------------------------ derived view data

  const gridDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const roadmapDays = Array.from({ length: 7 }, (_, i) => addDays(roadmapStart, i))
  const selectedItems = itemsByDay[dayKey(selectedDate)] || []
  const todayItems = itemsByDay[dayKey(today)] || []
  const projectDeadlinesOverdue = activeProjects.filter((p) => p.deadline && new Date(p.deadline) < new Date()).length

  const statusCards = [
    { label: 'To Do', count: summary?.todo ?? 0, bg: 'bg-[#FBF8F3]', num: 'text-[#1F2937]', icon: <div className="h-3.5 w-3.5 rounded-full border-2 border-[#94A3B8]" /> },
    { label: 'In Progress', count: (summary?.inProgress ?? 0) + activeProjects.length, bg: 'bg-[#F6EFE7]', num: 'text-[#C06B3E]', icon: <Clock size={15} className="text-[#C06B3E]" /> },
    {
      label: 'Completed',
      count: summary?.done ?? 0,
      bg: 'bg-[#EFFBF2]',
      num: 'text-[#1F874C]',
      icon: (
        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1F874C] text-white">
          <Check size={9} strokeWidth={4} />
        </div>
      ),
    },
    {
      label: 'Overdue',
      count: (summary?.overdue ?? 0) + projectDeadlinesOverdue,
      bg: 'bg-[#FFF1F2]',
      num: 'text-[#E11D48]',
      icon: <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#E11D48] text-[9px] font-black text-[#E11D48]">!</div>,
    },
  ]

  const itemRow = (item: CalendarItem, compact = false) => {
    const meta = TYPE_META[item.type]
    const overdue = !item.done && item.at < new Date() && !sameDay(item.at, new Date())
    return (
      <div
        key={item.key}
        className={`flex items-start gap-2.5 rounded-[12px] border px-3 py-2.5 ${
          item.done ? 'border-[#E8E2D9] bg-[#FAF8F5] opacity-70' : 'border-[#EFE4D7] bg-white'
        }`}
      >
        {item.task ? (
          <button
            type="button"
            onClick={() => toggleDone(item.task!)}
            aria-label={item.done ? `Mark ${item.title} as not done` : `Mark ${item.title} as done`}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
              item.done ? 'border-[#1F874C] bg-[#1F874C] text-white' : 'border-[#CCAFA0] hover:border-[#C06B3E]'
            }`}
          >
            {item.done && <Check size={10} strokeWidth={3} />}
          </button>
        ) : (
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-bold text-[#08182B] ${item.done ? 'line-through' : ''} ${compact ? 'truncate' : 'break-words'}`}>{item.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#8E8376]">
            <span className={`rounded-full px-1.5 py-px font-bold ${meta.chip}`}>{meta.label}</span>
            <span className={overdue ? 'font-bold text-[#DC2626]' : ''}>{overdue ? 'Overdue · ' : ''}{timeLabel(item)}</span>
            {item.task && <span className={`font-semibold ${PRIORITY_STYLE[item.task.priority]}`}>{item.task.priority.toLowerCase()}</span>}
            {item.task?.reminderMinutes != null && <Bell size={10} aria-label="Reminder set" />}
            {item.projectTitle && <span className="truncate">· {item.projectTitle}</span>}
          </p>
          {!compact && item.task?.notes && <p className="mt-1 whitespace-pre-line text-[12px] text-[#5C5248]">{item.task.notes}</p>}
        </div>
        {!compact && item.task && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => startEdit(item.task!)} aria-label={`Edit ${item.title}`} className="rounded p-1 text-[#8E8376] hover:bg-[#F5ECE1] hover:text-[#08182B]">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={() => deleteTask(item.task!)} aria-label={`Delete ${item.title}`} className="rounded p-1 text-[#8E8376] hover:bg-red-50 hover:text-red-600">
              <Trash2 size={13} />
            </button>
          </div>
        )}
        {!compact && item.projectId && (
          <Link to={`${base}/projects/${toRouteId(item.projectId)}`} className="shrink-0 rounded p-1 text-[#8E8376] hover:text-[#C06B3E]" aria-label="Open project">
            <Briefcase size={13} />
          </Link>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------ render

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-4 shadow-xs font-manrope sm:p-7 lg:p-8">
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-manrope text-[24px] font-bold text-[#C06B3E] sm:text-[26px]">Calendar</h1>
            <p className="mt-0.5 font-manrope text-[14px] text-[#7A7065]">Plan your schedule, track deadlines and set reminders.</p>
          </div>
          <button
            type="button"
            onClick={() => openDay(selectedDate)}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-full bg-[#C06B3E] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#AA572D] sm:self-auto"
          >
            <Plus size={15} /> New task
          </button>
        </div>

        {(error || notice) && (
          <div
            role="status"
            className={`rounded-[12px] border p-3 text-[13px] font-semibold ${
              error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {error || notice}
            {error && (
              <button type="button" onClick={() => loadTasks()} className="ml-2 underline">
                Retry
              </button>
            )}
          </div>
        )}

        {/* Month grid + side cards */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex w-full flex-col justify-between rounded-[20px] border border-[#E5E5E5] bg-white p-3 shadow-xs sm:p-6 lg:col-span-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
                <h2 className="font-manrope text-[17px] font-bold text-[#08182B] sm:text-[18px]">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={goToday}
                    className="rounded-full border border-[#E5DACD] bg-white px-3.5 py-1 text-[12px] font-bold text-[#4A4036] transition-colors hover:bg-[#FAF7F2]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] transition-colors hover:bg-[#FAF7F2]"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] transition-colors hover:bg-[#FAF7F2]"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 py-2 text-center font-manrope text-[10px] font-bold uppercase tracking-wider text-[#A09588] sm:text-[11.5px]">
                {WEEKDAYS_SHORT.map((d) => (
                  <div key={d}>
                    <span className="sm:hidden">{d.charAt(0)}</span>
                    <span className="hidden sm:inline">{d}</span>
                  </div>
                ))}
              </div>

              <div className={`grid grid-cols-7 gap-1 text-center font-manrope text-[13px] sm:gap-y-2 sm:text-[13.5px] ${loading ? 'opacity-50' : ''}`}>
                {gridDays.map((day) => {
                  const inMonth = day.getMonth() === currentMonth
                  const isToday = sameDay(day, today)
                  const isSelected = sameDay(day, selectedDate)
                  const dayItems = itemsByDay[dayKey(day)] || []
                  const types = Array.from(new Set(dayItems.filter((i) => !i.done).map((i) => i.type))).slice(0, 3)
                  return (
                    <button
                      key={dayKey(day)}
                      type="button"
                      onClick={() => openDay(day)}
                      aria-label={`${day.toDateString()}${dayItems.length ? `, ${dayItems.length} item${dayItems.length === 1 ? '' : 's'}` : ''}`}
                      className="group flex items-center justify-center py-0.5"
                    >
                      <span
                        className={`flex aspect-square w-full max-w-[44px] flex-col items-center justify-center rounded-[10px] transition-all ${
                          isToday
                            ? 'bg-[#EEF2FF] font-bold text-[#4F46E5] ring-2 ring-[#4F46E5]/25'
                            : isSelected
                            ? 'bg-[#FAF3ED] font-bold text-[#C06B3E] ring-2 ring-[#C06B3E]/40'
                            : inMonth
                            ? 'font-medium text-[#334155] group-hover:bg-[#F7F4EF]'
                            : 'text-[#CBD5E1] group-hover:bg-[#F7F4EF]'
                        }`}
                      >
                        <span>{day.getDate()}</span>
                        <span className="mt-0.5 flex h-1 gap-0.5">
                          {types.map((t) => (
                            <span key={t} className={`h-1 w-1 rounded-full ${TYPE_META[t].dot}`} />
                          ))}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#F0ECE6] pt-4 font-manrope text-[12px] font-medium text-[#7A7065]">
              {(Object.keys(TYPE_META) as TaskType[]).map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${TYPE_META[t].dot}`} />
                  <span>{TYPE_META[t].label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs sm:p-6">
              <h3 className="pb-3.5 font-manrope text-[16px] font-bold text-[#08182B]">Task Status</h3>
              <div className="flex flex-col gap-2.5">
                {statusCards.map((c) => (
                  <div key={c.label} className={`flex items-center justify-between rounded-[14px] p-3 ${c.bg}`}>
                    <div className="flex items-center gap-2.5">
                      {c.icon}
                      <span className="text-[13px] font-bold text-[#2A231A]">{c.label}</span>
                    </div>
                    <span className={`text-[15px] font-extrabold ${c.num}`}>{c.count}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#8E8376]">In progress and overdue include your active project deadlines.</p>
            </div>

            <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Today's Summary</h3>
                <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#6366F1]">
                  {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {todayItems.length === 0 ? (
                <p className="py-2 text-[13px] text-[#8E8376]">Nothing scheduled for today.</p>
              ) : (
                <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">{todayItems.map((i) => itemRow(i, true))}</div>
              )}
              <button
                type="button"
                onClick={goToday}
                className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#EEF2FF] font-manrope text-[13px] font-bold text-[#4F46E5] transition-all hover:bg-[#E0E7FF]"
              >
                <Plus size={15} />
                <span>Add to Today</span>
              </button>
            </div>
          </div>
        </div>

        {/* Weekly roadmap for the selected week */}
        <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-4 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Week of {roadmapStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF7F2]"
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF7F2]"
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="grid min-w-[760px] grid-cols-7 gap-3 lg:min-w-0">
              {roadmapDays.map((day, idx) => {
                const dayItems = itemsByDay[dayKey(day)] || []
                const doneCount = dayItems.filter((i) => i.done).length
                const isToday = sameDay(day, today)
                return (
                  <div
                    key={dayKey(day)}
                    className={`flex min-h-[180px] flex-col rounded-[16px] border p-2.5 ${
                      isToday ? 'border-[#C06B3E]/50 bg-[#FFF9F3]' : 'border-[#F0ECE6] bg-[#FDFBF8]'
                    }`}
                  >
                    <button type="button" onClick={() => openDay(day)} className="mb-2 text-left">
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#A09588]">{WEEKDAYS_SHORT[idx]}</span>
                      <span className={`text-[18px] font-extrabold ${isToday ? 'text-[#C06B3E]' : 'text-[#08182B]'}`}>{day.getDate()}</span>
                    </button>
                    <div className="flex flex-1 flex-col gap-1.5">
                      {dayItems.slice(0, 4).map((i) => (
                        <button
                          key={i.key}
                          type="button"
                          onClick={() => openDay(day)}
                          className={`rounded-[8px] px-2 py-1.5 text-left text-[11px] font-semibold leading-tight ${TYPE_META[i.type].chip} ${i.done ? 'line-through opacity-60' : ''}`}
                        >
                          <span className="block truncate">{i.title}</span>
                          {!i.allDay && <span className="block font-normal opacity-80">{timeLabel(i)}</span>}
                        </button>
                      ))}
                      {dayItems.length > 4 && (
                        <button type="button" onClick={() => openDay(day)} className="text-left text-[11px] font-bold text-[#8E8376]">
                          +{dayItems.length - 4} more
                        </button>
                      )}
                      {dayItems.length === 0 && (
                        <button
                          type="button"
                          onClick={() => openDay(day)}
                          className="mt-auto flex items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#E5DACD] py-1.5 text-[11px] font-semibold text-[#B8A99A] hover:border-[#C06B3E] hover:text-[#C06B3E]"
                        >
                          <Plus size={11} /> Add
                        </button>
                      )}
                    </div>
                    {dayItems.length > 0 && (
                      <span className="mt-2 text-[10.5px] font-semibold text-[#8E8376]">
                        {doneCount}/{dayItems.length} done
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day modal: list + add / edit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Tasks for ${selectedDate.toDateString()}`}
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-w-[520px] sm:rounded-[24px]">
            <div className="flex items-start justify-between border-b border-[#F0ECE6] px-5 py-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#A09588]">
                  {selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })}
                </p>
                <h3 className="text-[18px] font-extrabold text-[#08182B]">
                  {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close" className="rounded-full p-1.5 text-[#7A7065] hover:bg-[#F5F2EC]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selectedItems.length > 0 && <div className="mb-4 flex flex-col gap-2">{selectedItems.map((i) => itemRow(i))}</div>}

              {!showForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm(selectedDate))
                    setShowForm(true)
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#DECFBE] py-3 text-[13px] font-bold text-[#C06B3E] hover:bg-[#FFF9F3]"
                >
                  <Plus size={15} /> Add a task for this day
                </button>
              ) : (
                <form onSubmit={saveTask} className="flex flex-col gap-3">
                  <h4 className="text-[14px] font-bold text-[#08182B]">{form.id ? 'Edit task' : 'New task'}</h4>
                  <input
                    className={inputClass}
                    placeholder="What do you need to do?"
                    value={form.title}
                    maxLength={200}
                    autoFocus
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="flex flex-col gap-1 text-[11.5px] font-bold text-[#7A7065]">
                      Type
                      <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })}>
                        {(Object.keys(TYPE_META) as TaskType[]).map((t) => (
                          <option key={t} value={t}>{TYPE_META[t].label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-[11.5px] font-bold text-[#7A7065]">
                      Priority
                      <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-[11.5px] font-bold text-[#7A7065]">
                      Date
                      <input className={inputClass} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1 text-[11.5px] font-bold text-[#7A7065]">
                      Time <span className="font-normal">(empty = all day)</span>
                      <input className={inputClass} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                    </label>
                    <label className="col-span-2 flex flex-col gap-1 text-[11.5px] font-bold text-[#7A7065] sm:col-span-1">
                      Project
                      <select className={inputClass} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                        <option value="">Personal</option>
                        {activeProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </label>
                    <label className="col-span-2 flex flex-col gap-1 text-[11.5px] font-bold text-[#7A7065] sm:col-span-1">
                      Reminder
                      <select
                        className={inputClass}
                        value={form.reminder === null ? '' : String(form.reminder)}
                        onChange={(e) => setForm({ ...form, reminder: e.target.value === '' ? null : Number(e.target.value) })}
                      >
                        {REMINDERS.map((r) => (
                          <option key={r.label} value={r.minutes === null ? '' : String(r.minutes)}>{r.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <textarea
                    className={inputClass + ' h-20 py-2'}
                    placeholder="Notes (optional)"
                    maxLength={4000}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                  {form.reminder !== null && (
                    <p className="text-[11.5px] text-[#8E8376]">You'll get a notification in Hunhar at the reminder time.</p>
                  )}
                  {formError && <p className="text-[12px] font-semibold text-red-600">{formError}</p>}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setFormError('')
                      }}
                      className="rounded-full border border-[#E5DACD] px-5 py-2 text-[13px] font-bold text-[#5C5248]"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded-full bg-[#C06B3E] px-6 py-2 text-[13px] font-bold text-white disabled:opacity-60">
                      {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add task'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
