import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Clock, CreditCard, Wallet, Download, Loader2, Plus } from 'lucide-react'
import {
  clientApi,
  invoicesApi,
  paymentsApi,
  projectsApi,
  walletApi,
  workspaceApi,
  type Invoice,
  type Milestone,
  type Project,
} from '../../services/api'
import { payForOrder, PaymentCancelledError } from '../../services/checkout'
import { formatDate, formatINR, initials } from '../../services/format'
import { toRouteId } from '../../services/routeIds'

type PaymentTab = 'Overview' | 'History' | 'Invoices'

const TX_LABEL: Record<string, string> = {
  DEPOSIT: 'Wallet top-up',
  ESCROW_HOLD: 'Milestone funded (escrow)',
  ESCROW_RELEASE: 'Payment released to freelancer',
  REFUND: 'Escrow refund',
  WITHDRAWAL: 'Withdrawal',
  CREDIT_PURCHASE: 'Credits purchase',
}

const OUTGOING = new Set(['ESCROW_HOLD', 'ESCROW_RELEASE', 'WITHDRAWAL', 'CREDIT_PURCHASE'])

interface UpcomingPayment {
  milestone: Milestone
  project: Project
}

export default function ClientPaymentsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PaymentTab>('Overview')
  const [wallet, setWallet] = useState({ availableBalance: 0, escrowBalance: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [amount, setAmount] = useState('1000')
  const [paying, setPaying] = useState(false)
  const [modalError, setModalError] = useState('')

  const load = async () => {
    const [w, t, inv, p] = await Promise.allSettled([walletApi.getMyWallet(), walletApi.getTransactions(), clientApi.invoices(), projectsApi.getClientProjects()])
    if (w.status === 'fulfilled') setWallet({ availableBalance: Number(w.value.availableBalance), escrowBalance: Number(w.value.escrowBalance) })
    else setNotice({ type: 'error', text: w.reason?.message || 'Could not load your wallet' })
    if (t.status === 'fulfilled') setTransactions(t.value)
    if (inv.status === 'fulfilled') setInvoices(inv.value)
    if (p.status === 'fulfilled') {
      setProjects(p.value)
      const active = p.value.filter((x) => x.status === 'ACTIVE').slice(0, 10)
      const workspaces = await Promise.allSettled(active.map((x) => workspaceApi.get(x.id)))
      const list: UpcomingPayment[] = []
      workspaces.forEach((res, i) => {
        if (res.status !== 'fulfilled') return
        res.value.milestones
          .map((m) => m.milestone)
          .filter((m) => m.status !== 'PAID')
          .forEach((m) => list.push({ milestone: m, project: active[i] }))
      })
      list.sort((a, b) => (a.milestone.dueDate || '9999').localeCompare(b.milestone.dueDate || '9999'))
      setUpcoming(list)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const totalSpent = transactions.filter((t) => t.type === 'ESCROW_RELEASE').reduce((s, t) => s + Number(t.amount), 0)
  const activeContracts = projects.filter((p) => p.status === 'ACTIVE').length
  const toFund = upcoming.filter((u) => !u.milestone.funded).reduce((s, u) => s + Number(u.milestone.amount), 0)

  const addFunds = async () => {
    const amt = Number(amount)
    if (!(amt >= 100)) return setModalError('Minimum top-up is ₹100.')
    setPaying(true)
    setModalError('')
    try {
      const order = await paymentsApi.createOrder({ purpose: 'WALLET_TOPUP', amount: amt })
      await payForOrder(order)
      setShowAddFunds(false)
      setNotice({ type: 'success', text: `${formatINR(amt)} added to your wallet.${order.mock ? ' (Test mode: no real money was charged.)' : ''}` })
      await load()
    } catch (err: any) {
      setModalError(err instanceof PaymentCancelledError ? 'Payment cancelled.' : err.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const download = (inv: Invoice) => invoicesApi.download(inv.invoiceNumber).catch((e) => setNotice({ type: 'error', text: e.message }))

  const stat = (label: string, value: string, icon: React.ReactNode) => (
    <div className="flex flex-col justify-between rounded-[18px] border border-[#E5E7EB] bg-white p-5 transition-all hover:border-[#DEBBA5] hover:shadow-2xs">
      <div className="mb-4 flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FAF3EB] text-[#C06B3E]">{icon}</div>
      <div>
        <span className="font-manrope text-[22px] font-extrabold text-[#08182B]">{loading ? '…' : value}</span>
        <p className="mt-1 font-manrope text-[12px] font-medium text-[#7A7065]">{label}</p>
      </div>
    </div>
  )

  return (
    <div className="w-full font-manrope">
      <div className="flex min-h-[820px] w-full flex-col rounded-[24px] border border-[#E9EBEF]/60 bg-white p-5 shadow-xs sm:p-9 lg:p-10">
        <div className="mb-4 flex items-center gap-2 font-manrope text-[14px] font-semibold text-[#64748B]">
          <CreditCard size={17} />
          <span>Payments</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-manrope text-[24px] font-extrabold text-[#08182B] sm:text-[28px]">Payments</h1>
            <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">Your wallet, escrow, payment schedule and invoices</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalError('')
              setAmount(toFund > wallet.availableBalance ? String(Math.ceil(toFund - wallet.availableBalance)) : '1000')
              setShowAddFunds(true)
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-[12px] bg-[#C06B3E] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-xs hover:bg-[#A95A30] sm:self-auto"
          >
            <Plus size={16} /> Add Funds
          </button>
        </div>

        {notice && (
          <div role="status" className={`mt-5 rounded-[12px] border p-3 text-[13px] font-semibold ${notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {notice.text}
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stat('Wallet balance', formatINR(wallet.availableBalance), <Wallet size={16} />)}
          {stat('Held in escrow', formatINR(wallet.escrowBalance), <Clock size={16} />)}
          {stat('Total paid to freelancers', formatINR(totalSpent), <TrendingUp size={16} />)}
          {stat('Active contracts', String(activeContracts), <CreditCard size={16} />)}
        </div>

        {toFund > wallet.availableBalance && !loading && (
          <div className="mt-4 rounded-[12px] border border-[#FCD34D] bg-[#FFFBEB] p-3 text-[12.5px] font-semibold text-[#92400E]">
            Your unfunded milestones total {formatINR(toFund)} but your wallet has {formatINR(wallet.availableBalance)}. Add funds to keep work moving.
          </div>
        )}

        <div className="mt-8 flex items-center gap-9 border-b border-[#F0ECE6]" role="tablist">
          {(['Overview', 'History', 'Invoices'] as PaymentTab[]).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 font-manrope text-[14px] transition-colors ${isActive ? 'font-bold text-[#C06B3E]' : 'font-medium text-[#7A7065] hover:text-[#08182B]'}`}
              >
                <span>{tab}</span>
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#C06B3E]" />}
              </button>
            )
          })}
        </div>

        {activeTab === 'Overview' && (
          <div className="mt-7 rounded-[20px] border border-[#EBE6DF] bg-white p-5 shadow-xs sm:p-7">
            <h3 className="font-manrope text-[15.5px] font-bold text-[#08182B]">Upcoming Payments</h3>
            <div className="mt-5 flex flex-col space-y-3.5">
              {upcoming.length === 0 && (
                <p className="py-6 text-center text-[13px] text-[#8C9BA8]">{loading ? 'Loading…' : 'No unpaid milestones on your active projects.'}</p>
              )}
              {upcoming.map(({ milestone: m, project: p }) => (
                <Link
                  key={m.id}
                  to={`/client/projects/${toRouteId(p.id)}`}
                  className="flex flex-col gap-3 rounded-[16px] bg-[#F8F7F4] p-4 no-underline transition-colors hover:bg-[#F4F1EC] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4338CA] text-[14px] font-bold text-white">{initials(p.freelancerName)}</div>
                    <div className="min-w-0">
                      <h4 className="truncate font-manrope text-[14px] font-bold text-[#08182B]">{m.title} — {p.title}</h4>
                      <p className="mt-0.5 font-manrope text-[11.5px] text-[#7A7065]">
                        {p.freelancerName}
                        {m.dueDate ? ` · Due ${formatDate(m.dueDate, true)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="font-manrope text-[15px] font-bold text-[#08182B]">{formatINR(m.amount)}</span>
                    <span className={`mt-0.5 text-[11.5px] font-semibold ${m.status === 'APPROVED' ? 'text-[#C06B3E]' : m.funded ? 'text-[#0369A1]' : 'text-[#D97706]'}`}>
                      {m.status === 'APPROVED' ? 'Approved — release payment' : m.status === 'SUBMITTED' ? 'Work submitted — review' : m.funded ? 'Funded, in escrow' : 'Needs funding'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="mt-7 flex flex-col space-y-3.5">
            {transactions.length === 0 && <p className="py-6 text-center text-[13px] text-[#8C9BA8]">{loading ? 'Loading…' : 'No transactions yet.'}</p>}
            {transactions.map((t) => {
              const out = OUTGOING.has(t.type)
              return (
                <div key={t.id} className="flex flex-col gap-3 rounded-[16px] border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-[#DEBBA5] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">{TX_LABEL[t.type] || t.type}</h4>
                    <p className="mt-0.5 truncate font-manrope text-[11.5px] text-[#7A7065]">
                      {t.description} · {formatDate(t.createdAt, true)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <span className={`font-manrope text-[15px] font-bold ${out ? 'text-[#08182B]' : 'text-[#16A34A]'}`}>
                      {out ? '-' : '+'}
                      {formatINR(t.amount, { decimals: true })}
                    </span>
                    <span className={`mt-0.5 text-[11.5px] font-semibold ${t.status === 'COMPLETED' ? 'text-[#16A34A]' : t.status === 'FAILED' ? 'text-[#EF4444]' : 'text-[#D97706]'}`}>
                      {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'Invoices' && (
          <div className="mt-7 flex flex-col space-y-3.5">
            {invoices.length === 0 && (
              <p className="py-6 text-center text-[13px] text-[#8C9BA8]">{loading ? 'Loading…' : 'Invoices are created automatically each time you release a milestone payment.'}</p>
            )}
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-col gap-3 rounded-[16px] bg-[#F8F7F4] p-4 transition-colors hover:bg-[#F3EFE9] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">{inv.description}</span>
                    <span className="rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">Paid</span>
                  </div>
                  <span className="mt-0.5 text-[11.5px] text-[#7A7065]">
                    {inv.invoiceNumber} · {formatDate(inv.createdAt, true)} · {formatINR(inv.grossAmount, { decimals: true })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => download(inv)}
                  className="inline-flex items-center gap-1.5 self-start rounded-[12px] bg-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-white shadow-xs transition-all hover:bg-[#AA572D] sm:self-center"
                >
                  <span>Download</span>
                  <Download size={14} strokeWidth={2.3} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Add funds">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-[#111827]">Add Funds</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">Top up your wallet to fund milestones. Pay with UPI, card or net banking.</p>
            {modalError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600">{modalError}</div>}
            <label className="mt-4 block text-[12px] font-bold uppercase text-[#8C9BA8]">
              Amount (₹)
              <input type="number" min={100} max={200000} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[14px] outline-none focus:border-[#C06B3E]" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={paying} onClick={() => setShowAddFunds(false)} className="rounded-[10px] border border-[#CBD5E1] px-4 py-2 text-[13px] font-semibold text-[#64748B]">
                Cancel
              </button>
              <button type="button" disabled={paying} onClick={addFunds} className="flex items-center gap-2 rounded-[10px] bg-[#0A1629] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
                {paying && <Loader2 className="animate-spin" size={14} />}
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
