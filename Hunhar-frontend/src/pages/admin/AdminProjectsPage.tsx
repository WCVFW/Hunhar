import React, { useEffect, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { adminApi, type Project, type ProjectStatus } from '../../services/api'
import { formatDate, formatINR, PROJECT_STATUS_LABEL } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner, EmptyBlock, downloadCsv } from './adminUi'

const FILTERS: { label: string; value?: ProjectStatus }[] = [
  { label: 'All' },
  { label: 'Open for Bids', value: 'OPEN' },
  { label: 'In Progress', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Draft', value: 'DRAFT' },
]

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ACTIVE: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border border-gray-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-200',
  DRAFT: 'bg-amber-50 text-amber-700 border border-amber-200',
}

export default function AdminProjectsPage(): React.JSX.Element {
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | undefined>()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const { data: projects, setData: setProjects, loading, error, reload } = useAdminData(
    () => adminApi.projects({ status: filterStatus, search: search || undefined }),
    [filterStatus, search],
  )

  const takeDown = async (prj: Project) => {
    const reason = window.prompt(`Take down "${prj.title}"? It will be cancelled, any funded milestones are refunded to the client's wallet, and both parties are notified.\n\nReason:`)
    if (reason === null) return
    if (reason.trim().length < 5) {
      setActionError('Please give a short reason (at least 5 characters).')
      return
    }
    setBusyId(prj.id)
    setActionError('')
    try {
      const updated = await adminApi.cancelProject(prj.id, reason.trim())
      setProjects((prev) => (prev || []).map((p) => (p.id === prj.id ? { ...p, ...updated } : p)))
    } catch (err: any) {
      setActionError(err.message || 'Could not cancel the project')
    } finally {
      setBusyId(null)
    }
  }

  const exportCsv = () =>
    downloadCsv(
      `hunhar-projects-${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Title', 'Category', 'Client', 'Freelancer', 'Budget (INR)', 'Status', 'Bids', 'Posted'],
      (projects || []).map((p) => [p.id, p.title, p.category, p.clientName, p.freelancerName, p.budget, p.status, p.bidCount, p.createdAt]),
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">Project Moderation & Listings</h1>
          <p className="text-sm text-[#8E8376]">Inspect published jobs and take down scam or policy-violating listings.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!projects?.length}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5DACD] bg-white px-3.5 py-2 text-xs font-semibold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === f.value ? 'bg-[#08182B] text-white font-bold' : 'bg-[#F8F4EE] text-[#8E8376] hover:text-[#08182B]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-[#E5DACD] bg-white pl-9 pr-4 py-1.5 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
          />
        </div>
      </div>

      <ErrorBanner message={error} onRetry={reload} />
      <ErrorBanner message={actionError} />

      {loading && !projects ? (
        <LoadingBlock label="Loading projects…" />
      ) : !projects?.length ? (
        <EmptyBlock title="No projects found" hint={search ? 'Try a different search.' : undefined} />
      ) : (
        <div className="space-y-3">
          {projects.map((prj) => (
            <div key={prj.id} className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs hover:border-[#C06B3E]/40 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold">
                      {prj.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-[#8E8376] font-medium">Category: {prj.category}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[prj.status] || ''}`}>
                      {PROJECT_STATUS_LABEL[prj.status] || prj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#08182B]">{prj.title}</h3>

                  <p className="text-xs text-[#524B42]">
                    Posted by <strong className="text-[#08182B]">{prj.clientName || 'Unknown client'}</strong>
                    {prj.freelancerName && (
                      <>
                        {' '}· Hired <strong className="text-[#08182B]">{prj.freelancerName}</strong>
                      </>
                    )}{' '}
                    · {prj.bidCount} {prj.bidCount === 1 ? 'proposal' : 'proposals'} · Posted {formatDate(prj.createdAt, true)}
                  </p>
                  <p className="text-xs text-[#8E8376] line-clamp-2">{prj.description}</p>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#F0EAE1]">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] text-[#8E8376]">Client Budget</span>
                    <p className="text-lg font-bold text-[#08182B]">{formatINR(prj.budget)}</p>
                  </div>

                  {(prj.status === 'OPEN' || prj.status === 'ACTIVE' || prj.status === 'DRAFT') && (
                    <button
                      type="button"
                      disabled={busyId === prj.id}
                      onClick={() => takeDown(prj)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      {busyId === prj.id ? 'Cancelling…' : 'Take Down'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
