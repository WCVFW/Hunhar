import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  CreditCard,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import mascotBeanbag from '../../assets/mascot_beanbag.png'

interface StatCardProps {
  title: string
  value: string
  subValue: string
  trend: string
  isPositive: boolean
  icon: React.ElementType
}

function StatCard({ title, value, subValue, trend, isPositive, icon: Icon }: StatCardProps) {
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
      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
        <span
          className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} />
          {trend}
        </span>
        <span className="text-[#8E8376]">vs last 30 days</span>
      </div>
    </div>
  )
}

export default function AdminDashboardPage(): React.JSX.Element {
  const pendingApprovals = [
    {
      id: 'KYC-8921',
      user: 'Praveen Kumar',
      role: 'Freelancer (UI/UX)',
      docType: 'Aadhaar + Portfolio',
      status: 'Pending',
      time: '12m ago',
    },
    {
      id: 'KYC-8920',
      user: 'Zaid Al-Mansoor',
      role: 'Client (Startup)',
      docType: 'GSTIN & Trade License',
      status: 'Pending',
      time: '45m ago',
    },
    {
      id: 'KYC-8918',
      user: 'Ananya Sharma',
      role: 'Freelancer (Fullstack)',
      docType: 'PAN Card & Bank Cheque',
      status: 'Under Review',
      time: '2h ago',
    },
  ]

  const recentDisputes = [
    {
      id: 'DSP-104',
      project: 'E-commerce React Migration',
      raisedBy: 'TechNova Labs (Client)',
      against: 'Rohan Mehra (Dev)',
      amount: '₹ 45,000',
      status: 'Investigation',
      priority: 'High',
    },
    {
      id: 'DSP-103',
      project: 'Mobile Fintech Branding',
      raisedBy: 'Vikram Sethi (Freelancer)',
      against: 'PayPulse Inc',
      amount: '₹ 22,000',
      status: 'Client Response Needed',
      priority: 'Medium',
    },
  ]

  const recentTransactions = [
    {
      id: 'TXN-94821',
      project: 'SaaS Analytics Dashboard',
      client: 'Arun Enterprises',
      freelancer: 'Priya Sundar',
      amount: '₹ 38,500',
      platformFee: '₹ 3,850 (10%)',
      status: 'Escrow Held',
    },
    {
      id: 'TXN-94820',
      project: 'Flutter Mobile App Delivery',
      client: 'HealthBridge Co',
      freelancer: 'Karthik Raja',
      amount: '₹ 75,000',
      platformFee: '₹ 7,500 (10%)',
      status: 'Released',
    },
    {
      id: 'TXN-94819',
      project: 'Brand Style Guide & 3D Icons',
      client: 'Zomax Media',
      freelancer: 'Sneha Patel',
      amount: '₹ 18,000',
      platformFee: '₹ 1,800 (10%)',
      status: 'Released',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#08182B] via-[#0D2440] to-[#1B254B] p-6 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#CBA96B] backdrop-blur-xs mb-3 border border-white/10">
            <ShieldCheck size={14} />
            Hunhar Administration Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, System Admin
          </h1>
          <p className="mt-1 text-sm text-[#D6DCE5]">
            Here is the platform live pulse. There are <strong className="text-white">5 pending KYC verifications</strong>, <strong className="text-[#C06B3E]">3 active disputes</strong>, and <strong className="text-white">₹ 4.8L</strong> in secure escrow today.
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

        {/* Mascot decoration */}
        <div className="absolute -bottom-6 right-6 hidden md:block">
          <img
            src={mascotBeanbag}
            alt="Admin Mascot"
            className="h-44 w-auto object-contain opacity-90 filter drop-shadow-lg"
          />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="4,820"
          subValue="3,410 Freelancers · 1,410 Clients"
          trend="+14.2%"
          isPositive={true}
          icon={Users}
        />
        <StatCard
          title="Active Projects"
          value="348"
          subValue="94 Proposals pending bids"
          trend="+8.5%"
          isPositive={true}
          icon={Briefcase}
        />
        <StatCard
          title="Escrow Volume"
          value="₹ 18.4 Lakhs"
          subValue="₹ 1.84 Lakhs Platform Revenue"
          trend="+22.1%"
          isPositive={true}
          icon={CreditCard}
        />
        <StatCard
          title="Open Disputes"
          value="3 Active"
          subValue="Avg resolution time: 4.2 hrs"
          trend="-25.0%"
          isPositive={true}
          icon={ShieldAlert}
        />
      </div>

      {/* Two Column Layout: Action Center & Disputes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: KYC Verification Queue */}
        <div className="lg:col-span-2 rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#08182B]">KYC Verification Queue</h2>
              <p className="text-xs text-[#8E8376]">Review ID proofs and verify badges before payouts</p>
            </div>
            <Link
              to="/admin/verifications"
              className="text-xs font-bold text-[#C06B3E] hover:underline flex items-center gap-1"
            >
              View all 5 <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[#F0EAE1]">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#F8F4EE] border border-[#E5DACD] flex items-center justify-center font-bold text-xs text-[#C06B3E]">
                    {item.user.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#08182B]">{item.user}</span>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                        {item.id}
                      </span>
                    </div>
                    <div className="text-xs text-[#8E8376]">
                      {item.role} • <span className="text-[#08182B] font-medium">{item.docType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-[#8E8376] mr-2">{item.time}</span>
                  <Link
                    to="/admin/verifications"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </Link>
                  <Link
                    to="/admin/verifications"
                    className="rounded-lg border border-[#E5DACD] bg-white px-3 py-1.5 text-xs font-semibold text-[#08182B] hover:bg-[#F8F4EE] transition-colors"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Priority Disputes & Flagged items */}
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                <h2 className="text-base font-bold text-[#08182B]">Flagged Disputes</h2>
              </div>
              <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                Action Required
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {recentDisputes.map((dsp) => (
                <div key={dsp.id} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#08182B]">{dsp.project}</span>
                    <span className="text-xs font-bold text-rose-600">{dsp.amount}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#524B42]">
                    <p><strong className="text-gray-700">From:</strong> {dsp.raisedBy}</p>
                    <p><strong className="text-gray-700">Against:</strong> {dsp.against}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-rose-100 pt-2 text-[11px]">
                    <span className="font-semibold text-rose-700">{dsp.status}</span>
                    <Link
                      to="/admin/disputes"
                      className="font-bold text-[#C06B3E] hover:underline"
                    >
                      Mediate →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#F8F4EE] p-3 text-xs text-[#524B42] border border-[#E5DACD]">
            <p className="font-semibold text-[#08182B]">Hunhar Escrow Policy Tip</p>
            <p className="mt-0.5 text-[11px] text-[#8E8376]">
              Milestone release locks are automatically initiated once either party raises a dispute.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Platform Escrow / Transactions Table */}
      <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
        <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#08182B]">Live Escrow & Revenue Stream</h2>
            <p className="text-xs text-[#8E8376]">10% platform commission auto-deducted on milestone approval</p>
          </div>
          <Link
            to="/admin/transactions"
            className="text-xs font-bold text-[#C06B3E] hover:underline flex items-center gap-1"
          >
            All Ledger Records <ChevronRight size={14} />
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left font-manrope text-xs">
            <thead>
              <tr className="border-b border-[#F0EAE1] text-[#8E8376]">
                <th className="py-3 px-3 font-semibold">Txn ID</th>
                <th className="py-3 px-3 font-semibold">Project Title</th>
                <th className="py-3 px-3 font-semibold">Client</th>
                <th className="py-3 px-3 font-semibold">Freelancer</th>
                <th className="py-3 px-3 font-semibold">Total Escrow</th>
                <th className="py-3 px-3 font-semibold">Hunhar Cut (10%)</th>
                <th className="py-3 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F9F6F0] transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-gray-500">{tx.id}</td>
                  <td className="py-3 px-3 font-bold text-[#08182B]">{tx.project}</td>
                  <td className="py-3 px-3 text-[#524B42]">{tx.client}</td>
                  <td className="py-3 px-3 text-[#524B42]">{tx.freelancer}</td>
                  <td className="py-3 px-3 font-bold text-[#08182B]">{tx.amount}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">{tx.platformFee}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        tx.status === 'Released'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
