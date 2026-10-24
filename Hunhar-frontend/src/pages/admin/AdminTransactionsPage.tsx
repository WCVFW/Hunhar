import React, { useState } from 'react'
import {
  Search,
  Download,
} from 'lucide-react'


interface EscrowTransaction {
  id: string
  project: string
  client: string
  freelancer: string
  amount: string
  fee: string
  date: string
  status: 'In Escrow' | 'Released' | 'Refunded' | 'Dispute Locked'
  milestone: string
}

const mockTransactions: EscrowTransaction[] = [
  {
    id: 'TXN-9021',
    project: 'SaaS Design System in Figma',
    client: 'CloudScale Inc',
    freelancer: 'Aarav Patel',
    amount: '₹ 45,000',
    fee: '₹ 4,500',
    date: 'Oct 23, 2026',
    status: 'In Escrow',
    milestone: 'Milestone 2: High Fidelity UI',
  },
  {
    id: 'TXN-9020',
    project: 'Mobile Banking Native App',
    client: 'PayPulse Solutions',
    freelancer: 'Karthik Raja',
    amount: '₹ 75,000',
    fee: '₹ 7,500',
    date: 'Oct 22, 2026',
    status: 'Released',
    milestone: 'Milestone 3: Final APK & Source',
  },
  {
    id: 'TXN-9019',
    project: 'E-commerce React Migration',
    client: 'TechNova Labs',
    freelancer: 'Rohan Mehra',
    amount: '₹ 45,000',
    fee: '₹ 4,500',
    date: 'Oct 21, 2026',
    status: 'Dispute Locked',
    milestone: 'Milestone 1: Backend API Integration',
  },
  {
    id: 'TXN-9018',
    project: 'Brand Identity & Guidelines',
    client: 'Aura Lifestyle',
    freelancer: 'Sneha Patel',
    amount: '₹ 20,000',
    fee: '₹ 2,000',
    date: 'Oct 19, 2026',
    status: 'Released',
    milestone: 'Full Project Milestone',
  },
  {
    id: 'TXN-9017',
    project: 'Wordpress Speed Optimization',
    client: 'Local Bakery Hub',
    freelancer: 'Vikram Sethi',
    amount: '₹ 8,000',
    fee: '₹ 800',
    date: 'Oct 18, 2026',
    status: 'Refunded',
    milestone: 'Delivery cancelled by client mutual consent',
  },
]

export default function AdminTransactionsPage(): React.JSX.Element {
  const [filter, setFilter] = useState<string>('All')
  const [txList, setTxList] = useState<EscrowTransaction[]>(mockTransactions)
  const [search, setSearch] = useState('')

  const handleForceRelease = (id: string) => {
    setTxList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Released' } : t))
    )
  }

  const handleForceRefund = (id: string) => {
    setTxList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Refunded' } : t))
    )
  }

  const filtered = txList.filter((t) => {
    const matchFilter = filter === 'All' || t.status === filter
    const matchSearch =
      t.project.toLowerCase().includes(search.toLowerCase()) ||
      t.client.toLowerCase().includes(search.toLowerCase()) ||
      t.freelancer.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">
            Escrow & Financial Ledger
          </h1>
          <p className="text-sm text-[#8E8376]">
            Inspect all project deposits, Hunhar 10% platform cuts, dispute locks, and payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5DACD] bg-white px-3.5 py-2 text-xs font-semibold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors"
          >
            <Download size={14} />
            Download Financial Statement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Total In Protected Escrow</span>
          <h3 className="text-2xl font-bold text-[#08182B] mt-1">₹ 14,80,000</h3>
          <p className="text-[11px] text-[#8E8376] mt-0.5">Across 42 active milestone contracts</p>
        </div>

        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Total Hunhar Platform Revenue (10%)</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹ 3,92,400</h3>
          <p className="text-[11px] text-emerald-700 mt-0.5">+18% growth this month</p>
        </div>

        <div className="rounded-[20px] bg-white p-5 border border-[#E5DACD] shadow-xs">
          <span className="text-xs font-semibold text-[#8E8376]">Locked In Dispute</span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">₹ 45,000</h3>
          <p className="text-[11px] text-rose-700 mt-0.5">Pending admin arbitration (1 case)</p>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {['All', 'In Escrow', 'Released', 'Dispute Locked', 'Refunded'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === st
                  ? 'bg-[#08182B] text-white font-bold'
                  : 'bg-[#F8F4EE] text-[#8E8376] hover:text-[#08182B]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction or project..."
            className="w-full rounded-xl border border-[#E5DACD] bg-white pl-9 pr-4 py-1.5 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-[20px] bg-white border border-[#E5DACD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-manrope text-xs">
            <thead>
              <tr className="border-b border-[#F0EAE1] bg-[#FAFAF8] text-[#8E8376]">
                <th className="py-3 px-4 font-semibold">Txn ID & Date</th>
                <th className="py-3 px-4 font-semibold">Project & Milestone</th>
                <th className="py-3 px-4 font-semibold">Parties</th>
                <th className="py-3 px-4 font-semibold">Escrow Total</th>
                <th className="py-3 px-4 font-semibold">Fee (10%)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F9F6F0] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[#08182B]">{tx.id}</span>
                    <p className="text-[11px] text-[#8E8376]">{tx.date}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#08182B]">{tx.project}</p>
                    <p className="text-[11px] text-[#8E8376]">{tx.milestone}</p>
                  </td>

                  <td className="py-3.5 px-4 text-[11px]">
                    <p><strong className="text-gray-700">Client:</strong> {tx.client}</p>
                    <p><strong className="text-gray-700">Dev:</strong> {tx.freelancer}</p>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-[#08182B] text-sm">
                    {tx.amount}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    {tx.fee}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        tx.status === 'Released'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tx.status === 'In Escrow'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : tx.status === 'Dispute Locked'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {tx.status === 'Dispute Locked' || tx.status === 'In Escrow' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleForceRelease(tx.id)}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Force Release to Freelancer"
                        >
                          Release
                        </button>
                        <button
                          type="button"
                          onClick={() => handleForceRefund(tx.id)}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                          title="Force Refund to Client"
                        >
                          Refund
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#8E8376] italic">Completed</span>
                    )}
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
