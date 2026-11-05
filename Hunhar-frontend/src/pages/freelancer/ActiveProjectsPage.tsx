import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Clock,
  ChevronRight,
  FolderOpen,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'
import { projectsApi, bidsApi, type BidStatus, type Project } from '../../services/api'
import {
  BID_STATUS_LABEL,
  BID_STATUS_STYLE,
  PROJECT_STATUS_LABEL,
  deadlineLabel,
  formatDate,
  formatINR,
  isOverdue,
  splitList,
} from '../../services/format'
import { toRouteId } from '../../services/routeIds'

interface ActiveProjectCard {
  id: string
  category: string
  timeAgo: string
  title: string
  deadline: string
  overdue: boolean
  client: string
  description: string
  budget: string
  tags: string[]
  status: string
  progress: number
  role: string | null
}

interface DeadlineItem {
  id: string
  title: string
  clientCategory: string
  date: string
  overdue: boolean
}

interface RecentBidItem {
  id: string
  title: string
  clientDate: string
  amount: string
  status: BidStatus
}

type Tab = 'ACTIVE' | 'COMPLETED'

const toCard = (p: Project): ActiveProjectCard => ({
  id: p.id,
  category: (p.category || 'General').toUpperCase(),
  timeAgo: p.startDate ? `Started ${formatDate(p.startDate)}` : '',
  title: p.title,
  deadline: deadlineLabel(p),
  overdue: isOverdue(p),
  client: p.clientName || 'Client',
  description: p.description,
  budget: formatINR(p.budget),
  tags: splitList(p.skills).slice(0, 4),
  status: PROJECT_STATUS_LABEL[p.status] || p.status,
  progress: p.progressPercentage ?? 0,
  role: p.myRole === 'COLLABORATOR' ? 'Team member' : null,
})

export default function ActiveProjectsPage(): React.JSX.Element {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([])
  const [bids, setBids] = useState<RecentBidItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [tab, setTab] = useState<Tab>('ACTIVE')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [projectsRes, bidsRes] = await Promise.allSettled([
        projectsApi.getFreelancerProjects(),
        bidsApi.getMyBids(),
      ])

      if (projectsRes.status === 'fulfilled') {
        setAllProjects(projectsRes.value)
        setDeadlines(
          projectsRes.value
            .filter((p) => p.status === 'ACTIVE' && p.deadline)
            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
            .slice(0, 4)
            .map((p) => ({
              id: p.id,
              title: p.title,
              clientCategory: `${p.category} · ${p.clientName || 'Client'}`,
              date: deadlineLabel(p),
              overdue: isOverdue(p),
            }))
        )
      } else {
        setError(projectsRes.reason?.message || 'Could not load your projects')
      }

      if (bidsRes.status === 'fulfilled') {
        setBids(
          bidsRes.value.slice(0, 4).map((b) => ({
            id: b.id,
            title: b.projectTitle || 'Project',
            clientDate: `${b.clientName || 'Client'} · ${formatDate(b.createdAt)}`,
            amount: formatINR(b.proposedCost),
            status: b.status,
          }))
        )
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const activeCount = allProjects.filter((p) => p.status === 'ACTIVE').length
  const completedCount = allProjects.filter((p) => p.status === 'COMPLETED').length
  const activeProjects = allProjects.filter((p) => p.status === tab).map(toCard)

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 sm:p-7 lg:p-8 shadow-xs font-manrope">
      <div className="flex w-full flex-col gap-6">
        {/* 1. TOP TITLE */}
        <div className="flex items-center gap-2.5 pb-2 text-[#08182B]">
          <Briefcase size={22} className="text-[#8E8376]" />
          <h1 className="font-manrope text-[20px] sm:text-[22px] font-bold text-[#08182B]">
            My Projects
          </h1>
        </div>

        <div className="-mt-3 flex gap-2" role="tablist">
          {([
            ['ACTIVE', `In progress (${activeCount})`],
            ['COMPLETED', `Completed (${completedCount})`],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 font-manrope text-[12px] font-bold transition-colors ${
                tab === key ? 'bg-[#08182B] text-white' : 'bg-[#F7F2EC] text-[#5C5248] hover:bg-[#EFE5DB]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>
        )}

        {/* 2. ACTIVE PROJECTS 3-COLUMN CARDS ROW */}
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[20px] border border-[#E7DCCE] bg-[#FBF8F3] p-8 text-center">
            <span className="font-manrope text-[14px] font-semibold text-[#8E8376]">Loading your projects…</span>
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5ECE1] text-[#C06B3E] mb-3">
              <FolderOpen size={24} />
            </div>
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
              {tab === 'ACTIVE' ? 'No projects in progress' : 'No completed projects yet'}
            </h3>
            <p className="mt-1 font-manrope text-[13px] text-[#8E8376] max-w-[420px]">
              {tab === 'ACTIVE'
                ? 'When a client accepts your proposal, the project shows up here with its workspace.'
                : 'Projects move here once the client marks them complete.'}
            </p>
            <Link
              to="/freelancer/browse"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-5 py-2 font-manrope text-[13px] font-bold text-white no-underline shadow-xs transition-all hover:bg-[#AA572D]"
            >
              Browse Open Projects
            </Link>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
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
                      {project.role ? (
                        <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#6D28D9]">{project.role}</span>
                      ) : (
                        <>
                          <Clock size={13} />
                          {project.timeAgo}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Project Image Banner */}
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
                      <span className="block text-[11px] font-medium text-[#B8572A]">Deadline</span>
                      <span className={`font-manrope text-[12px] font-bold ${project.overdue ? 'text-[#D34026]' : 'text-[#863D1A]'}`}>
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

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#8A7F73]">
                      <span>PROGRESS</span>
                      <span className="text-[#08182B]">{project.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#EADDCF]">
                      <div className="h-full rounded-full bg-[#C06B3E] transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
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
                  </div>
                </div>

                {/* Bottom Bid Status & Open Workspace */}
                <div className="mt-4 flex items-center justify-between border-t border-[#F2E8DC] pt-3">
                  <span className="inline-flex items-center gap-1.5 font-manrope text-[12px] font-bold text-[#1F874C]">
                    <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                    {project.status}
                  </span>

                  <Link
                    to={`/freelancer/projects/${toRouteId(project.id)}`}
                    className="flex items-center gap-1 font-manrope text-[12px] font-extrabold text-[#08182B] no-underline transition-colors hover:text-[#C06B3E]"
                  >
                    Open workspace
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 3. BOTTOM ROW: UPCOMING DEADLINES & RECENT BIDS */}
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
                  className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] hover:text-[#C06B3E]"
                >
                  View all <ChevronRight size={15} />
                </Link>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {deadlines.length === 0 ? (
                  <p className="font-manrope text-[12px] text-[#8E8376] py-3 text-center">No active project deadlines.</p>
                ) : (
                  deadlines.map((item) => (
                    <Link
                      key={item.id}
                      to={`/freelancer/projects/${toRouteId(item.id)}`}
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
                            {item.clientCategory}
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
                  className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] hover:text-[#C06B3E]"
                >
                  View all <ChevronRight size={15} />
                </Link>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                {bids.length === 0 ? (
                  <p className="font-manrope text-[12px] text-[#8E8376] py-3 text-center">No bids placed yet.</p>
                ) : (
                  bids.map((bid) => (
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
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${BID_STATUS_STYLE[bid.status]}`}>
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
