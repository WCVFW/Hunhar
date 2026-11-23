import React, { useEffect, useState } from 'react'
import { Search, Download, AlertTriangle, X } from 'lucide-react'
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
  const [takeDownTarget, setTakeDownTarget] = useState<Project | null>(null)
  const [takeDownReason, setTakeDownReason] = useState('')
  const [takeDownError, setTakeDownError] = useState('')
  const [submittingTakeDown, setSubmittingTakeDown] = useState(false)

  // Close modal on Escape
  useEffect(() => {
    if (!takeDownTarget) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submittingTakeDown) {
        setTakeDownTarget(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [takeDownTarget, submittingTakeDown])

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const { data: projects, setData: setProjects, loading, error, reload } = useAdminData(
    () => adminApi.projects({ status: filterStatus, search: search || undefined }),
    [filterStatus, search],
  )

  const handleOpenTakeDown = (prj: Project) => {
    setTakeDownTarget(prj)
    setTakeDownReason('')
    setTakeDownError('')
  }

  const handleConfirmTakeDown = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!takeDownTarget) return

    const reason = takeDownReason.trim()
    if (reason.length < 5) {
      setTakeDownError('Please give a short reason (at least 5 characters).')
      return
    }

    setSubmittingTakeDown(true)
    setTakeDownError('')
    setActionError('')
    setBusyId(takeDownTarget.id)

    try {
      const updated = await adminApi.cancelProject(takeDownTarget.id, reason)
      setProjects((prev) => (prev || []).map((p) => (p.id === takeDownTarget.id ? { ...p, ...updated } : p)))
      setTakeDownTarget(null)
      setTakeDownReason('')
    } catch (err: any) {
      setTakeDownError(err.message || 'Could not cancel the project')
    } finally {
      setSubmittingTakeDown(false)
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
                      onClick={() => handleOpenTakeDown(prj)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* Custom Take Down Modal */}
      {takeDownTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Take Down Project"
          onClick={() => {
            if (!submittingTakeDown) setTakeDownTarget(null)
          }}
        >
          <div
            className="w-full max-w-[480px] rounded-[22px] bg-white p-6 shadow-2xl border border-[#E5DACD] font-manrope animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#08182B]">Take Down Project</h3>
                  <p className="text-xs text-[#8E8376]">Cancel listing & refund client</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTakeDownTarget(null)}
                disabled={submittingTakeDown}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#8E8376] hover:bg-slate-100 hover:text-[#08182B] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Project Summary Card */}
            <div className="mt-4 rounded-xl bg-[#F8F4EE] p-3.5 border border-[#E5DACD]/60 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] bg-white text-gray-700 px-2 py-0.5 rounded border border-[#E5DACD]/60 font-semibold">
                  {takeDownTarget.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-[#08182B]">{formatINR(takeDownTarget.budget)}</span>
              </div>
              <h4 className="text-sm font-bold text-[#08182B] line-clamp-1">{takeDownTarget.title}</h4>
              <p className="text-[11px] text-[#524B42]">
                Posted by <strong className="text-[#08182B]">{takeDownTarget.clientName || 'Unknown client'}</strong> · Category: {takeDownTarget.category}
              </p>
            </div>

            {/* Warning Details */}
            <div className="mt-3 rounded-xl bg-rose-50/70 p-3 border border-rose-200/60">
              <p className="text-[12px] text-rose-800 leading-relaxed font-medium">
                This project will be cancelled immediately. Any funded milestones will be refunded to the client's wallet, and both parties will be notified.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmTakeDown} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#08182B] mb-1.5">
                  Reason for Take Down *
                </label>
                <textarea
                  rows={3}
                  value={takeDownReason}
                  onChange={(e) => {
                    setTakeDownReason(e.target.value)
                    if (takeDownError) setTakeDownError('')
                  }}
                  placeholder="e.g. Inappropriate content, fraudulent listing, violation of platform terms..."
                  className="w-full rounded-xl border border-[#CBD5E1] bg-white p-3 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-manrope resize-none"
                  autoFocus
                />
                {takeDownError ? (
                  <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                    {takeDownError}
                  </span>
                ) : (
                  <span className="text-[10.5px] text-[#8E8376] mt-1 block">
                    At least 5 characters. This reason will be recorded and sent in the cancellation notification.
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0EAE1]">
                <button
                  type="button"
                  onClick={() => setTakeDownTarget(null)}
                  disabled={submittingTakeDown}
                  className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#524B42] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTakeDown}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  <AlertTriangle size={13} />
                  <span>{submittingTakeDown ? 'Cancelling…' : 'Take Down Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
