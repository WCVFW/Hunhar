import React, { useMemo, useState } from 'react'
import { Search, Download, Check, X } from 'lucide-react'
import { adminApi, type AdminPayout } from '../../services/api'
import { formatDate, formatINR, formatTime } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner, EmptyBlock, downloadCsv, compactINR, ROLE_LABEL } from './adminUi'

const TYPE_FILTERS: { label: string; value?: string }[] = [
  { label: 'All' },
  { label: 'Wallet Top-ups', value: 'DEPOSIT' },
  { label: 'Escrow Held', value: 'ESCROW_HOLD' },
  { label: 'Escrow Released', value: 'ESCROW_RELEASE' },
  { label: 'Commission', value: 'COMMISSION_DEDUCTION' },
  { label: 'Freelancer Earnings', value: 'MILESTONE_EARNING' },
  { label: 'Withdrawals', value: 'WITHDRAWAL' },
  { label: 'Credit Purchases', value: 'CREDIT_PURCHASE' },
  { label: 'Refunds', value: 'REFUND' },
]

const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPE_FILTERS.filter((f) => f.value).map((f) => [f.value!, f.label]))

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
  REFUNDED: 'bg-gray-100 text-gray-700 border border-gray-200',
  REQUESTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border border-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
}

export default function AdminTransactionsPage(): React.JSX.Element {
  const [tab, setTab] = useState<'ledger' | 'payouts'>('ledger')
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const { data: analytics } = useAdminData(() => adminApi.analytics())
  const payments = analytics?.payments
  const { data: txList, loading, error, reload } = useAdminData(() => adminApi.transactions(typeFilter), [typeFilter])
  const payoutsQuery = useAdminData(() => adminApi.payouts(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return txList || []
    return (txList || []).filter((t) =>
      [t.id, t.userName, t.description, t.gatewayRefId, t.projectId].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [txList, search])

  const processPayout = async (p: AdminPayout, approve: boolean) => {
    const notes = window.prompt(
      approve
        ? `Approve ${formatINR(p.amount)} to ${p.freelancerName || 'freelancer'}?\nPay it to: ${p.accountDetails}\n\nTransfer reference (UTR) or note:`
        : `Reject this ${formatINR(p.amount)} withdrawal? The amount goes back to the freelancer's wallet.\n\nReason:`,
    )
    if (notes === null) return
    if (!notes.trim()) {
      setActionError(approve ? 'Add the transfer reference so the freelancer can trace the payment.' : 'Please give a reason.')
      return
    }
    setBusyId(p.id)
    setActionError('')
    try {
      await adminApi.processPayout(p.id, approve, notes.trim())
      await payoutsQuery.reload()
    } catch (err: any) {
      setActionError(err.message || 'Could not process the payout')
    } finally {
      setBusyId(null)
    }
  }

  const exportCsv = () =>
    downloadCsv(
      `hunhar-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Transaction ID', 'Date', 'User', 'Role', 'Type', 'Status', 'Amount (INR)', 'Description', 'Project ID', 'Gateway Ref'],
      filtered.map((t) => [t.id, t.createdAt, t.userName, t.userRole, TYPE_LABEL[t.type] || t.type, t.status, t.amount, t.description, t.projectId, t.gatewayRefId]),
    )

  const pendingPayouts = (payoutsQuery.data || []).filter((p) => p.status === 'REQUESTED' || p.status === 'PROCESSING')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">Escrow & Financial Ledger</h1>
          <p className="text-sm text-[#8E8376]">Every wallet top-up, escrow movement, platform commission and withdrawal.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!filtered.length}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5DACD] bg-white px-3.5 py-2 text-xs font-semibold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          Download Ledger (CSV)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Held In Escrow Now</span>
          <h3 className="text-2xl font-bold text-[#08182B] mt-1">{compactINR(payments?.escrowHeld)}</h3>
          <p className="text-[11px] text-[#8E8376] mt-0.5">Funded milestones not yet released</p>
        </div>
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Platform Commission Earned</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{compactINR(payments?.commissionEarned)}</h3>
          <p className="text-[11px] text-[#8E8376] mt-0.5">From {compactINR(payments?.gmv)} released to freelancers</p>
        </div>
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Wallet Top-ups & Credits</span>
          <h3 className="text-2xl font-bold text-[#08182B] mt-1">{compactINR(Number(payments?.walletTopups || 0) + Number(payments?.creditSales || 0))}</h3>
          <p className="text-[11px] text-[#8E8376] mt-0.5">
            {compactINR(payments?.walletTopups)} top-ups · {compactINR(payments?.creditSales)} credits
          </p>
        </div>
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Pending Withdrawals</span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{compactINR(payments?.pendingPayoutsAmount)}</h3>
          <p className="text-[11px] text-[#8E8376] mt-0.5">{payments?.pendingPayoutsCount ?? 0} requests waiting</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-[#E5DACD] w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('ledger')}
          className={`px-4 py-1.5 rounded-lg ${tab === 'ledger' ? 'bg-[#08182B] text-white font-bold' : 'text-[#8E8376] hover:text-[#08182B]'}`}
        >
          Ledger
        </button>
        <button
          type="button"
          onClick={() => setTab('payouts')}
          className={`px-4 py-1.5 rounded-lg ${tab === 'payouts' ? 'bg-[#08182B] text-white font-bold' : 'text-[#8E8376] hover:text-[#08182B]'}`}
        >
          Withdrawal Requests{pendingPayouts.length ? ` (${pendingPayouts.length})` : ''}
        </button>
      </div>

      <ErrorBanner message={actionError} />

      {tab === 'ledger' ? (
        <>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    typeFilter === f.value ? 'bg-[#08182B] text-white font-bold' : 'bg-[#F8F4EE] text-[#8E8376] hover:text-[#08182B]'
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, description or reference..."
                className="w-full rounded-xl border border-[#E5DACD] bg-white pl-9 pr-4 py-1.5 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
              />
            </div>
          </div>

          <ErrorBanner message={error} onRetry={reload} />

          {loading && !txList ? (
            <LoadingBlock label="Loading transactions…" />
          ) : !filtered.length ? (
            <EmptyBlock title="No transactions yet" hint="Payments, escrow and withdrawals will be listed here as they happen." />
          ) : (
            <div className="rounded-[20px] bg-white border border-[#E5DACD] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-manrope text-xs">
                  <thead>
                    <tr className="border-b border-[#F0EAE1] bg-[#FAFAF8] text-[#8E8376]">
                      <th className="py-3 px-4 font-semibold">Txn ID & Date</th>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Description</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE1]">
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F9F6F0] transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#08182B]">{tx.id.slice(0, 8).toUpperCase()}</span>
                          <p className="text-[11px] text-[#8E8376]">
                            {formatDate(tx.createdAt, true)} · {formatTime(tx.createdAt)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#08182B]">{tx.userName || '—'}</p>
                          <p className="text-[11px] text-[#8E8376]">{tx.userRole ? ROLE_LABEL[tx.userRole] || tx.userRole : ''}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#524B42]">{TYPE_LABEL[tx.type] || tx.type}</td>
                        <td className="py-3.5 px-4 text-[#524B42] max-w-xs">
                          <p className="line-clamp-2">{tx.description || '—'}</p>
                          {tx.gatewayRefId && <p className="text-[10px] font-mono text-[#8E8376]">{tx.gatewayRefId}</p>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08182B] text-sm">{formatINR(tx.amount, { decimals: true })}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[tx.status] || ''}`}>
                            {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <ErrorBanner message={payoutsQuery.error} onRetry={payoutsQuery.reload} />
          {payoutsQuery.loading && !payoutsQuery.data ? (
            <LoadingBlock label="Loading withdrawal requests…" />
          ) : !payoutsQuery.data?.length ? (
            <EmptyBlock title="No withdrawal requests" hint="When freelancers withdraw wallet earnings, the requests appear here." />
          ) : (
            <div className="rounded-[20px] bg-white border border-[#E5DACD] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-manrope text-xs">
                  <thead>
                    <tr className="border-b border-[#F0EAE1] bg-[#FAFAF8] text-[#8E8376]">
                      <th className="py-3 px-4 font-semibold">Requested</th>
                      <th className="py-3 px-4 font-semibold">Freelancer</th>
                      <th className="py-3 px-4 font-semibold">Pay To</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE1]">
                    {payoutsQuery.data.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F9F6F0] transition-colors">
                        <td className="py-3.5 px-4 text-[#524B42]">
                          {formatDate(p.createdAt, true)}
                          <p className="text-[11px] text-[#8E8376]">{formatTime(p.createdAt)}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08182B]">{p.freelancerName || '—'}</td>
                        <td className="py-3.5 px-4 text-[#524B42]">
                          <p className="font-semibold">{p.payoutMethod === 'UPI' ? 'UPI' : 'Bank transfer'}</p>
                          <p className="text-[11px] font-mono text-[#8E8376] break-all">{p.accountDetails}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08182B] text-sm">{formatINR(p.amount, { decimals: true })}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[p.status] || ''}`}>
                            {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                          </span>
                          {p.adminNotes && <p className="mt-1 text-[10px] text-[#8E8376] max-w-[180px]">{p.adminNotes}</p>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status === 'REQUESTED' || p.status === 'PROCESSING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => processPayout(p, true)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <Check size={12} /> Mark Paid
                              </button>
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => processPayout(p, false)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8E8376] italic">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
