import React from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  Download,
  Calendar,
} from 'lucide-react'

export default function AdminAnalyticsPage(): React.JSX.Element {
  const topCategories = [
    { name: 'UI/UX & Product Design', volume: '₹ 8.2 Lakhs', share: '38%', count: '142 projects' },
    { name: 'Full-Stack Web (React/Node)', volume: '₹ 5.6 Lakhs', share: '26%', count: '98 projects' },
    { name: 'Mobile App (Flutter/React Native)', volume: '₹ 4.1 Lakhs', share: '19%', count: '64 projects' },
    { name: 'AI & Data Science', volume: '₹ 2.3 Lakhs', share: '11%', count: '28 projects' },
    { name: 'Branding & Video Production', volume: '₹ 1.2 Lakhs', share: '6%', count: '16 projects' },
  ]

  const growthMetrics = [
    { label: 'Weekly Active Freelancers', value: '2,140', change: '+18.4%' },
    { label: 'Avg Project Ticket Size', value: '₹ 32,500', change: '+12.1%' },
    { label: 'Bid-to-Hire Conversion', value: '64.2%', change: '+5.3%' },
    { label: 'Platform Net Margin', value: '10.0%', change: 'Steady' },
  ]

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">
            Platform Analytics & Financial Health
          </h1>
          <p className="text-sm text-[#8E8376]">
            Macro marketplace metrics, category liquidity, client repeat rates, and commission breakdown.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E5DACD] px-4 py-2 text-xs font-bold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors"
        >
          <Download size={14} />
          Export Board Report
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {growthMetrics.map((m) => (
          <div key={m.label} className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
            <span className="text-xs font-semibold text-[#8E8376]">{m.label}</span>
            <h3 className="text-2xl font-bold text-[#08182B] mt-1">{m.value}</h3>
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp size={12} />
              {m.change} this quarter
            </div>
          </div>
        ))}
      </div>

      {/* Category Distribution Chart Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#08182B]">GMV Breakdown by Skill Domain</h2>
              <p className="text-xs text-[#8E8376]">Gross Merchandise Volume transacted on Hunhar</p>
            </div>
            <span className="text-xs font-bold text-[#C06B3E]">Total GMV: ₹ 21.4 Lakhs</span>
          </div>

          <div className="mt-5 space-y-4">
            {topCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#08182B]">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8E8376] font-normal">{cat.count}</span>
                    <span className="text-[#08182B]">{cat.volume}</span>
                    <span className="text-[#C06B3E] font-mono">({cat.share})</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-2 w-full rounded-full bg-[#F0EAE1] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]"
                    style={{ width: cat.share }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Cohort Retention Box */}
        <div className="lg:col-span-4 rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#08182B]">Client Re-hire Rate</h2>
            <p className="text-xs text-[#8E8376] mt-0.5">Clients who post more than 1 project in 90 days</p>

            <div className="my-6 text-center">
              <div className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-[#F8F4EE] border-4 border-[#C06B3E] text-2xl font-black text-[#08182B]">
                73%
              </div>
              <p className="text-xs font-bold text-[#08182B] mt-3">High Repeat Marketplace Sticky Factor</p>
              <p className="text-[11px] text-[#8E8376] max-w-xs mx-auto mt-1">
                Clients who use Hunhar Escrow show a 3.4x higher retention than direct peer-to-peer hiring.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#F8F4EE] p-3 border border-[#E5DACD] text-xs text-[#524B42]">
            <p className="font-bold text-[#08182B]">Automated Commission Alert</p>
            <p className="text-[11px] text-[#8E8376] mt-0.5">Platform commissions are wired to Razorpay Route on T+2 settlement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
