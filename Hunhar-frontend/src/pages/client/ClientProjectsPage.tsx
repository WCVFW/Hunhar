import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Clock, ChevronRight, Search } from 'lucide-react'
import { projectsApi, type Project, type ProjectStatus } from '../../services/api'
import { deadlineLabel, formatDate, formatINR } from '../../services/format'
import { toRouteId } from '../../services/routeIds'

type ProjectTab = 'All' | 'Drafts' | 'Open' | 'Active' | 'Completed' | 'Cancelled'

const TAB_STATUS: Record<Exclude<ProjectTab, 'All'>, ProjectStatus> = {
  Drafts: 'DRAFT',
  Open: 'OPEN',
  Active: 'ACTIVE',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
}

const STATUS_BADGE: Record<ProjectStatus, { label: string; cls: string; dot: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-[#FEF3C7] text-[#B45309]', dot: 'bg-[#D97706]' },
  OPEN: { label: 'Open for Bids', cls: 'bg-[#EBF7EE] text-[#16A34A]', dot: 'bg-[#16A34A]' },
  ACTIVE: { label: 'In progress', cls: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  COMPLETED: { label: 'Completed', cls: 'bg-[#F1F5F9] text-[#64748B]', dot: 'bg-[#94A3B8]' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-[#FEF2F2] text-[#EF4444]', dot: 'bg-[#EF4444]' },
}

export default function ClientProjectsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ProjectTab>('All')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') || '')
  useEffect(() => setSearch(searchParams.get('q') || ''), [searchParams])

  useEffect(() => {
    projectsApi
      .getClientProjects()
      .then(setProjects)
      .catch((err) => setError(err.message || 'Could not load your projects'))
      .finally(() => setLoading(false))
  }, [])

  const count = (tab: ProjectTab) => (tab === 'All' ? projects.length : projects.filter((p) => p.status === TAB_STATUS[tab]).length)

  const filtered = projects.filter((p) => {
    if (activeTab !== 'All' && p.status !== TAB_STATUS[activeTab]) return false
    const q = search.trim().toLowerCase()
    return !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  return (
    <div className="w-full font-manrope">
      <div className="flex min-h-[820px] w-full flex-col rounded-[24px] border border-[#E9EBEF]/60 bg-white p-5 shadow-xs sm:p-9 lg:p-10">
        <div className="mb-6">
          <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#64748B] no-underline transition-colors hover:text-[#08182B]">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] font-extrabold text-[#08182B] sm:text-[28px]">Projects</h1>
            <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">Manage all your posted projects</p>
          </div>
          <Link
            to="/client/create-project"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-[12px] bg-[#C06B3E] px-5 py-2.5 font-manrope text-[13.5px] font-bold text-white no-underline shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Project</span>
          </Link>
        </div>

        <div className="mt-7 flex items-center gap-6 overflow-x-auto border-b border-[#F0ECE6] sm:gap-9" role="tablist">
          {(['All', 'Drafts', 'Open', 'Active', 'Completed', 'Cancelled'] as ProjectTab[]).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap pb-3 font-manrope text-[14px] transition-colors ${
                  isActive ? 'font-bold text-[#C06B3E]' : 'font-medium text-[#7A7065] hover:text-[#08182B]'
                }`}
              >
                <span>
                  {tab} <span className="text-[12px] font-semibold text-[#A0AEC0]">({count(tab)})</span>
                </span>
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#C06B3E]" />}
              </button>
            )
          })}
        </div>

        <div className="relative mt-5 w-full max-w-[360px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your projects..."
            aria-label="Search projects"
            className="h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#C06B3E]"
          />
        </div>

        {error && <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>}

        <div className="mt-5 flex flex-col space-y-4">
          {loading ? (
            <div className="rounded-[18px] border border-dashed border-[#E2E8F0] p-12 text-center text-[14px] text-[#8C9BA8]">Loading projects…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#E2E8F0] p-12 text-center">
              <p className="text-[14px] text-[#8C9BA8]">
                {projects.length === 0 ? "You haven't posted a project yet." : 'No projects in this tab.'}
              </p>
              {projects.length === 0 && (
                <Link to="/client/create-project" className="mt-3 rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white no-underline">
                  Post your first project
                </Link>
              )}
            </div>
          ) : (
            filtered.map((project) => {
              const badge = STATUS_BADGE[project.status]
              return (
                <Link
                  key={project.id}
                  to={`/client/projects/${toRouteId(project.id)}`}
                  className="group relative flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white p-5 no-underline transition-all duration-200 hover:border-[#DEBBA5] hover:shadow-xs sm:p-6"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-manrope text-[15.5px] font-bold text-[#08182B]">{project.title}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${badge.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1 font-manrope text-[12.5px] text-[#8C9BA8]">
                        {project.category} · {project.bidCount ? `${project.bidCount} proposal${project.bidCount === 1 ? '' : 's'}` : 'No proposals yet'}
                        {project.freelancerName ? ` · Hired: ${project.freelancerName}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-start sm:gap-6 sm:self-center">
                      <div className="flex flex-col sm:items-end">
                        <span className="font-manrope text-[16.5px] font-bold text-[#08182B]">{formatINR(project.budget)}</span>
                        <div className="mt-0.5 flex items-center gap-1 font-manrope text-[11.5px] text-[#8C9BA8]">
                          <Clock size={12} />
                          <span>{project.status === 'ACTIVE' ? deadlineLabel(project) : `Posted ${formatDate(project.createdAt, true)}`}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C06B3E]" />
                    </div>
                  </div>

                  {(project.status === 'ACTIVE' || project.status === 'COMPLETED') && (
                    <div className="mt-4 border-t border-[#F8F6F2] pt-3.5">
                      <div className="flex items-center justify-between text-[11.5px] font-bold text-[#8C9BA8]">
                        <span>Progress</span>
                        <span className="text-[#C06B3E]">{project.progressPercentage}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]" style={{ width: `${project.progressPercentage}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
