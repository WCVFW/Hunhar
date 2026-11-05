import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, AlertCircle, Loader2, Wallet, CreditCard, X } from 'lucide-react'
import { creditsApi, paymentsApi, walletApi } from '../../services/api'
import { payForOrder, PaymentCancelledError } from '../../services/checkout'
import { formatDate, formatINR } from '../../services/format'
import { usePlatformSettings } from '../../services/usePlatformSettings'

interface CreditPackage {
  id: string
  name: string
  credits: number
  priceInInr: number
}

interface LedgerEntry {
  id: string
  delta: number
  reason: string
  balanceAfter?: number
  createdAt: string
}

export default function CreditsPage(): React.JSX.Element {
  const { creditsPerBid } = usePlatformSettings()
  const CREDITS_PER_BID = Math.max(creditsPerBid, 1)
  const [balance, setBalance] = useState<number | null>(null)
  const [totals, setTotals] = useState({ purchased: 0, consumed: 0 })
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [history, setHistory] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [gateway, setGateway] = useState<{ provider: 'RAZORPAY' | 'SIMULATOR'; live: boolean } | null>(null)
  const [checkoutPkg, setCheckoutPkg] = useState<CreditPackage | null>(null)
  const [method, setMethod] = useState<'wallet' | 'razorpay'>('razorpay')

  const load = async () => {
    walletApi
      .getMyWallet()
      .then((wl) => setWalletBalance(Number(wl.availableBalance)))
      .catch(() => setWalletBalance(null))
    paymentsApi.gatewayInfo().then(setGateway).catch(() => {})
    const [w, p, h] = await Promise.allSettled([creditsApi.getMyCredits(), creditsApi.getPackages(), creditsApi.getHistory()])
    if (w.status === 'fulfilled') {
      setBalance(w.value.balance)
      setTotals({ purchased: w.value.totalPurchased, consumed: w.value.totalConsumed })
    }
    if (p.status === 'fulfilled') setPackages(p.value)
    if (h.status === 'fulfilled') setHistory(h.value)
    const failed = [w, p, h].find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
    if (failed) setNotice({ type: 'error', message: failed.reason?.message || 'Could not load credits' })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  // Best value = most credits per rupee
  const bestValueId = packages.reduce<CreditPackage | null>(
    (best, p) => (!best || p.credits / p.priceInInr > best.credits / best.priceInInr ? p : best),
    null
  )?.id

  const openCheckout = (pkg: CreditPackage) => {
    setNotice(null)
    // Default to the wallet when it can cover the price, otherwise UPI / card
    setMethod(walletBalance != null && walletBalance >= pkg.priceInInr ? 'wallet' : 'razorpay')
    setCheckoutPkg(pkg)
  }

  const buy = async (pkg: CreditPackage) => {
    setBuyingId(pkg.id)
    setNotice(null)
    try {
      if (method === 'wallet') {
        const res = await creditsApi.buyWithWallet(pkg.id)
        setCheckoutPkg(null)
        setNotice({
          type: 'success',
          message: `${pkg.credits} credits added. ${formatINR(pkg.priceInInr)} was paid from your wallet (balance ${formatINR(res.walletBalance, { decimals: true })}).`,
        })
      } else {
        const order = await paymentsApi.createOrder({ purpose: 'CREDIT_PACKAGE', packageId: pkg.id })
        setCheckoutPkg(null)
        await payForOrder(order)
        setNotice({
          type: 'success',
          message: `Payment successful — ${pkg.credits} credits added.${order.mock ? ' (Test mode: no real money was charged.)' : ''}`,
        })
      }
      window.dispatchEvent(new Event('hunhar:balances-changed'))
      await load()
    } catch (err: any) {
      if (err instanceof PaymentCancelledError) {
        setNotice({ type: 'error', message: 'Payment cancelled. No credits were added.' })
      } else {
        setNotice({ type: 'error', message: err.message || 'Payment failed. Please try again.' })
      }
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="w-full font-manrope">
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-5 sm:p-8 lg:p-9 shadow-sm">
        <div className="mb-8">
          <h1 className="font-manrope text-[20px] font-bold text-[#C06B3E]">Credits</h1>
          <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">
            Credits are used to send proposals. Buy more any time — they never expire.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className={`mb-6 flex items-center gap-2.5 rounded-[12px] p-3.5 text-[13px] font-medium ${
              notice.type === 'success' ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{notice.message}</span>
          </div>
        )}

        {/* Balance */}
        <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF] p-6 sm:flex-row sm:items-center sm:p-7 shadow-xs">
          <div className="flex flex-col">
            <span className="font-manrope text-[11px] font-bold tracking-wider text-[#A0AEC0] uppercase">CURRENT BALANCE</span>
            <span className="mt-1 font-manrope text-[34px] font-extrabold tracking-tight text-[#08182B] sm:text-[38px]">
              {loading || balance === null ? '…' : `${balance} Credits`}
            </span>
            <div className="mt-2 flex items-center gap-1.5 font-manrope text-[12.5px] text-[#C06B3E]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                Enough for {balance === null ? '–' : Math.floor(balance / CREDITS_PER_BID)} proposal{balance !== null && Math.floor(balance / CREDITS_PER_BID) === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="font-manrope text-[12px] text-[#A0AEC0]">Each proposal costs</span>
            <span className="mt-0.5 font-manrope text-[20px] font-bold text-[#C06B3E]">{CREDITS_PER_BID} credits</span>
            <span className="mt-1 font-manrope text-[12px] text-[#A0AEC0]">
              Bought {totals.purchased} · Used {totals.consumed}
            </span>
          </div>
        </div>

        {/* Packages */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && packages.length === 0 && (
            <div className="col-span-full flex items-center justify-center p-8 text-[13px] text-[#8C9BA8]">Loading packages…</div>
          )}
          {packages.map((pkg) => {
            const best = pkg.id === bestValueId && packages.length > 1
            const perCredit = pkg.priceInInr / pkg.credits
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col justify-between rounded-[20px] bg-[#FFFFFF] p-6 transition-all ${
                  best ? 'border-[1.5px] border-[#0A1629] shadow-sm' : 'border border-[#F0ECE6]'
                }`}
              >
                {best && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#0A1629] px-3.5 py-1 font-manrope text-[10.5px] font-bold tracking-wider text-white uppercase">
                      Best value
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-manrope text-[15px] font-bold text-[#08182B]">{pkg.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="font-manrope text-[28px] font-extrabold text-[#08182B]">{formatINR(pkg.priceInInr)}</span>
                    <span className="ml-1 font-manrope text-[13px] font-medium text-[#8C9BA8]">one-time</span>
                  </div>
                  <p className="mt-1 font-manrope text-[12px] text-[#A0AEC0]">
                    {pkg.credits} credits · {formatINR(perCredit, { decimals: true })}/credit
                  </p>
                  <div className="mt-5 flex flex-col space-y-2.5">
                    {[
                      `${Math.floor(pkg.credits / CREDITS_PER_BID)} proposals`,
                      'Credits never expire',
                      'Secure payment via Razorpay',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#22C55E]/40 text-[#22C55E]">
                          <Check size={11} strokeWidth={2.5} />
                        </div>
                        <span className="font-manrope text-[12.5px] text-[#4A5568]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={buyingId !== null}
                  onClick={() => openCheckout(pkg)}
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 font-manrope text-[12.5px] font-semibold shadow-xs transition-all disabled:opacity-50 ${
                    best ? 'bg-[#C06B3E] text-white hover:bg-[#A95A30]' : 'bg-[#0A1629] text-white hover:bg-[#152640]'
                  }`}
                >
                  {buyingId === pkg.id && <Loader2 size={14} className="animate-spin" />}
                  {buyingId === pkg.id ? 'Processing…' : `Buy for ${formatINR(pkg.priceInInr)}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Ledger */}
        <div className="mt-8 rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF] p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">Credit Activity</h4>
            <Link to="/freelancer/browse" className="text-[12.5px] font-bold text-[#C06B3E] no-underline hover:underline">
              Find projects
            </Link>
          </div>
          {history.length === 0 ? (
            <p className="font-manrope text-[13px] text-[#A0AEC0]">{loading ? 'Loading…' : 'No credit activity yet.'}</p>
          ) : (
            <div className="flex flex-col">
              {history.map((item, index) => (
                <div key={item.id} className={`flex items-center justify-between gap-3 py-3.5 ${index !== 0 ? 'border-t border-[#F3EFE9]' : ''}`}>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-manrope text-[14px] font-bold text-[#1A202C]">{item.reason}</span>
                    <span className="mt-0.5 font-manrope text-[12px] text-[#A0AEC0]">{formatDate(item.createdAt, true)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 sm:gap-12">
                    <span className={`font-manrope text-[15px] font-bold ${item.delta >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {item.delta >= 0 ? `+${item.delta}` : item.delta}
                    </span>
                    {item.balanceAfter != null && (
                      <span className="min-w-[60px] text-right font-manrope text-[12.5px] text-[#A0AEC0]">{item.balanceAfter} left</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {checkoutPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="pay-title" className="text-[17px] font-bold text-[#08182B]">
                  Buy {checkoutPkg.credits} credits
                </h3>
                <p className="mt-0.5 text-[13px] text-[#64748B]">
                  {checkoutPkg.name} · {formatINR(checkoutPkg.priceInInr)}
                </p>
              </div>
              <button type="button" onClick={() => setCheckoutPkg(null)} disabled={buyingId !== null} aria-label="Close" className="rounded-full p-1 text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X size={18} />
              </button>
            </div>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0]">Pay with</p>
            <div className="mt-2 flex flex-col gap-2.5">
              {(() => {
                const enough = walletBalance != null && walletBalance >= checkoutPkg.priceInInr
                return (
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border-2 p-3.5 transition-colors ${method === 'wallet' ? 'border-[#C06B3E] bg-[#FFF7ED]' : 'border-[#E2E8F0]'} ${enough ? '' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <input type="radio" name="pay-method" className="accent-[#C06B3E]" checked={method === 'wallet'} disabled={!enough} onChange={() => setMethod('wallet')} />
                    <Wallet size={18} className="text-[#C06B3E]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-[#08182B]">Wallet balance</p>
                      <p className="text-[12px] text-[#64748B]">
                        {walletBalance == null ? 'Loading…' : `${formatINR(walletBalance, { decimals: true })} available`}
                        {walletBalance != null && !enough && (
                          <>
                            {' · '}
                            <Link to="/freelancer/wallet" className="font-bold text-[#C06B3E] no-underline hover:underline">
                              Add money
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                  </label>
                )
              })()}
              <label className={`flex cursor-pointer items-center gap-3 rounded-[14px] border-2 p-3.5 transition-colors ${method === 'razorpay' ? 'border-[#C06B3E] bg-[#FFF7ED]' : 'border-[#E2E8F0]'}`}>
                <input type="radio" name="pay-method" className="accent-[#C06B3E]" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
                <CreditCard size={18} className="text-[#2563EB]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[#08182B]">UPI, card or net banking</p>
                  <p className="text-[12px] text-[#64748B]">Secure checkout by Razorpay</p>
                </div>
              </label>
            </div>

            {method === 'razorpay' && gateway?.provider === 'SIMULATOR' && (
              <p className="mt-3 rounded-[10px] border border-amber-200 bg-amber-50 p-2.5 text-[12px] font-semibold text-amber-800">
                Test mode: Razorpay keys are not set on the server yet, so this payment will be simulated after you confirm.
              </p>
            )}

            <button
              type="button"
              disabled={buyingId !== null}
              onClick={() => buy(checkoutPkg)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#C06B3E] py-3 text-[13.5px] font-bold text-white shadow-xs hover:bg-[#A95A30] disabled:opacity-60"
            >
              {buyingId !== null && <Loader2 size={15} className="animate-spin" />}
              {method === 'wallet' ? `Pay ${formatINR(checkoutPkg.priceInInr)} from wallet` : `Pay ${formatINR(checkoutPkg.priceInInr)} with Razorpay`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
