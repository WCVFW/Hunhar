import React, { useState } from 'react'
import { ShieldCheck, FileCheck, Check, X, ExternalLink, User, Building2 } from 'lucide-react'
import { adminApi, fileUrl, type KycApplication } from '../../services/api'
import { formatDate, timeAgo } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner, EmptyBlock, ROLE_LABEL, roleBadge } from './adminUi'

type KycStatus = KycApplication['kycStatus']

const STATUS_LABEL: Record<KycStatus, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING_REVIEW: 'Pending',
  VERIFIED: 'Approved',
  REJECTED: 'Rejected',
}

const STATUS_STYLE: Record<KycStatus, string> = {
  NOT_SUBMITTED: 'bg-gray-100 text-gray-700 border border-gray-200',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
}

const FILTERS: { label: string; value?: KycStatus }[] = [
  { label: 'Pending', value: 'PENDING_REVIEW' },
  { label: 'Approved', value: 'VERIFIED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All' },
]

const isImage = (url?: string) => !!url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)

export default function AdminVerificationsPage(): React.JSX.Element {
  const [filter, setFilter] = useState<KycStatus | undefined>('PENDING_REVIEW')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  const { data: list, loading, error, reload } = useAdminData(() => adminApi.kycList(filter), [filter])

  // The clicked application, or the first one when nothing (or something no longer listed) is selected
  const selected = list?.find((k) => k.userId === selectedId) || list?.[0] || null

  const handleDecision = async (approved: boolean) => {
    if (!selected) return
    let reason: string | undefined
    if (!approved) {
      const r = window.prompt('Why is this KYC rejected? The freelancer will see this reason.')
      if (r === null) return
      if (r.trim().length < 5) {
        setActionError('Please give a short reason (at least 5 characters).')
        return
      }
      reason = r.trim()
    }
    setBusy(true)
    setActionError('')
    try {
      await adminApi.reviewKyc(selected.userId, approved, reason)
      setNotice(`${selected.fullName}'s KYC was ${approved ? 'approved' : 'rejected'}.`)
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
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">KYC & Identity Verification Queue</h1>
          <p className="text-sm text-[#8E8376]">Check the Aadhaar details freelancers submitted before they can withdraw earnings.</p>
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
        <LoadingBlock label="Loading KYC applications…" />
      ) : !list?.length ? (
        <EmptyBlock title="No applications here" hint={filter === 'PENDING_REVIEW' ? 'All caught up — nothing is waiting for review.' : undefined} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
              <span className="text-xs font-bold text-[#08182B] px-1">Applications ({list.length})</span>
            </div>

            {list.map((item) => (
              <div
                key={item.userId}
                onClick={() => setSelectedId(item.userId)}
                className={`cursor-pointer rounded-[20px] bg-white p-4 border transition-all ${
                  selected?.userId === item.userId ? 'border-[#C06B3E] shadow-sm ring-2 ring-[#C06B3E]/10' : 'border-[#E5DACD] hover:border-[#C06B3E]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#08182B] truncate">{item.fullName}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${roleBadge(item.role)}`}>{ROLE_LABEL[item.role] || item.role}</span>
                    </div>
                    <p className="text-xs text-[#8E8376] mt-0.5 truncate">{item.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[item.kycStatus]}`}>
                    {STATUS_LABEL[item.kycStatus]}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8E8376]">
                  <span>Aadhaar {item.aadhaarLast4 ? `•••• ${item.aadhaarLast4}` : ''}</span>
                  <span>{item.submittedAt ? timeAgo(item.submittedAt) : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Inspector Panel */}
          {selected && (
            <div className="lg:col-span-7 rounded-[24px] bg-white p-6 border border-[#E5DACD] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {selected.avatarUrl ? (
                      <img src={fileUrl(selected.avatarUrl)} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD] flex items-center justify-center text-[#C06B3E]">
                        {selected.role === 'CLIENT' ? <Building2 size={24} /> : <User size={24} />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-[#08182B] truncate">{selected.fullName}</h2>
                      <p className="text-xs text-[#8E8376] truncate">
                        {selected.email}
                        {selected.mobile ? ` · ${selected.mobile}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-[#8E8376]">Current State</span>
                    <p className="text-sm font-bold text-[#C06B3E]">{STATUS_LABEL[selected.kycStatus]}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                      <span className="text-[11px] text-[#8E8376] font-medium">Document Submitted</span>
                      <p className="text-sm font-bold text-[#08182B] mt-0.5">Aadhaar Card</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                      <span className="text-[11px] text-[#8E8376] font-medium">Aadhaar Number</span>
                      <p className="text-sm font-bold text-[#08182B] font-mono mt-0.5">
                        {selected.aadhaarLast4 ? `•••• •••• ${selected.aadhaarLast4}` : '—'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                      <span className="text-[11px] text-[#8E8376] font-medium">Submitted</span>
                      <p className="text-sm font-bold text-[#08182B] mt-0.5">{formatDate(selected.submittedAt, true) || '—'}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                      <span className="text-[11px] text-[#8E8376] font-medium">Member Since</span>
                      <p className="text-sm font-bold text-[#08182B] mt-0.5">{formatDate(selected.memberSince, true) || '—'}</p>
                    </div>
                  </div>

                  {selected.rejectionReason && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                      <strong>Rejection reason:</strong> {selected.rejectionReason}
                    </div>
                  )}

                  {/* Uploaded document */}
                  {selected.documentUrl ? (
                    <div className="rounded-2xl border border-[#E5DACD] p-3 bg-[#FAFAF8]">
                      {isImage(selected.documentUrl) ? (
                        <img src={fileUrl(selected.documentUrl)} alt="Aadhaar document" className="mx-auto max-h-80 rounded-xl object-contain" />
                      ) : (
                        <div className="p-6 text-center">
                          <FileCheck size={40} className="mx-auto text-[#C06B3E]/60 mb-2" />
                          <p className="text-sm font-bold text-[#08182B]">Document uploaded</p>
                        </div>
                      )}
                      <a
                        href={fileUrl(selected.documentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-[#C06B3E] hover:underline"
                      >
                        Open full document <ExternalLink size={13} />
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-[#E5DACD] p-8 text-center bg-[#FAFAF8]">
                      <ShieldCheck size={36} className="mx-auto text-[#C06B3E]/60 mb-2" />
                      <p className="text-xs text-[#8E8376]">No document file was attached.</p>
                    </div>
                  )}
                </div>
              </div>

              {selected.kycStatus === 'PENDING_REVIEW' && (
                <div className="mt-6 pt-4 border-t border-[#F0EAE1] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                  >
                    <X size={15} />
                    Reject Document
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check size={15} />
                    {busy ? 'Saving…' : 'Approve & Verify'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
