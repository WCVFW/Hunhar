import React, { useMemo } from 'react'
import { Download } from 'lucide-react'
import { adminApi, type MonthlyPoint } from '../../services/api'
import { formatINR } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner, downloadCsv, compactINR } from './adminUi'

/** Simple bar chart of one series from a monthly breakdown. */
function MonthlyBars({ title, series, valueKey, money }: { title: string; series?: MonthlyPoint[]; valueKey: string; money?: boolean }) {
  const points = series || []
  const max = Math.max(1, ...points.map((p) => Number(p[valueKey] || 0)))
  return (
    <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
      <h3 className="text-sm font-bold text-[#08182B]">{title}</h3>
      <p className="text-[11px] text-[#8E8376]">Last 6 months</p>
      {points.length === 0 ? (
        <p className="py-10 text-center text-xs text-[#8E8376]">No data yet</p>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-2">
          {points.map((p) => {
            const v = Number(p[valueKey] || 0)
            return (
              <div key={String(p.month)} className="flex flex-1 flex-col items-center gap-1 min-w-0">
                <span className="text-[10px] font-bold text-[#08182B] truncate max-w-full">{money ? compactINR(v) : v.toLocaleString('en-IN')}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#C06B3E] to-[#D98F62]" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
                <span className="text-[10px] text-[#8E8376] truncate max-w-full">{String(p.month).split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminAnalyticsPage(): React.JSX.Element {
  const { data: analytics, loading, error, reload } = useAdminData(() => adminApi.analytics())
  const { data: projects } = useAdminData(() => adminApi.projects())

  const derived = useMemo(() => {
    const list = projects || []
    const byCategory = new Map<string, { count: number; volume: number }>()
    const clientProjects = new Map<string, number>()
    let withBids = 0
    let hired = 0
    let budgetSum = 0
    for (const p of list) {
      const c = byCategory.get(p.category || 'Other') || { count: 0, volume: 0 }
      c.count += 1
      c.volume += Number(p.budget || 0)
      byCategory.set(p.category || 'Other', c)
      clientProjects.set(p.clientId, (clientProjects.get(p.clientId) || 0) + 1)
      budgetSum += Number(p.budget || 0)
      if (p.bidCount > 0) withBids += 1
      if (p.awardedFreelancerId) hired += 1
    }
    const totalVolume = [...byCategory.values()].reduce((a, c) => a + c.volume, 0)
    const categories = [...byCategory.entries()]
      .map(([name, c]) => ({ name, ...c, share: totalVolume ? (c.volume / totalVolume) * 100 : 0 }))
      .sort((a, b) => b.volume - a.volume)
    const clients = clientProjects.size
    const repeatClients = [...clientProjects.values()].filter((n) => n > 1).length
    return {
      categories,
      totalVolume,
      avgBudget: list.length ? budgetSum / list.length : 0,
      hireRate: withBids ? (hired / withBids) * 100 : null,
      repeatRate: clients ? (repeatClients / clients) * 100 : null,
      repeatClients,
      clients,
    }
  }, [projects])

  const pay = analytics?.payments
  const commissionRate = pay?.gmv ? (Number(pay.commissionEarned || 0) / Number(pay.gmv)) * 100 : null

  const metrics = [
    { label: 'Active Users', value: (analytics?.users?.activeUsers ?? 0).toLocaleString('en-IN'), note: `${analytics?.users?.newThisMonth ?? 0} new this month` },
    { label: 'Avg Project Budget', value: formatINR(derived.avgBudget), note: `Across ${projects?.length ?? 0} projects` },
    { label: 'Bid-to-Hire Conversion', value: derived.hireRate == null ? '—' : `${derived.hireRate.toFixed(1)}%`, note: 'Projects with bids that hired someone' },
    { label: 'Effective Commission', value: commissionRate == null ? '—' : `${commissionRate.toFixed(1)}%`, note: `${compactINR(pay?.commissionEarned)} on ${compactINR(pay?.gmv)} released` },
  ]

  const exportCsv = () => {
    const months = (analytics?.users?.monthly || []).map((m) => String(m.month))
    const find = (s: MonthlyPoint[] | undefined, month: string, key: string) => s?.find((p) => p.month === month)?.[key] ?? ''
    downloadCsv(
      `hunhar-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Month', 'Sign-ups', 'Projects posted', 'Proposals', 'Released to freelancers (INR)', 'Commission (INR)'],
      months.map((m) => [
        m,
        find(analytics?.users?.monthly, m, 'signups'),
        find(analytics?.projects?.monthly, m, 'projects'),
        find(analytics?.projects?.monthly, m, 'proposals'),
        find(pay?.monthly, m, 'gmv'),
        find(pay?.monthly, m, 'commission'),
      ]),
    )
  }

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">Platform Analytics & Financial Health</h1>
          <p className="text-sm text-[#8E8376]">Marketplace metrics, category volume, repeat clients and commission — all live.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!analytics}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E5DACD] px-4 py-2 text-xs font-bold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          Export Monthly Report
        </button>
      </div>

      <ErrorBanner message={error} onRetry={reload} />

      {loading && !analytics ? (
        <LoadingBlock label="Crunching numbers…" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
                <span className="text-xs font-semibold text-[#8E8376]">{m.label}</span>
                <h3 className="text-2xl font-bold text-[#08182B] mt-1">{m.value}</h3>
                <p className="mt-1 text-[11px] text-[#8E8376]">{m.note}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MonthlyBars title="New Sign-ups" series={analytics?.users?.monthly} valueKey="signups" />
            <MonthlyBars title="Projects Posted" series={analytics?.projects?.monthly} valueKey="projects" />
            <MonthlyBars title="Released to Freelancers" series={pay?.monthly} valueKey="gmv" money />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#08182B]">Project Budget by Category</h2>
                  <p className="text-xs text-[#8E8376]">Sum of client budgets for every project posted</p>
                </div>
                <span className="text-xs font-bold text-[#C06B3E]">Total: {compactINR(derived.totalVolume)}</span>
              </div>

              {!projects ? (
                <p className="py-8 text-center text-xs text-[#8E8376]">Loading…</p>
              ) : !derived.categories.length ? (
                <p className="py-8 text-center text-xs text-[#8E8376]">No projects posted yet.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {derived.categories.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#08182B]">{cat.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#8E8376] font-normal">
                            {cat.count} {cat.count === 1 ? 'project' : 'projects'}
                          </span>
                          <span className="text-[#08182B]">{compactINR(cat.volume)}</span>
                          <span className="text-[#C06B3E] font-mono">({cat.share.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#F0EAE1] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]" style={{ width: `${cat.share}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-[#08182B]">Client Re-hire Rate</h2>
                <p className="text-xs text-[#8E8376] mt-0.5">Clients who posted more than one project</p>
                <div className="my-6 text-center">
                  <div className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-[#F8F4EE] border-4 border-[#C06B3E] text-2xl font-black text-[#08182B]">
                    {derived.repeatRate == null ? '—' : `${derived.repeatRate.toFixed(0)}%`}
                  </div>
                  <p className="text-xs font-bold text-[#08182B] mt-3">
                    {derived.repeatClients} of {derived.clients} clients came back
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-[#F8F4EE] p-3 border border-[#E5DACD] text-xs text-[#524B42]">
                <p className="font-bold text-[#08182B]">Engagement</p>
                <p className="text-[11px] text-[#8E8376] mt-0.5">
                  {(analytics?.engagement?.conversations ?? 0).toLocaleString('en-IN')} conversations ·{' '}
                  {(analytics?.engagement?.messages ?? 0).toLocaleString('en-IN')} messages sent
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
