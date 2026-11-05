/**
 * Small building blocks shared by the admin pages: loading live data, empty/error states and CSV export.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'

/** Loads `fn` on mount and whenever `deps` change; `reload()` fetches again (e.g. after an action). */
export function useAdminData<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps)

  const reload = useCallback(() => {
    setLoading(true)
    setError('')
    return load()
      .then((d) => setData(d))
      .catch((err) => setError(err?.message || 'Could not load data'))
      .finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, setData, loading, error, reload }
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-[20px] border border-[#E5DACD] bg-white p-10 text-xs font-semibold text-[#8E8376]">
      <Loader2 size={16} className="animate-spin text-[#C06B3E]" />
      {label}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
      <span className="flex items-center gap-2">
        <AlertCircle size={15} className="shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold hover:bg-rose-100"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  )
}

export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#E5DACD] bg-white p-10 text-center">
      <p className="text-sm font-bold text-[#08182B]">{title}</p>
      {hint && <p className="mt-1 text-xs text-[#8E8376]">{hint}</p>}
    </div>
  )
}

/** Downloads rows as a UTF-8 CSV file (opens correctly in Excel). */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const ROLE_LABEL: Record<string, string> = { FREELANCER: 'Freelancer', CLIENT: 'Client', ADMIN: 'Admin' }

export const roleBadge = (role?: string) =>
  role === 'FREELANCER'
    ? 'bg-blue-50 text-blue-700 border border-blue-200'
    : role === 'CLIENT'
    ? 'bg-purple-50 text-purple-700 border border-purple-200'
    : 'bg-amber-50 text-amber-700 border border-amber-200'

/** "₹18.4L" / "₹1.2Cr" style compact rupees for headline numbers. */
export const compactINR = (value?: number | null): string => {
  const n = Number(value ?? 0)
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}
