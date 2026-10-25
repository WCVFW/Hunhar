import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Plus,
  Check,
  Trash2,
} from 'lucide-react'
import quoteMascot from '../../assets/Leadership_luna.png'
import cardDeskMascot from '../../assets/Job_details_image.png'
import {
  walletApi,
  creditsApi,
  projectsApi,
  bidsApi,
  calendarApi,
  tokenStorage,
  type BidStatus,
  type CalendarTask,
} from '../../services/api'
import {
  BID_STATUS_LABEL,
  BID_STATUS_STYLE,
  deadlineLabel,
  formatDate,
  formatINR,
  isOverdue,
  splitList,
  timeAgo,
} from '../../services/format'

interface StatCardProps {
  label: string
  value: string | number
  to: string
}

function StatCard({ label, value, to }: StatCardProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center rounded-[18px] border border-[#DECFBE]/90 bg-[#FBF8F3] px-3 py-4 text-center no-underline shadow-[0_2px_8px_rgba(192,107,62,0.04)] transition-all hover:border-[#C06B3E]/40 hover:shadow-md"
    >
      <span className="font-manrope text-[11px] font-bold uppercase tracking-wider text-[#C06B3E]">
        {label}
      </span>
      <span className="mt-1 font-manrope text-[28px] font-extrabold tracking-tight text-[#C06B3E] lg:text-[32px]">
        {value}
      </span>
    </Link>
  )
}

interface ProjectCardData {
  id: string
  category: string
  timeAgo: string
  title: string
  deadline: string
  client: string
  description: string
  budget: string
  tags: string[]
  extraTags: number
  status: string
  alreadyBid: boolean
}

interface DeadlineItem {
  id: string
  title: string
  subtitle: string
  date: string
  overdue: boolean
  link: string
}

interface RecentBidItem {
  id: string
  title: string
  clientDate: string
  amount: string
  status: BidStatus
}

export default function FreelancerDashboard(): React.JSX.Element {
  const [userName, setUserName] = useState<string>(() => tokenStorage.getUser()?.fullName || '')
  const [stats, setStats] = useState({
    activeProjects: '–' as string | number,
    walletBalance: '–',
    credits: '–' as string | number,
    pendingBids: '–' as string | number,
  })
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true)
  const [projectsError, setProjectsError] = useState<string>('')
  const [recentBidsList, setRecentBidsList] = useState<RecentBidItem[]>([])
  const [deadlinesList, setDeadlinesList] = useState<DeadlineItem[]>([])

  // To-dos are undated planner tasks stored on the server (shared with the Calendar page)
  const [todoList, setTodoList] = useState<CalendarTask[]>([])
  const [todoError, setTodoError] = useState<string>('')
  const [newTodoText, setNewTodoText] = useState('')
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [savingTodo, setSavingTodo] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      setProjectsLoading(true)
      const now = new Date()
      const in30Days = new Date(now.getTime() + 30 * 86_400_000)

      const [walletRes, creditRes, myBidsRes, myProjectsRes, openProjectsRes, todosRes, tasksRes] = await Promise.allSettled([
        walletApi.getMyWallet(),
        creditsApi.getMyCredits(),
        bidsApi.getMyBids(),
        projectsApi.getFreelancerProjects(),
        projectsApi.getProjects({ size: 6, sort: 'newest' }),
        calendarApi.getTodos(),
        calendarApi.getTasks(new Date(now.getTime() - 7 * 86_400_000), in30Days),
      ])
      if (cancelled) return

      setStats({
        walletBalance: walletRes.status === 'fulfilled' ? formatINR(walletRes.value?.availableBalance) : '–',
        credits: creditRes.status === 'fulfilled' ? creditRes.value.balance : '–',
        pendingBids:
          myBidsRes.status === 'fulfilled'
            ? myBidsRes.value.filter((b) => b.status === 'SUBMITTED' || b.status === 'SHORTLISTED').length
            : '–',
        activeProjects:
          myProjectsRes.status === 'fulfilled' ? myProjectsRes.value.filter((p) => p.status === 'ACTIVE').length : '–',
      })

      if (myBidsRes.status === 'fulfilled') {
        setRecentBidsList(
          myBidsRes.value.slice(0, 4).map((b) => ({
            id: b.id,
            title: b.projectTitle || 'Project',
            clientDate: `${b.clientName || 'Client'} · ${formatDate(b.createdAt)}`,
            amount: formatINR(b.proposedCost),
            status: b.status,
          }))
        )
      }

      // Upcoming deadlines: active project deadlines + dated, unfinished planner tasks
      const deadlines: (DeadlineItem & { at: number })[] = []
      if (myProjectsRes.status === 'fulfilled') {
        myProjectsRes.value
          .filter((p) => p.status === 'ACTIVE' && p.deadline)
          .forEach((p) =>
            deadlines.push({
              id: 'p-' + p.id,
              title: p.title,
              subtitle: `${p.category} · ${p.clientName || 'Client'}`,
              date: deadlineLabel(p),
              overdue: isOverdue(p),
              link: `/freelancer/projects/${p.id}`,
              at: new Date(p.deadline!).getTime(),
            })
          )
      }
      if (tasksRes.status === 'fulfilled') {
        tasksRes.value
          .filter((t) => t.status !== 'DONE' && t.dueAt)
          .forEach((t) => {
            const at = new Date(t.dueAt!).getTime()
            deadlines.push({
              id: 't-' + t.id,
              title: t.title,
              subtitle: `${t.type.charAt(0) + t.type.slice(1).toLowerCase()}${t.projectTitle ? ' · ' + t.projectTitle : ''}`,
              date: at < Date.now() ? 'Overdue' : formatDate(t.dueAt),
              overdue: at < Date.now(),
              link: '/freelancer/calendar',
              at,
            })
          })
      }
      setDeadlinesList(deadlines.sort((a, b) => a.at - b.at).slice(0, 4))

      if (todosRes.status === 'fulfilled') {
        setTodoList(todosRes.value)
      } else {
        setTodoError('Could not load your to-do list.')
      }

      if (openProjectsRes.status === 'fulfilled') {
        setProjectsError('')
        setProjects(
          openProjectsRes.value.content.map((p) => {
            const tags = splitList(p.skills)
            return {
              id: p.id,
              category: (p.category || 'General').toUpperCase(),
              timeAgo: timeAgo(p.createdAt),
              title: p.title,
              deadline: `${p.timelineDays} days`,
              client: p.clientName || 'Client',
              description: p.description,
              budget: formatINR(p.budget),
              tags: tags.slice(0, 3),
              extraTags: Math.max(0, tags.length - 3),
              status: `${p.bidCount} proposal${p.bidCount === 1 ? '' : 's'}`,
              alreadyBid: !!p.myBidStatus && p.myBidStatus !== 'WITHDRAWN',
            }
          })
        )
      } else {
        setProjectsError(openProjectsRes.reason?.message || 'Could not load projects.')
      }
      setProjectsLoading(false)
    }

    loadDashboardData()
    const stored = tokenStorage.getUser()
    if (stored?.fullName) setUserName(stored.fullName)
    return () => {
      cancelled = true
    }
  }, [])

  const toggleTodo = async (item: CalendarTask) => {
    const next = item.status === 'DONE' ? 'TODO' : 'DONE'
    setTodoList((prev) => prev.map((t) => (t.id === item.id ? { ...t, status: next } : t)))
    try {
      await calendarApi.setStatus(item.id, next)
    } catch (err: any) {
      setTodoList((prev) => prev.map((t) => (t.id === item.id ? { ...t, status: item.status } : t)))
      setTodoError(err.message)
    }
  }

  const deleteTodo = async (item: CalendarTask) => {
    setTodoList((prev) => prev.filter((t) => t.id !== item.id))
    try {
      await calendarApi.deleteTask(item.id)
    } catch (err: any) {
      setTodoList((prev) => [...prev, item])
      setTodoError(err.message)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTodoText.trim()
    if (!title || savingTodo) return
    setSavingTodo(true)
    setTodoError('')
    try {
      const created = await calendarApi.createTask({ title, type: 'TASK', priority: 'MEDIUM', allDay: false })
      setTodoList((prev) => [...prev, created])
      setNewTodoText('')
      setIsAddingTodo(false)
    } catch (err: any) {
      setTodoError(err.message)
    } finally {
      setSavingTodo(false)
    }
  }

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 sm:p-7 lg:p-8 shadow-xs font-manrope">
      <div className="flex w-full flex-col gap-6">
        {/* 1. WELCOME BANNER & DATE */}
        <section className="flex flex-col justify-between gap-2 border-b border-[#F0F0F0] pb-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-manrope text-[26px] font-extrabold tracking-tight text-[#C06B3E] sm:text-[30px]">
              Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-0.5 font-manrope text-[14px] text-[#786D61]">
              Here's what's happening with your work on hunhar.in today.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium text-[#786D61]">
            <CalendarIcon size={16} className="text-[#96897A]" />
            <span>{todayFormatted}</span>
          </div>
        </section>

        {/* 3. ROW: QUOTE BANNER + TO DO LIST + 4 STAT CARDS */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Quote Card (lg:col-span-4) - Matched to UI Design */}
          <div className="relative flex min-h-[225px] flex-col justify-between overflow-hidden rounded-[20px] border border-[#DECFBE] bg-[#EFE5DB] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] lg:col-span-4">
            {/* Subtle warm circle backdrop behind Luna (as seen in UI design 1) */}
            <div className="pointer-events-none absolute -bottom-8 right-2 h-44 w-44 rounded-full bg-[#D7A97E]/35" />

            {/* Top & Middle: Quote Mark and Heading */}
            <div className="relative z-10 max-w-[200px] sm:max-w-[215px]">
              {/* SVG Quote Icon matching UI 1 design */}
              <svg
                className="h-7 w-7 text-[#D5A885]"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M10 8c-3.3 0-6 2.7-6 6 0 3.3 2.7 6 6 6 1 0 1.9-.3 2.8-.7C11.9 22.3 9.2 24.6 6 25l-.5.1v2.9h.5c6.6 0 12-5.4 12-12 0-4.4-3.6-8-8-8zm14 0c-3.3 0-6 2.7-6 6 0 3.3 2.7 6 6 6 1 0 1.9-.3 2.8-.7-.9 3-3.6 5.3-6.8 5.7l-.5.1v2.9h.5c6.6 0 12-5.4 12-12 0-4.4-3.6-8-8-8z" />
              </svg>

              {/* Quote Heading */}
              <h2 className="mt-2 font-manrope text-[20px] font-extrabold leading-[1.22] tracking-tight text-[#C06B3E] sm:text-[21px]">
                Leadership is not a position or title. it is example and action.
              </h2>
            </div>

            {/* Author Name */}
            <div className="relative z-10 mt-4 flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#5C5248]">
              <span className="inline-block h-[1.5px] w-5 bg-[#5C5248]" />
              <span>Paulo Coelho</span>
            </div>

            {/* Luna Mascot - Bottom-right positioned, cleanly cropped at bottom edge */}
            <div className="pointer-events-none absolute -bottom-1 -right-1 z-10 w-[155px] sm:w-[170px] select-none">
              <img
                src={quoteMascot}
                alt="Luna Mascot"
                className="h-full w-full object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
              />
            </div>
          </div>

          {/* To Do List Card (lg:col-span-4) */}
          <div className="flex min-h-[225px] flex-col justify-between rounded-[20px] border border-[#DECFBE] bg-[#FBF8F3] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] lg:col-span-4">
            <div className="flex flex-col">
              {/* Header: Icon, Title, Add Task button */}
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E7D7C7] bg-[#FDFBF7] text-[#C06B3E] shadow-2xs">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">To do List</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTodo(!isAddingTodo)}
                  className="flex items-center gap-1 rounded-full bg-[#C06B3E] px-3.5 py-1.5 font-manrope text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Optional Input when Add Task clicked */}
              {isAddingTodo && (
                <form onSubmit={handleAddTodo} className="mb-2 mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder="Enter task name..."
                    maxLength={200}
                    className="h-8 flex-1 rounded-lg border border-[#DBCAB8] bg-white px-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#C06B3E]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingTodo || !newTodoText.trim()}
                    className="rounded-lg bg-[#C06B3E] px-3 text-[11px] font-bold text-white hover:bg-[#AA572D] disabled:opacity-50"
                  >
                    {savingTodo ? 'Saving…' : 'Save'}
                  </button>
                </form>
              )}

              {/* List of To Do Items: Fixed height showing exactly 3 items, scrollable for 4th and beyond */}
              <div className="mt-1 flex max-h-[148px] flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#DECFBE_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#DECFBE] [&::-webkit-scrollbar-track]:bg-transparent">
                {todoError && <p className="text-[11px] font-semibold text-red-600">{todoError}</p>}
                {todoList.length === 0 && !todoError && (
                  <p className="py-4 text-center font-manrope text-[12px] text-[#8E8376]">
                    Nothing on your list. Add a task to plan your day.
                  </p>
                )}
                {todoList.map((item) => {
                  const done = item.status === 'DONE'
                  return (
                    <div
                      key={item.id}
                      role="checkbox"
                      aria-checked={done}
                      tabIndex={0}
                      onClick={() => toggleTodo(item)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          toggleTodo(item)
                        }
                      }}
                      className={`group flex cursor-pointer items-center gap-3 rounded-[12px] border px-3.5 py-2.5 transition-all ${done
                        ? 'border-[#E7D3C3] bg-[#F7EBE1]/90 text-[#8E7F73]'
                        : 'border-[#E5D7CA] bg-white text-[#2D241C] hover:border-[#C06B3E]/40 hover:bg-[#FFFDF9]'
                        }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${done
                          ? 'border-[#C06B3E] bg-[#C06B3E] text-white'
                          : 'border-[#CCAFA0] bg-transparent group-hover:border-[#C06B3E]'
                          }`}
                      >
                        {done && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span
                        className={`flex-1 font-manrope text-[13px] font-medium leading-tight ${done ? 'line-through opacity-80' : ''
                          }`}
                      >
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTodo(item)
                        }}
                        aria-label={`Delete ${item.title}`}
                        className="shrink-0 rounded p-0.5 text-[#B8A99A] opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 4 Stat Cards in 2x2 Grid (lg:col-span-4) */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-4">
            <StatCard label="ACTIVE PROJECTS" value={stats.activeProjects} to="/freelancer/projects" />
            <StatCard label="WALLET BALANCE" value={stats.walletBalance} to="/freelancer/wallet" />
            <StatCard label="CREDITS" value={stats.credits} to="/freelancer/credits" />
            <StatCard label="PENDING BIDS" value={stats.pendingBids} to="/freelancer/bids" />
          </div>
        </section>

        {/* 4. RECOMMENDED / LIVE PROJECTS (Horizontal 3 Columns) */}
        <section className="mt-2">
          {projectsLoading ? (
            <div className="flex min-h-[180px] w-full items-center justify-center rounded-[20px] border border-[#E7DCCE] bg-[#FBF8F3] p-8 text-center">
              <span className="font-manrope text-[14px] font-semibold text-[#8E8376]">Loading latest projects…</span>
            </div>
          ) : projectsError ? (
            <div className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-[20px] border border-red-200 bg-red-50 p-8 text-center">
              <p className="font-manrope text-[14px] font-semibold text-red-700">{projectsError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-full bg-[#08182B] px-4 py-1.5 font-manrope text-[12px] font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-8 text-center">
              <div className="h-10 w-10 rounded-full bg-[#F5ECE1] flex items-center justify-center text-[#C06B3E] font-bold text-lg mb-2">📁</div>
              <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">No open projects right now</h4>
              <p className="mt-1 font-manrope text-[13px] text-[#8E8376] max-w-[420px]">
                New projects appear here as soon as clients post them. Check back soon.
              </p>
              <Link
                to="/freelancer/browse"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#C06B3E] px-4 py-1.5 font-manrope text-[12px] font-bold text-white no-underline shadow-xs hover:bg-[#AA572D]"
              >
                Browse All Projects
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#E7DCCE] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-all hover:border-[#C06B3E]/50 hover:shadow-lg"
                >
                  <div>
                    {/* Header Tag + Time */}
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DACD] bg-[#FBF8F3] px-3 py-1 font-manrope text-[11px] font-bold tracking-wide text-[#9C5128]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C06B3E]" />
                        {project.category}
                      </span>
                      <span className="flex items-center gap-1 font-manrope text-[12px] font-medium text-[#9E9284]">
                        <Clock size={13} />
                        {project.timeAgo}
                      </span>
                    </div>

                    {/* Project Image Banner with Mascot Desk */}
                    <div className="relative mb-3.5 h-[145px] w-full overflow-hidden rounded-[14px] bg-[#E8DDD0]">
                      <img
                        src={cardDeskMascot}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    {/* Title & Deadline */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                          {project.title}
                        </h4>
                        <p className="mt-0.5 text-[12px] text-[#918578]">{project.client}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] font-medium text-[#B8572A]">Timeline</span>
                        <span className="font-manrope text-[12px] font-bold text-[#863D1A]">
                          {project.deadline}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2.5 line-clamp-2 font-manrope text-[12px] leading-relaxed text-[#73685C]">
                      {project.description}
                    </p>

                    {/* Budget */}
                    <div className="mt-3">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A05C35]">
                        BUDGET{' '}
                      </span>
                      <span className="font-manrope text-[13px] font-extrabold text-[#08182B]">
                        {project.budget}
                      </span>
                    </div>

                    {/* Skill tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[8px] bg-[#F5ECE1] px-2.5 py-1 font-manrope text-[11px] font-medium text-[#6F6457]"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.extraTags > 0 && (
                        <span className="rounded-[8px] bg-[#F5ECE1] px-2 py-1 font-manrope text-[11px] font-bold text-[#6F6457]">
                          +{project.extraTags}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bid Status & Action */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#F2E8DC] pt-3">
                    <span className="inline-flex items-center gap-1.5 font-manrope text-[12px] font-bold text-[#1F874C]">
                      <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                      {project.alreadyBid ? 'You applied' : project.status}
                    </span>

                    <Link
                      to={`/freelancer/browse/${project.id}`}
                      className="flex items-center gap-1 font-manrope text-[12px] font-extrabold text-[#08182B] no-underline transition-colors hover:text-[#C06B3E]"
                    >
                      {project.alreadyBid ? 'View' : 'View & Bid'}
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. BOTTOM ROW: UPCOMING DEADLINES & RECENT BIDS */}
        <section className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Upcoming Deadlines */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#E7DCCE] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <div>
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                  Upcoming Deadlines
                </h3>
                <Link
                  to="/freelancer/calendar"
                  className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] no-underline hover:text-[#C06B3E]"
                >
                  View all <ChevronRight size={15} />
                </Link>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {deadlinesList.length === 0 ? (
                  <p className="font-manrope text-[12px] text-[#8E8376] py-3 text-center">No upcoming deadlines. Win a project or add tasks in your calendar.</p>
                ) : (
                  deadlinesList.map((item) => (
                    <Link
                      key={item.id}
                      to={item.link}
                      className="flex items-center justify-between gap-3 rounded-[14px] border border-[#EFE4D7] bg-[#FAF7F2] p-3 no-underline transition-colors hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F0D5C3] bg-[#FCF1E8] text-[#C06B3E]">
                          <Clock size={16} />
                        </div>
                        <div>
                          <h4 className="font-manrope text-[13px] font-bold text-[#08182B]">
                            {item.title}
                          </h4>
                          <p className="font-manrope text-[11px] text-[#8E8376]">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className={`shrink-0 rounded-full px-3 py-1 font-manrope text-[11px] font-bold ${item.overdue ? 'bg-[#FFEAE5] text-[#D34026]' : 'bg-[#FDF3E8] text-[#B4652F]'}`}>
                        {item.date}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Bids */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#E7DCCE] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <div>
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">Recent Bids</h3>
                <Link
                  to="/freelancer/bids"
                  className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] no-underline hover:text-[#C06B3E]"
                >
                  View all <ChevronRight size={15} />
                </Link>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {recentBidsList.length === 0 ? (
                  <p className="font-manrope text-[12px] text-[#8E8376] py-3 text-center">No bids placed yet. Browse projects to place your first bid!</p>
                ) : (
                  recentBidsList.map((bid) => (
                    <Link
                      key={bid.id}
                      to="/freelancer/bids"
                      className="flex items-center justify-between gap-3 rounded-[14px] border border-[#EFE4D7] bg-[#FAF7F2] p-3 no-underline transition-colors hover:bg-white"
                    >
                      <div className="min-w-0">
                        <h4 className="truncate font-manrope text-[13px] font-bold text-[#08182B]">
                          {bid.title}
                        </h4>
                        <p className="truncate font-manrope text-[11px] text-[#8E8376]">{bid.clientDate}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-manrope text-[13px] font-bold text-[#08182B]">
                          {bid.amount}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${BID_STATUS_STYLE[bid.status]}`}
                        >
                          {BID_STATUS_LABEL[bid.status]}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
