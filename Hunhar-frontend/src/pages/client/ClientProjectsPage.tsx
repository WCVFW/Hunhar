import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Clock,
  ChevronRight,
  FolderKanban,
} from 'lucide-react'

type ProjectTab = 'All' | 'Open' | 'Action' | 'Completed' | 'Cancelled'

interface ClientProject {
  id: string
  title: string
  status: 'Active' | 'Open for Bids' | 'Completed' | 'Cancelled'
  category: string
  bidsCount: string
  price: string
  date: string
  progress?: number
}

const allProjectsList: ClientProject[] = [
  {
    id: '1',
    title: 'Brand Identity',
    status: 'Active',
    category: 'Branding',
    bidsCount: '3 bids',
    price: '₹ 1,200',
    date: 'Aug 28, 2026',
    progress: 65,
  },
  {
    id: '2',
    title: 'Website Redesign',
    status: 'Open for Bids',
    category: 'Web Design',
    bidsCount: '7 bids',
    price: '₹ 3,500',
    date: 'Sep 15, 2026',
  },
  {
    id: '3',
    title: 'Social Media Campaign',
    status: 'Completed',
    category: 'Marketing',
    bidsCount: 'No bids',
    price: '₹ 800',
    date: 'Aug 10, 2026',
  },
  {
    id: '4',
    title: 'Product Photography',
    status: 'Cancelled',
    category: 'Photography',
    bidsCount: '2 bids',
    price: '₹ 600',
    date: 'Jul 30, 2026',
  },
  {
    id: '5',
    title: 'Mobile App UI',
    status: 'Open for Bids',
    category: 'UI/UX',
    bidsCount: '4 bids',
    price: '₹ 5,000',
    date: 'Oct 1, 2026',
  },
]


export default function ClientProjectsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ProjectTab>('All')

  // Filter projects by active tab matching screenshots
  const filteredProjects = allProjectsList.filter((project) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Open') return project.status === 'Open for Bids'
    if (activeTab === 'Action') return project.status === 'Active'
    if (activeTab === 'Completed') return project.status === 'Completed'
    if (activeTab === 'Cancelled') return project.status === 'Cancelled'
    return true
  })

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching exact user screenshot */}
      <div className="w-full min-h-[820px] rounded-[24px] bg-white p-6 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* 1. Back to Dashboard navigation link */}
        <div className="mb-6">
          <Link
            to="/client/dashboard"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#64748B] transition-colors hover:text-[#08182B]"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* 2. Page Header Row: Title & Subtitle (Left) + New Project Button (Right) */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#08182B]">
              Projects
            </h1>
            <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">
              Manage all your posted projects
            </p>
          </div>

          <Link
            to="/client/create-project"
            className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#C06B3E] px-5 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Project</span>
          </Link>
        </div>

        {/* 3. Horizontal Tab Navigation Bar matching exact screenshot */}
        <div className="mt-7 flex items-center gap-8 sm:gap-11 border-b border-[#F0ECE6] pb-0">
          {(['All', 'Open', 'Action', 'Completed', 'Cancelled'] as ProjectTab[]).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 font-manrope text-[14px] transition-colors cursor-pointer ${
                  isActive
                    ? 'font-bold text-[#C06B3E]'
                    : 'font-medium text-[#7A7065] hover:text-[#08182B]'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#C06B3E]" />
                )}
              </button>
            )
          })}
        </div>

        {/* 4. Projects Cards List */}
        <div className="mt-7 flex flex-col space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#E2E8F0] p-12 text-center">
              <p className="text-[14px] text-[#8C9BA8]">No projects found in this tab.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col rounded-[16px] border border-[#E5E7EB] bg-white p-5 sm:p-6 transition-all duration-200 hover:border-[#DEBBA5] hover:shadow-xs"
              >
                {/* Top Row: Title + Status Badge & Price + Date + Chevron */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left details */}
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-manrope text-[15.5px] font-bold text-[#08182B]">
                        {project.title}
                      </h3>

                      {/* Status Badges matching exact screenshots */}
                      {project.status === 'Active' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#16A34A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                          Active
                        </span>
                      )}

                      {project.status === 'Open for Bids' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#16A34A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                          Open for Bids
                        </span>
                      )}

                      {project.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#64748B]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]" />
                          Completed
                        </span>
                      )}

                      {project.status === 'Cancelled' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF2F2] px-2.5 py-0.5 font-manrope text-[11.5px] font-semibold text-[#EF4444]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* Subtitle: Category · bids count */}
                    <p className="mt-1 font-manrope text-[12.5px] text-[#8C9BA8]">
                      {project.category} · {project.bidsCount}
                    </p>
                  </div>

                  {/* Right: Price & Date with Clock & Right Chevron */}
                  <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-center">
                    <div className="flex flex-col sm:items-end">
                      <span className="font-manrope text-[16.5px] font-bold text-[#08182B]">
                        {project.price}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1 font-manrope text-[11.5px] text-[#8C9BA8]">
                        <Clock size={12} />
                        <span>{project.date}</span>
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C06B3E]" />
                  </div>
                </div>

                {/* Progress Bar (Only for Active projects like Brand Identity) */}
                {project.progress !== undefined && (
                  <div className="mt-4 pt-3.5 border-t border-[#F8F6F2]">
                    <div className="flex items-center justify-between text-[11.5px] font-bold text-[#8C9BA8]">
                      <span>Progress</span>
                      <span className="text-[#C06B3E]">{project.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
