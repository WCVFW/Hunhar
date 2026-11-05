import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar as CalendarIcon, Plus, ArrowRight, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'
import { clientApi, projectsApi, tokenStorage, workspaceApi, type Bid, type Project, type Workspace } from '../../services/api'
import { BID_STATUS_LABEL, BID_STATUS_STYLE, deadlineLabel, formatDate, formatINR, isOverdue } from '../../services/format'
import { toRouteId } from '../../services/routeIds'

interface DeadlineItem {
  id: string
  title: string
  date: string
  daysLeft: string
  overdue: boolean
  link: string
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function ClientDashboardPage(): React.JSX.Element {
  const [clientName, setClientName] = useState<string>(() => tokenStorage.getUser()?.fullName || '')
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [ws, setWs] = useState<Workspace | null>(null)
  const [recentBids, setRecentBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    clientApi
      .getProfile()
      .then((p) => setClientName(p.fullName))
      .catch(() => {})

    async function load() {
      const [list, bids] = await Promise.allSettled([projectsApi.getClientProjects(), clientApi.recentBids()])
      if (list.status === 'fulfilled') {
        setProjects(list.value)
        const featured =
          list.value.find((p) => p.status === 'ACTIVE') || list.value.find((p) => p.status === 'OPEN') || list.value[0] || null
        setActiveProject(featured)
        if (featured && (featured.status === 'ACTIVE' || featured.status === 'COMPLETED')) {
          workspaceApi.get(featured.id).then(setWs).catch(() => {})
        }
      } else {
        setError(list.reason?.message || 'Could not load your projects')
      }
      if (bids.status === 'fulfilled') setRecentBids(bids.value)
      setLoading(false)
    }
    load()
  }, [])

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // Milestone tracking for the featured project
  const milestones = ws?.milestones.map((m) => m.milestone) || []
  const doneCount = milestones.filter((m) => m.status === 'APPROVED' || m.status === 'PAID').length
  const currentMilestone = milestones.find((m) => m.status !== 'APPROVED' && m.status !== 'PAID')
  const progress = activeProject?.progressPercentage ?? 0
  const overdue = activeProject ? isOverdue(activeProject) : false
  const awaitingReview = milestones.filter((m) => m.status === 'SUBMITTED').length

  // Proposals received per day this week (Mon..Sun)
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const perDay = DAY_LETTERS.map((_, i) => {
    const from = new Date(weekStart.getTime() + i * 86_400_000)
    const to = new Date(from.getTime() + 86_400_000)
    return recentBids.filter((b) => {
      const t = new Date(b.createdAt).getTime()
      return t >= from.getTime() && t < to.getTime()
    }).length
  })
  const maxPerDay = Math.max(1, ...perDay)
  const todayIdx = (new Date().getDay() + 6) % 7

  const deadlines: DeadlineItem[] = [
    ...projects
      .filter((p) => p.status === 'ACTIVE' && p.deadline)
      .map((p) => ({
        id: 'p-' + p.id,
        title: p.title,
        date: formatDate(p.deadline!, true),
        daysLeft: deadlineLabel(p),
        overdue: isOverdue(p),
        link: `/client/projects/${toRouteId(p.id)}`,
        at: new Date(p.deadline!).getTime(),
      })),
    ...milestones
      .filter((m) => m.dueDate && m.status !== 'PAID' && m.status !== 'APPROVED')
      .map((m) => {
        const days = Math.ceil((new Date(m.dueDate!).getTime() - Date.now()) / 86_400_000)
        return {
          id: 'm-' + m.id,
          title: `${m.title} (milestone)`,
          date: formatDate(m.dueDate!, true),
          daysLeft: days >= 0 ? `${days}d left` : `${-days}d overdue`,
          overdue: days < 0,
          link: `/client/projects/${toRouteId(m.projectId)}`,
          at: new Date(m.dueDate!).getTime(),
        }
      }),
  ]
    .sort((a, b) => a.at - b.at)
    .slice(0, 4)

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching Hunhar Design System */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-5 sm:p-8 lg:p-9 shadow-sm">
        {error && <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>}
        {/* 1. Header Welcome Bar & Create Project CTA */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#F5F2ED] pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#C06B3E]">
              {greeting()}{clientName ? `, ${clientName.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-1 font-manrope text-[13px] text-[#7A7065]">
              Here's what's happening with your projects on hunhar.in today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 font-manrope text-[13px] font-medium text-[#7A7065]">
              <CalendarIcon size={15} className="text-[#96897A]" />
              <span>{todayFormatted}</span>
            </div>

            <Link
              to="/client/create-project"
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#C06B3E] px-5 py-2.5 font-manrope text-[13px] font-bold text-white no-underline shadow-[0_4px_14px_-4px_rgba(192,107,62,0.5)] transition-all hover:bg-[#A95A30] active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Project</span>
            </Link>
          </div>
        </div>

        {/* 2. Top Row: Project Overview (Left) + Project Tracking (Right) */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Project Overview Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              {/* Top row: Title + ACTIVE status */}
              <div className="flex items-center justify-between">
                <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Project Overview
                </h2>
                {activeProject && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                    {activeProject.status === 'ACTIVE' ? 'ACTIVE' : activeProject.status === 'OPEN' ? 'OPEN FOR BIDS' : activeProject.status}
                  </span>
                )}
              </div>

              {/* Mascot Banner Artwork matching screenshot */}
              <div className="relative mt-4 h-[180px] sm:h-[210px] w-full overflow-hidden rounded-[20px] bg-[#E8DDD0]">
                <img
                  src={cardDeskMascot}
                  alt={activeProject?.title || 'Project'}
                  className="h-full w-full object-cover select-none"
                />
              </div>

              {/* Project Details */}
              {loading ? (
                <p className="mt-5 text-[13px] text-[#8C9BA8]">Loading…</p>
              ) : !activeProject ? (
                <div className="mt-5">
                  <h3 className="font-manrope text-[17px] font-extrabold text-[#08182B]">No projects yet</h3>
                  <p className="mt-1 text-[13px] text-[#7A7065]">Post your first project to start receiving proposals from freelancers.</p>
                </div>
              ) : (
                <div className="mt-5">
                  <h3 className="font-manrope text-[18px] font-extrabold text-[#08182B]">{activeProject.title}</h3>
                  <p className="mt-0.5 font-manrope text-[13px] text-[#7A7065]">
                    {activeProject.freelancerName
                      ? `Assigned to ${activeProject.freelancerName}`
                      : `${activeProject.bidCount} proposal${activeProject.bidCount === 1 ? '' : 's'} · Budget ${formatINR(activeProject.budget)}`}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#C06B3E]">
                      <Clock size={15} />
                      <span>{activeProject.status === 'ACTIVE' ? 'Deadline' : 'Timeline'}</span>
                    </div>
                    <span className={`font-manrope text-[13px] font-bold ${overdue ? 'text-[#DC2626]' : 'text-[#08182B]'}`}>
                      {activeProject.status === 'ACTIVE' ? deadlineLabel(activeProject) : `${activeProject.timelineDays} Days`}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[13px] text-[#7A7065]">Current Phase</span>
                    <span className="max-w-[60%] truncate rounded-[8px] border border-[#DEBBA5] bg-[#FBF8F4] px-2.5 py-0.5 text-[11.5px] font-bold text-[#C06B3E]">
                      {activeProject.status === 'OPEN' ? 'Reviewing proposals' : currentMilestone?.title || (milestones.length ? 'All milestones done' : 'Plan milestones')}
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[12.5px] font-medium text-[#7A7065]">
                      <span>Completion</span>
                      <span className="font-bold text-[#C06B3E]">{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Open Project CTA Button */}
            <Link
              to={activeProject ? `/client/projects/${toRouteId(activeProject.id)}` : '/client/create-project'}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#C06B3E] font-manrope text-[13.5px] font-bold text-white no-underline shadow-xs transition-all hover:bg-[#A95A30] active:scale-98"
            >
              <span>{activeProject ? 'Open Project' : 'Post a Project'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right: Project Tracking Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                Project Tracking
              </h2>

              {/* Box 1: status */}
              <div className="mt-4 flex min-h-[76px] items-center justify-between rounded-[18px] border border-[#DEBBA5] bg-[#FAF6F1] px-5 py-4">
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${overdue ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#EFE5DB] text-[#C06B3E]'}`}>
                    {overdue ? <AlertTriangle size={18} /> : <TrendingUp size={18} strokeWidth={2.2} />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-manrope text-[14.5px] font-bold leading-snug ${overdue ? 'text-[#DC2626]' : 'text-[#C06B3E]'}`}>
                      {!activeProject || activeProject.status !== 'ACTIVE' ? 'No active work' : overdue ? 'Overdue' : awaitingReview ? 'Needs your review' : 'On Track'}
                    </span>
                    <span className="mt-0.5 font-manrope text-[12px] text-[#7A7065]">
                      {activeProject?.status === 'ACTIVE'
                        ? `${activeProject.title} · ${milestones.length ? `${doneCount} of ${milestones.length} milestones` : 'no milestones yet'}`
                        : 'Hire a freelancer to start tracking'}
                    </span>
                  </div>
                </div>
                <span className="font-manrope text-[26px] font-extrabold leading-none text-[#C06B3E]">{activeProject?.status === 'ACTIVE' ? `${progress}%` : '—'}</span>
              </div>

              {/* Box 2: ACTIVE PHASE */}
              <div className="mt-3.5 flex min-h-[82px] flex-col justify-center rounded-[18px] border border-[#DEBBA5] bg-[#FAF6F1] px-5 py-3.5">
                <span className="font-manrope text-[10px] font-extrabold uppercase tracking-wider text-[#C06B3E]">⚡ ACTIVE PHASE</span>
                <h4 className="mt-1 font-manrope text-[14.5px] font-bold leading-snug text-[#08182B]">
                  {currentMilestone ? currentMilestone.title : activeProject?.status === 'ACTIVE' ? 'Add a milestone to plan the work' : '—'}
                </h4>
                <p className="mt-1 font-manrope text-[12px] text-[#7A7065]">
                  {currentMilestone
                    ? `${formatINR(currentMilestone.amount)} · ${currentMilestone.funded ? 'funded' : 'not funded yet'}${currentMilestone.dueDate ? ` · due ${formatDate(currentMilestone.dueDate)}` : ''}`
                    : awaitingReview
                    ? `${awaitingReview} submission(s) waiting for your review`
                    : ' '}
                </p>
              </div>

              {/* Weekly Tasks Completed Bar Graph matching screenshot */}
              <div className="mt-5">
                <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
                  PROPOSALS RECEIVED / DAY (THIS WEEK)
                </span>

                {/* Bar visualization */}
                <div className="mt-3.5 flex h-[80px] items-end justify-between gap-2 px-1">
                  {perDay.map((n, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5" title={`${n} proposal${n === 1 ? '' : 's'}`}>
                      <span className="text-[10px] font-bold text-[#8C9BA8]">{n || ''}</span>
                      <div
                        className={`w-full rounded-[4px] ${i > todayIdx ? 'bg-[#E2E8F0]' : 'bg-[#C5A880]'}`}
                        style={{ height: `${Math.max(6, (n / maxPerDay) * 52)}px` }}
                      />
                      <span className={`text-[11px] font-semibold ${i === todayIdx ? 'text-[#C06B3E]' : 'text-[#8C9BA8]'}`}>{DAY_LETTERS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* View Full Tracking Dark Button matching screenshot */}
            <Link
              to={activeProject ? `/client/projects/${toRouteId(activeProject.id)}` : '/client/projects'}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0A1629] font-manrope text-[13.5px] font-bold text-white no-underline shadow-xs transition-all hover:bg-[#122340] active:scale-98"
            >
              <span>View Full Tracking</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* 3. Bottom Row: RECENT BIDS (Left) + UPCOMING DEADLINES (Right) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Recent Bids Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-3.5">
                <span className="font-manrope text-[11px] font-bold tracking-wider text-[#8C9BA8] uppercase">
                  RECENT BIDS
                </span>
                <Link
                  to="/client/projects"
                  className="flex items-center gap-1 text-[12px] font-bold text-[#08182B] no-underline hover:text-[#C06B3E]"
                >
                  <span>All projects</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* List */}
              <div className="mt-4 flex flex-col space-y-3.5">
                {recentBids.length === 0 && (
                  <p className="py-4 text-center text-[12.5px] text-[#8C9BA8]">{loading ? 'Loading…' : 'No proposals yet. They will appear here as freelancers apply.'}</p>
                )}
                {recentBids.slice(0, 4).map((bid) => (
                  <Link
                    key={bid.id}
                    to={`/client/projects/${toRouteId(bid.projectId)}`}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-[#F0ECE6] bg-[#FFFFFF] p-3.5 no-underline transition-all hover:border-[#DEBBA5]"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-manrope text-[13.5px] font-bold text-[#08182B]">{bid.freelancerName || 'Freelancer'}</span>
                      <span className="truncate font-manrope text-[12px] font-semibold text-[#7A7065]">
                        {formatINR(bid.proposedCost)} · {bid.projectTitle}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${BID_STATUS_STYLE[bid.status]}`}>{BID_STATUS_LABEL[bid.status]}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-3.5">
                <span className="font-manrope text-[11px] font-bold tracking-wider text-[#8C9BA8] uppercase">
                  UPCOMING DEADLINES
                </span>
                <Link
                  to="/client/calendar"
                  className="flex items-center gap-1 text-[12px] font-bold text-[#08182B] no-underline hover:text-[#C06B3E]"
                >
                  <span>View all</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* List */}
              <div className="mt-4 flex flex-col space-y-3.5">
                {deadlines.length === 0 && (
                  <p className="py-4 text-center text-[12.5px] text-[#8C9BA8]">{loading ? 'Loading…' : 'No upcoming deadlines.'}</p>
                )}
                {deadlines.map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-[#F0ECE6] bg-[#FFFFFF] p-3.5 no-underline transition-all hover:border-[#DEBBA5]"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-manrope text-[13.5px] font-bold text-[#08182B]">{item.title}</span>
                      <span className="font-manrope text-[12px] text-[#8C9BA8]">{item.date}</span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.overdue ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#FDF3E8] text-[#B4652F]'}`}>
                      {item.daysLeft}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
