import React, { useState } from 'react'
import {
  Search,
  AlertTriangle,
} from 'lucide-react'


interface AdminProject {
  id: string
  title: string
  clientName: string
  budget: string
  category: string
  status: 'Open for Bids' | 'In Progress' | 'Flagged Spam' | 'Completed' | 'Pending Review'
  bidsCount: number
  postedDate: string
  flagReason?: string
}

const mockProjects: AdminProject[] = [
  {
    id: 'PRJ-501',
    title: 'Fintech Mobile Banking App iOS & Android',
    clientName: 'Nexus Finance',
    budget: '₹ 1,50,000',
    category: 'Mobile Dev',
    status: 'In Progress',
    bidsCount: 18,
    postedDate: '2 days ago',
  },
  {
    id: 'PRJ-502',
    title: 'Telegram Pump & Dump Crypto Bot Promotion',
    clientName: 'Anonymous User',
    budget: '₹ 80,000',
    category: 'Marketing',
    status: 'Flagged Spam',
    bidsCount: 2,
    postedDate: '4 hours ago',
    flagReason: 'Violates platform TOS - Prohibited investment scheme',
  },
  {
    id: 'PRJ-503',
    title: 'Full Brand Identity & 3D WebGL Landing Page',
    clientName: 'SaaSify Studio',
    budget: '₹ 65,000',
    category: 'UI/UX Design',
    status: 'Open for Bids',
    bidsCount: 11,
    postedDate: '1 day ago',
  },
  {
    id: 'PRJ-504',
    title: 'Need 1000 Fake Google Reviews for Restaurant',
    clientName: 'FastBite Hotel',
    budget: '₹ 12,000',
    category: 'SEO & Marketing',
    status: 'Pending Review',
    bidsCount: 0,
    postedDate: '30 mins ago',
    flagReason: 'Keyword flagged: "Fake Google Reviews"',
  },
  {
    id: 'PRJ-505',
    title: 'Shopify Custom Liquid Theme Development',
    clientName: 'Aura Lifestyle',
    budget: '₹ 45,000',
    category: 'E-Commerce',
    status: 'Completed',
    bidsCount: 7,
    postedDate: '2 weeks ago',
  },
]

export default function AdminProjectsPage(): React.JSX.Element {
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const [projectList, setProjectList] = useState<AdminProject[]>(mockProjects)
  const [searchQuery, setSearchQuery] = useState('')

  const handleAction = (id: string, newStatus: AdminProject['status']) => {
    setProjectList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    )
  }

  const filteredProjects = projectList.filter((p) => {
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">
            Project Moderation & Listings
          </h1>
          <p className="text-sm text-[#8E8376]">
            Inspect published jobs, approve pending briefs, and ban scam or policy-violating listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
            2 Jobs Flagged for Review
          </span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {['All', 'Pending Review', 'Flagged Spam', 'Open for Bids', 'In Progress'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === status
                  ? 'bg-[#08182B] text-white font-bold'
                  : 'bg-[#F8F4EE] text-[#8E8376] hover:text-[#08182B]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-[#E5DACD] bg-white pl-9 pr-4 py-1.5 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
          />
        </div>
      </div>

      {/* Projects List Card Stack */}
      <div className="space-y-3">
        {filteredProjects.map((prj) => (
          <div
            key={prj.id}
            className={`rounded-[20px] bg-white p-5 border transition-all ${
              prj.status === 'Flagged Spam'
                ? 'border-rose-300 bg-rose-50/20'
                : prj.status === 'Pending Review'
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-[#E5DACD] shadow-xs hover:border-[#C06B3E]/40'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">
                    {prj.id}
                  </span>
                  <span className="text-xs text-[#8E8376] font-medium">Category: {prj.category}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      prj.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : prj.status === 'Open for Bids'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : prj.status === 'Flagged Spam'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : prj.status === 'Pending Review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {prj.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#08182B]">{prj.title}</h3>

                <p className="text-xs text-[#524B42]">
                  Posted by <strong className="text-[#08182B]">{prj.clientName}</strong> · {prj.bidsCount} proposals received · Posted {prj.postedDate}
                </p>

                {prj.flagReason && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Trigger: {prj.flagReason}</span>
                  </div>
                )}
              </div>

              {/* Right Side: Budget and Actions */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#F0EAE1]">
                <div className="text-left lg:text-right">
                  <span className="text-[11px] text-[#8E8376]">Client Budget</span>
                  <p className="text-lg font-bold text-[#08182B]">{prj.budget}</p>
                </div>

                <div className="flex items-center gap-2">
                  {prj.status === 'Pending Review' || prj.status === 'Flagged Spam' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(prj.id, 'Open for Bids')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      >
                        Approve Listing
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(prj.id, 'Flagged Spam')}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                      >
                        Take Down
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAction(prj.id, 'Flagged Spam')}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Flag for Spam
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
