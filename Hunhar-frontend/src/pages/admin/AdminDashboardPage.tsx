import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Briefcase, CreditCard, ShieldAlert, ArrowUpRight, TrendingUp, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react'
import mascotBeanbag from '../../assets/mascot_beanbag.png'
import { adminApi, tokenStorage, type MonthlyPoint } from '../../services/api'
import { formatDate, formatINR, initials, timeAgo } from '../../services/format'
import { useAdminData, ErrorBanner, compactINR, ROLE_LABEL } from './adminUi'

interface StatCardProps {
  title: string
  value: string
  subValue: string
  trend: number | null
  icon: React.ElementType
  /** For "open disputes" fewer is better */
  lowerIsBetter?: boolean
}

/** % change of `key` between the last two months of a monthly series, or null when there is no base to compare with. */
const monthTrend = (series: MonthlyPoint[] | undefined, key: string): number | null => {
  if (!series || series.length < 2) return null
  const cur = Number(series[series.length - 1][key] || 0)
  const prev = Number(series[series.length - 2][key] || 0)
  if (!prev) return cur ? 100 : null
  return ((cur - prev) / prev) * 100
}

function StatCard({ title, value, subValue, trend, icon: Icon, lowerIsBetter }: StatCardProps) {
  const good = trend == null ? true : lowerIsBetter ? trend <= 0 : trend >= 0
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[13px] font-medium text-[#8E8376]">{title}</span>
          <h3 className="mt-1 text-2xl font-bold text-[#08182B]">{value}</h3>
          <p className="mt-0.5 text-xs text-[#8E8376]">{subValue}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8F4EE] text-[#C06B3E] border border-[#E5DACD]/60">
          <Icon size={20} />
        </div>
      </div>
      {trend != null && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
              good ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <TrendingUp size={12} className={trend >= 0 ? '' : 'rotate-180'} />
            {trend >= 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
          <span className="text-[#8E8376]">vs last month</span>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage(): React.JSX.Element {
  const adminName = tokenStorage.getUser()?.fullName || 'Admin'
  const { data: analytics, error, reload } = useAdminData(() => adminApi.analytics())
  const { data: kyc } = useAdminData(() => adminApi.kycList('PENDING_REVIEW'))
  const { data: disputes } = useAdminData(() => adminApi.disputes('OPEN'))
  const { data: transactions } = useAdminData(() => adminApi.transactions())

  const u = analytics?.users
  const p = analytics?.projects
  const pay = analytics?.payments
  const n = (v?: number) => (v ?? 0).toLocaleString('en-IN')
  const pendingKyc = u?.pendingKyc ?? kyc?.length ?? 0
  const openDisputes = p?.openDisputes ?? disputes?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#08182B] via-[#0D2440] to-[#1B254B] p-6 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#CBA96B] backdrop-blur-xs mb-3 border border-white/10">
            <ShieldCheck size={14} />
            Hunhar Administration Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {adminName}</h1>
          <p className="mt-1 text-sm text-[#D6DCE5]">
            {analytics ? (
              <>
                There {pendingKyc === 1 ? 'is' : 'are'} <strong className="text-white">{pendingKyc} pending KYC verification{pendingKyc === 1 ? '' : 's'}</strong>,{' '}
                <strong className="text-[#C06B3E]">
                  {openDisputes} open dispute{openDisputes === 1 ? '' : 's'}
                </strong>
                , and <strong className="text-white">{compactINR(pay?.escrowHeld)}</strong> held in escrow.
              </>
            ) : (
              'Loading the live platform pulse…'
            )}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/admin/verifications"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D98F62] to-[#C06B3E] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 transition-all"
            >
              Verify KYC Applications
              <ArrowUpRight size={14} />
            </Link>
            <Link
              to="/admin/disputes"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white border border-white/15 transition-all"
            >
              Review Disputes
            </Link>
          </div>
        </div>

        <div className="absolute -bottom-6 right-6 hidden md:block">
          <img src={mascotBeanbag} alt="" className="h-44 w-auto object-contain opacity-90 filter drop-shadow-lg" />
        </div>
      </div>

      <ErrorBanner message={error} onRetry={reload} />
      {analytics && analytics.unavailable?.length > 0 && (
        <ErrorBanner message={`Some numbers are missing because these services did not respond: ${analytics.unavailable.join(', ')}`} onRetry={reload} />
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={n(u?.totalUsers)}
          subValue={`${n(u?.freelancers)} Freelancers · ${n(u?.clients)} Clients`}
          trend={monthTrend(u?.monthly, 'signups')}
          icon={Users}
        />
        <StatCard
          title="Active Projects"
          value={n(p?.activeProjects)}
          subValue={`${n(p?.openProjects)} open for bids · ${n(p?.completedProjects)} completed`}
          trend={monthTrend(p?.monthly, 'projects')}
          icon={Briefcase}
        />
        <StatCard
          title="Escrow Held"
          value={compactINR(pay?.escrowHeld)}
          subValue={`${compactINR(pay?.commissionEarned)} platform commission earned`}
          trend={monthTrend(pay?.monthly, 'gmv')}
          icon={CreditCard}
        />
        <StatCard
          title="Open Disputes"
          value={n(openDisputes)}
          subValue={`${n(pay?.pendingPayoutsCount)} withdrawals waiting (${compactINR(pay?.pendingPayoutsAmount)})`}
          trend={null}
          icon={ShieldAlert}
          lowerIsBetter
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* KYC Verification Queue */}
        <div className="lg:col-span-2 rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#08182B]">KYC Verification Queue</h2>
              <p className="text-xs text-[#8E8376]">Review ID proofs before freelancers can withdraw</p>
            </div>
            <Link to="/admin/verifications" className="text-xs font-bold text-[#C06B3E] hover:underline flex items-center gap-1">
              View all {kyc?.length ?? ''} <ChevronRight size={14} />
            </Link>
          </div>

          {!kyc ? (
            <p className="py-6 text-center text-xs text-[#8E8376]">Loading…</p>
          ) : !kyc.length ? (
            <p className="py-6 text-center text-xs text-[#8E8376]">No KYC applications are waiting. 🎉</p>
          ) : (
            <div className="divide-y divide-[#F0EAE1]">
              {kyc.slice(0, 4).map((item) => (
                <div key={item.userId} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#F8F4EE] border border-[#E5DACD] flex items-center justify-center font-bold text-xs text-[#C06B3E]">
                      {initials(item.fullName)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#08182B]">{item.fullName}</span>
                      <div className="text-xs text-[#8E8376]">
                        {ROLE_LABEL[item.role] || item.role} • <span className="text-[#08182B] font-medium">Aadhaar {item.aadhaarLast4 ? `•••• ${item.aadhaarLast4}` : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs text-[#8E8376] mr-2">{timeAgo(item.submittedAt)}</span>
                    <Link
                      to="/admin/verifications"
                      className="rounded-lg border border-[#E5DACD] bg-white px-3 py-1.5 text-xs font-semibold text-[#08182B] hover:bg-[#F8F4EE] transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Disputes */}
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500" />
              <h2 className="text-base font-bold text-[#08182B]">Open Disputes</h2>
            </div>
            {!!disputes?.length && (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">Action Required</span>
            )}
          </div>

          {!disputes ? (
            <p className="py-6 text-center text-xs text-[#8E8376]">Loading…</p>
          ) : !disputes.length ? (
            <p className="py-6 text-center text-xs text-[#8E8376]">No open disputes.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {disputes.slice(0, 3).map((dsp) => (
                <div key={dsp.id} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#08182B]">{dsp.projectTitle || 'Project'}</span>
                    <span className="text-xs font-bold text-rose-600 shrink-0">{formatINR(dsp.projectBudget)}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#524B42]">
                    <p>
                      <strong className="text-gray-700">Client:</strong> {dsp.clientName || '—'}
                    </p>
                    <p>
                      <strong className="text-gray-700">Freelancer:</strong> {dsp.freelancerName || '—'}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-rose-100 pt-2 text-[11px]">
                    <span className="text-[#8E8376]">Opened {formatDate(dsp.createdAt)}</span>
                    <Link to="/admin/disputes" className="font-bold text-[#C06B3E] hover:underline">
                      Mediate →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent ledger entries */}
      <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
        <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#08182B]">Latest Money Movements</h2>
            <p className="text-xs text-[#8E8376]">Top-ups, escrow, commission and withdrawals as they happen</p>
          </div>
          <Link to="/admin/transactions" className="text-xs font-bold text-[#C06B3E] hover:underline flex items-center gap-1">
            All Ledger Records <ChevronRight size={14} />
          </Link>
        </div>

        {!transactions ? (
          <p className="py-6 text-center text-xs text-[#8E8376]">Loading…</p>
        ) : !transactions.length ? (
          <p className="py-6 text-center text-xs text-[#8E8376]">No transactions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left font-manrope text-xs">
              <thead>
                <tr className="border-b border-[#F0EAE1] text-[#8E8376]">
                  <th className="py-3 px-3 font-semibold">When</th>
                  <th className="py-3 px-3 font-semibold">User</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-3 font-semibold">Description</th>
                  <th className="py-3 px-3 font-semibold">Amount</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {transactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F9F6F0] transition-colors">
                    <td className="py-3 px-3 text-gray-500">{timeAgo(tx.createdAt)}</td>
                    <td className="py-3 px-3 font-bold text-[#08182B]">{tx.userName || '—'}</td>
                    <td className="py-3 px-3 text-[#524B42]">{tx.type.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="py-3 px-3 text-[#524B42] max-w-xs truncate">{tx.description || '—'}</td>
                    <td className="py-3 px-3 font-bold text-[#08182B]">{formatINR(tx.amount)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
