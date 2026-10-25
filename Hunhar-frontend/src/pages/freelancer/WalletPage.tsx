import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { walletApi, paymentsApi, profileApi } from '../../services/api'
import { payForOrder, PaymentCancelledError } from '../../services/checkout'
import { PLATFORM_FEE_RATE, formatDate, formatINR } from '../../services/format'

const INCOMING = new Set(['DEPOSIT', 'ESCROW_RELEASE', 'REFUND'])

const TX_TITLE: Record<string, string> = {
  DEPOSIT: 'Wallet top-up',
  ESCROW_HOLD: 'Held in escrow',
  ESCROW_RELEASE: 'Milestone payment',
  COMMISSION_DEDUCTION: 'Platform fee',
  WITHDRAWAL: 'Withdrawal',
  CREDIT_PURCHASE: 'Credits purchase',
  REFUND: 'Refund',
}

const PAYOUT_STYLE: Record<string, string> = {
  REQUESTED: 'bg-[#FEF3C7] text-[#B45309]',
  PROCESSING: 'bg-[#E0F2FE] text-[#0369A1]',
  APPROVED: 'bg-[#E0F2FE] text-[#0369A1]',
  COMPLETED: 'bg-[#DCFCE7] text-[#15803D]',
  REJECTED: 'bg-[#FEE2E2] text-[#B91C1C]',
}

export default function WalletPage(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState({ availableBalance: 0, escrowBalance: 0, totalEarned: 0, totalWithdrawn: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [savedPayout, setSavedPayout] = useState<{ method: 'UPI' | 'BANK_TRANSFER'; details: string } | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [depositAmount, setDepositAmount] = useState('500')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI')
  const [accountDetails, setAccountDetails] = useState('')

  const load = async () => {
    const [w, t, p, prof] = await Promise.allSettled([
      walletApi.getMyWallet(),
      walletApi.getTransactions(),
      walletApi.getPayouts(),
      profileApi.getMine(),
    ])
    if (w.status === 'fulfilled') setWallet(w.value)
    else setNotice({ type: 'error', text: w.reason?.message || 'Could not load your wallet' })
    if (t.status === 'fulfilled') setTransactions(t.value)
    if (p.status === 'fulfilled') setPayouts(p.value)
    if (prof.status === 'fulfilled' && prof.value.payout?.method) {
      const po = prof.value.payout
      setSavedPayout(
        po.method === 'UPI'
          ? { method: 'UPI', details: po.upiId || '' }
          : { method: 'BANK_TRANSFER', details: `${po.accountHolder || ''}, ${po.bankName || ''} ${po.accountNumberMasked || ''}, IFSC ${po.ifscCode || ''}` }
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openWithdraw = () => {
    setModalError('')
    setWithdrawAmount(wallet.availableBalance >= 100 ? String(Math.floor(wallet.availableBalance)) : '')
    if (savedPayout) {
      setPayoutMethod(savedPayout.method)
      setAccountDetails(savedPayout.details)
    }
    setShowWithdraw(true)
  }

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount)
    if (!(amt >= 100)) return setModalError('Minimum withdrawal is ₹100.')
    if (amt > wallet.availableBalance) return setModalError('Amount is more than your available balance.')
    if (!accountDetails.trim()) return setModalError(payoutMethod === 'UPI' ? 'Enter your UPI ID.' : 'Enter your bank account details.')
    setBusy(true)
    setModalError('')
    try {
      await walletApi.requestPayout({ amount: amt, payoutMethod, accountDetails: accountDetails.trim() })
      setShowWithdraw(false)
      setNotice({ type: 'success', text: `Withdrawal of ${formatINR(amt)} requested. It usually arrives within 1–2 business days.` })
      await load()
    } catch (err: any) {
      setModalError(err.message || 'Withdrawal failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDeposit = async () => {
    const amt = Number(depositAmount)
    if (!(amt >= 100)) return setModalError('Minimum top-up is ₹100.')
    setBusy(true)
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
      setBusy(false)
    }
  }

  const box = 'flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4'
  const input = 'mt-1 w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[14px] outline-none focus:border-[#C06B3E]'

  return (
    <div className="w-full font-manrope">
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-5 sm:p-8 lg:p-9 shadow-sm">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-manrope text-[20px] font-bold text-[#C06B3E]">Wallet & Earnings</h1>
            <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">Your balance, milestone payments and withdrawals.</p>
          </div>
          {loading && <Loader2 className="animate-spin text-[#8C9BA8]" size={18} />}
        </div>

        {notice && (
          <div
            role="status"
            className={`mb-6 rounded-[12px] border p-3 text-[13px] font-semibold ${
              notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="flex flex-col justify-between rounded-[20px] border border-[#DEBBA5] bg-[#F7F2EC] p-6 sm:p-8">
          <span className="font-manrope text-[11px] font-bold tracking-wider text-[#8C9BA8] uppercase">AVAILABLE BALANCE</span>
          <span className="mt-2 font-manrope text-[34px] font-extrabold leading-none text-[#C06B3E] sm:text-[44px]">
            {formatINR(wallet.availableBalance, { decimals: true })}
          </span>
          <p className="mt-2 font-manrope text-[13px] font-semibold text-[#1A202C]">
            {savedPayout ? 'Payout details saved' : (
              <>Add payout details in <Link to="/freelancer/settings" className="text-[#C06B3E]">Settings</Link> for faster withdrawals</>
            )}
          </p>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={openWithdraw}
              disabled={wallet.availableBalance < 100}
              title={wallet.availableBalance < 100 ? 'Minimum withdrawal is ₹100' : undefined}
              className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white shadow-xs transition-all hover:bg-[#A95A30] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Withdraw Funds
            </button>
            <button
              type="button"
              onClick={() => {
                setModalError('')
                setShowAddFunds(true)
              }}
              className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#0A1629] font-manrope text-[14px] font-bold text-white shadow-xs transition-all hover:bg-[#122340]"
            >
              Add Funds
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
          <div className={box}>
            <span className="text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">TOTAL EARNED</span>
            <span className="mt-3 text-[20px] font-bold leading-none text-[#C06B3E] sm:text-[24px]">{formatINR(wallet.totalEarned)}</span>
          </div>
          <div className={box}>
            <span className="text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">IN ESCROW</span>
            <span className="mt-3 text-[20px] font-bold leading-none text-[#C06B3E] sm:text-[24px]">{formatINR(wallet.escrowBalance)}</span>
          </div>
          <div className={box}>
            <span className="text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">WITHDRAWN</span>
            <span className="mt-3 text-[20px] font-bold leading-none text-[#C06B3E] sm:text-[24px]">{formatINR(wallet.totalWithdrawn)}</span>
          </div>
          <div className={box}>
            <span className="text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">PLATFORM FEE</span>
            <span className="mt-3 text-[20px] font-bold leading-none text-[#C06B3E] sm:text-[24px]">{Math.round(PLATFORM_FEE_RATE * 100)}%</span>
          </div>
        </div>

        {payouts.length > 0 && (
          <div className="mt-8 rounded-[20px] border border-[#F0ECE6] p-5 sm:p-7">
            <h2 className="text-[15px] font-bold text-[#111827]">Withdrawal Requests</h2>
            <div className="mt-4 flex flex-col">
              {payouts.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between gap-3 py-3 ${i ? 'border-t border-[#F3EFE9]' : ''}`}>
                  <div>
                    <span className="text-[14px] font-bold text-[#111827]">{formatINR(p.amount)}</span>
                    <span className="block text-[12px] text-[#A0AEC0]">
                      {p.payoutMethod === 'UPI' ? 'UPI' : 'Bank transfer'} · {formatDate(p.createdAt, true)}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PAYOUT_STYLE[p.status] || ''}`}>
                    {p.status === 'REQUESTED' ? 'Pending' : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF] p-5 sm:p-7">
          <h2 className="font-manrope text-[15px] font-bold text-[#111827]">Transaction History</h2>
          <div className="mt-4 flex flex-col">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#A0AEC0]">
                {loading ? 'Loading…' : 'No transactions yet. Milestone payments from clients will appear here.'}
              </div>
            ) : (
              transactions.map((tx, index) => {
                const incoming = INCOMING.has(tx.type)
                return (
                  <div key={tx.id} className={`flex items-center justify-between gap-3 py-3.5 ${index ? 'border-t border-[#F3EFE9]' : ''}`}>
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${incoming ? 'bg-[#EBF7EE] text-[#16A34A]' : 'bg-[#FEECEC] text-[#EF4444]'}`}>
                        {incoming ? <ArrowDownLeft size={17} strokeWidth={2.3} /> : <ArrowUpRight size={17} strokeWidth={2.3} />}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[14px] font-bold text-[#111827]">{TX_TITLE[tx.type] || tx.type}</span>
                        <span className="mt-0.5 truncate text-[12px] text-[#A0AEC0]">
                          {tx.description}
                          {tx.status === 'PENDING' ? ' · Pending' : tx.status === 'FAILED' ? ' · Failed' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className={`text-[14.5px] font-bold ${incoming ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                        {incoming ? '+' : '-'}
                        {formatINR(tx.amount, { decimals: true })}
                      </span>
                      <span className="mt-0.5 text-[11.5px] text-[#A0AEC0]">{formatDate(tx.createdAt, true)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Withdraw funds">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-[#111827]">Withdraw Funds</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">
              Available: <strong className="text-[#C06B3E]">{formatINR(wallet.availableBalance, { decimals: true })}</strong>
            </p>
            {modalError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600">{modalError}</div>}
            <div className="mt-4 space-y-3">
              <label className="block text-[12px] font-bold text-[#8C9BA8] uppercase">
                Amount (₹)
                <input type="number" min={100} max={wallet.availableBalance} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className={input} />
              </label>
              <label className="block text-[12px] font-bold text-[#8C9BA8] uppercase">
                Payout Method
                <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as 'UPI' | 'BANK_TRANSFER')} className={input}>
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </label>
              <label className="block text-[12px] font-bold text-[#8C9BA8] uppercase">
                {payoutMethod === 'UPI' ? 'UPI ID' : 'Account holder, account no. & IFSC'}
                <input
                  type="text"
                  placeholder={payoutMethod === 'UPI' ? 'name@okhdfcbank' : 'Name, A/C 1234567890, IFSC HDFC0001234'}
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  className={input}
                />
              </label>
              <p className="text-[11px] text-[#94A3B8]">Details are stored encrypted. Withdrawals are reviewed and sent within 1–2 business days.</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setShowWithdraw(false)} className="rounded-[10px] border border-[#CBD5E1] px-4 py-2 text-[13px] font-semibold text-[#64748B]">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={handleWithdraw} className="flex items-center gap-2 rounded-[10px] bg-[#C06B3E] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#A95A30] disabled:opacity-60">
                {busy && <Loader2 className="animate-spin" size={14} />}
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Add funds">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-[#111827]">Add Funds</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">Pay securely with UPI, card or net banking via Razorpay.</p>
            {modalError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600">{modalError}</div>}
            <label className="mt-4 block text-[12px] font-bold text-[#8C9BA8] uppercase">
              Amount (₹)
              <input type="number" min={100} max={200000} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className={input} />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setShowAddFunds(false)} className="rounded-[10px] border border-[#CBD5E1] px-4 py-2 text-[13px] font-semibold text-[#64748B]">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={handleDeposit} className="flex items-center gap-2 rounded-[10px] bg-[#0A1629] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#122340] disabled:opacity-60">
                {busy && <Loader2 className="animate-spin" size={14} />}
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
