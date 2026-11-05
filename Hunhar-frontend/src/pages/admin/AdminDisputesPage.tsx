import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Check } from 'lucide-react'
import { adminApi, type Dispute } from '../../services/api'
import { formatDate, formatINR } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner, EmptyBlock, ROLE_LABEL } from './adminUi'

const FILTERS: { label: string; value?: Dispute['status'] }[] = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Dismissed', value: 'DISMISSED' },
  { label: 'All' },
]

const STATUS_STYLE: Record<Dispute['status'], string> = {
  OPEN: 'bg-rose-50 text-rose-700 border border-rose-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  DISMISSED: 'bg-gray-100 text-gray-700 border border-gray-200',
}

const statusLabel = (s: Dispute['status']) => s.charAt(0) + s.slice(1).toLowerCase()

export default function AdminDisputesPage(): React.JSX.Element {
  const [filter, setFilter] = useState<Dispute['status'] | undefined>('OPEN')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  const { data: list, loading, error, reload } = useAdminData(() => adminApi.disputes(filter), [filter])

  // The clicked dispute, or the first one when nothing (or something no longer listed) is selected
  const selected = list?.find((d) => d.id === selectedId) || list?.[0] || null

  const handleResolve = async (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selected) return
    if (resolutionNote.trim().length < 10) {
      setActionError('Write the decision (at least 10 characters) — both parties will see it.')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      await adminApi.resolveDispute(selected.id, status, resolutionNote.trim())
      setNotice(`Dispute on "${selected.projectTitle || 'project'}" was ${status.toLowerCase()}. Both parties were notified.`)
      setResolutionNote('')
      await reload()
    } catch (err: any) {
      setActionError(err.message || 'Could not save the decision')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">Dispute Arbitration & Resolution</h1>
          <p className="text-sm text-[#8E8376]">Review disputes raised by clients and freelancers and record a decision.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === f.value ? 'bg-[#08182B] text-white font-bold' : 'bg-white border border-[#E5DACD] text-[#8E8376] hover:text-[#08182B]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorBanner message={error} onRetry={reload} />
      <ErrorBanner message={actionError} />
      {notice && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Check size={15} /> {notice}
        </div>
      )}

      {loading && !list ? (
        <LoadingBlock label="Loading disputes…" />
      ) : !list?.length ? (
        <EmptyBlock title="No disputes here" hint={filter === 'OPEN' ? 'No open disputes right now.' : undefined} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of cases */}
          <div className="lg:col-span-5 space-y-3">
            {list.map((dsp) => (
              <div
                key={dsp.id}
                onClick={() => setSelectedId(dsp.id)}
                className={`cursor-pointer rounded-[20px] bg-white p-4 border transition-all ${
                  selected?.id === dsp.id ? 'border-[#C06B3E] shadow-sm ring-2 ring-[#C06B3E]/10' : 'border-[#E5DACD] hover:border-[#C06B3E]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#08182B] truncate">{dsp.projectTitle || 'Project'}</h3>
                    <p className="text-xs text-[#8E8376] mt-1 line-clamp-1">{dsp.reason}</p>
                  </div>
                  {dsp.projectBudget != null && <span className="text-sm font-bold text-[#08182B] shrink-0">{formatINR(dsp.projectBudget)}</span>}
                </div>

                <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8E8376]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[dsp.status]}`}>{statusLabel(dsp.status)}</span>
                  <span>Opened {formatDate(dsp.createdAt, true)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Case detail */}
          {selected && (
            <div className="lg:col-span-7 rounded-[24px] bg-white p-6 border border-[#E5DACD] shadow-xs space-y-6">
              <div className="flex items-start justify-between border-b border-[#F0EAE1] pb-4 gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#08182B]">{selected.projectTitle || 'Project'}</h2>
                  <p className="text-xs text-[#8E8376] mt-1">
                    Project budget: <strong className="text-[#08182B]">{formatINR(selected.projectBudget)}</strong> · Opened{' '}
                    {formatDate(selected.createdAt, true)}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${STATUS_STYLE[selected.status]}`}>{statusLabel(selected.status)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD]">
                  <span className="text-[11px] text-[#8E8376] font-medium">Client</span>
                  <p className="text-sm font-bold text-[#08182B]">{selected.clientName || '—'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD]">
                  <span className="text-[11px] text-[#8E8376] font-medium">Freelancer</span>
                  <p className="text-sm font-bold text-[#08182B]">{selected.freelancerName || 'Not hired yet'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD]">
                <p className="text-xs font-bold text-[#08182B] mb-1">
                  Raised by {selected.raisedByName || 'user'}
                  {selected.raisedByRole ? ` (${ROLE_LABEL[selected.raisedByRole] || selected.raisedByRole})` : ''}
                </p>
                <p className="text-xs text-[#524B42] leading-relaxed whitespace-pre-line">"{selected.reason}"</p>
              </div>

              {selected.status === 'OPEN' ? (
                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5DACD] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#08182B]">
                    <Scale size={16} className="text-[#C06B3E]" />
                    Decision
                  </div>
                  <textarea
                    rows={4}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Write the decision and what each party should do next. Both parties are notified with this text."
                    className="w-full rounded-xl border border-[#E5DACD] bg-white p-3 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
                  />
                  <p className="text-[11px] text-[#8E8376]">
                    Money is not moved automatically. To refund the client, take the project down from{' '}
                    <Link to="/admin/projects" className="font-bold text-[#C06B3E] hover:underline">
                      Project Moderation
                    </Link>{' '}
                    (funded milestones go back to the client's wallet).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleResolve('RESOLVED')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {busy ? 'Saving…' : 'Mark Resolved'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleResolve('DISMISSED')}
                      className="rounded-xl border border-[#E5DACD] bg-white px-4 py-2 text-xs font-bold text-[#08182B] hover:bg-[#F8F4EE] transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <p className="text-xs font-bold text-[#08182B]">
                    Decision{selected.resolvedAt ? ` · ${formatDate(selected.resolvedAt, true)}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[#524B42] whitespace-pre-line">{selected.resolutionNotes || '—'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
