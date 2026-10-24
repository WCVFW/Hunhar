import React, { useState } from 'react'
import {
  TrendingUp,
  Clock,
  CreditCard,
  CheckCircle,
  Download,
} from 'lucide-react'

type PaymentTab = 'Overview' | 'History' | 'Invoices'

interface StatCard {
  id: string
  label: string
  value: string
  icon: React.ReactNode
}

interface UpcomingPayment {
  id: string
  initial: string
  avatarBg: string
  title: string
  dueDate: string
  amount: string
  status: 'Pending'
}

interface PaymentHistoryItem {
  id: string
  initial: string
  avatarBg: string
  title: string
  clientOrPerson: string
  date: string
  amount: string
  status: 'Completed' | 'Refunded'
}

interface InvoiceItem {
  id: string
  title: string
  date: string
  status: 'Paid'
  downloadUrl?: string
}

const statCards: StatCard[] = [
  {
    id: 'total_spent',
    label: 'Total Spent',
    value: '₹ 1,225',
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FAF3EB] text-[#C06B3E]">
        <TrendingUp size={16} />
      </div>
    ),
  },
  {
    id: 'pending',
    label: 'Pending',
    value: '₹ 825',
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FAF3EB] text-[#C06B3E]">
        <Clock size={16} />
      </div>
    ),
  },
  {
    id: 'active_contracts',
    label: 'Active Contracts',
    value: '1',
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FAF3EB] text-[#C06B3E]">
        <CreditCard size={16} />
      </div>
    ),
  },
  {
    id: 'completed',
    label: 'Completed',
    value: '2',
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FAF3EB] text-[#C06B3E]">
        <CheckCircle size={16} />
      </div>
    ),
  },
]

const upcomingPayments: UpcomingPayment[] = [
  {
    id: 'u1',
    initial: 'A',
    avatarBg: 'bg-[#4338CA]',
    title: 'Phase -4 ( Brand Identity — 60% Milestone)',
    dueDate: 'Due Aug 25, 2026',
    amount: '₹ 550',
    status: 'Pending',
  },
  {
    id: 'u2',
    initial: 'Y',
    avatarBg: 'bg-[#C06B3E]',
    title: 'Phase -2 (Banner design — Delivery)',
    dueDate: 'Due Aug 28, 2026',
    amount: '₹ 275',
    status: 'Pending',
  },
]

const historyList: PaymentHistoryItem[] = [
  {
    id: 'h1',
    initial: 'P',
    avatarBg: 'bg-[#10B981]',
    title: 'Social Media Campaign',
    clientOrPerson: 'Priya Menon',
    date: 'Aug 10, 2026',
    amount: '₹ 800',
    status: 'Completed',
  },
  {
    id: 'h2',
    initial: 'A',
    avatarBg: 'bg-[#4338CA]',
    title: 'Brand Identity — 25% Upfront',
    clientOrPerson: 'Arun Kumar',
    date: 'Aug 14, 2026',
    amount: '₹ 275',
    status: 'Completed',
  },
  {
    id: 'h3',
    initial: 'D',
    avatarBg: 'bg-[#8B5CF6]',
    title: 'Product Photography — Partial',
    clientOrPerson: 'Dev Krishnan',
    date: 'Jul 29, 2026',
    amount: '₹ 150',
    status: 'Refunded',
  },
]

const invoiceList: InvoiceItem[] = [
  {
    id: 'inv1',
    title: '25% Upfront',
    date: 'Aug 14',
    status: 'Paid',
  },
  {
    id: 'inv2',
    title: '50% Design',
    date: 'Aug 14',
    status: 'Paid',
  },
]

export default function ClientPaymentsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PaymentTab>('Overview')

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching exact user screenshot */}
      <div className="w-full min-h-[820px] rounded-[24px] bg-white p-6 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* Top Tag: Icon + Payments */}
        <div className="mb-4 flex items-center gap-2 font-manrope text-[14px] font-semibold text-[#64748B]">
          <CreditCard size={17} />
          <span>Payments</span>
        </div>

        {/* Page Title & Subtitle */}
        <div>
          <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#08182B]">
            Payments
          </h1>
          <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">
            Track your spending, invoices and payment schedule
          </p>
        </div>

        {/* 4 Stat Metric Cards Row */}
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-[18px] border border-[#E5E7EB] bg-white p-5 transition-all hover:border-[#DEBBA5] hover:shadow-2xs"
            >
              <div className="mb-4">{card.icon}</div>
              <div>
                <span className="font-manrope text-[22px] font-extrabold text-[#08182B]">
                  {card.value}
                </span>
                <p className="mt-1 font-manrope text-[12px] font-medium text-[#7A7065]">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Horizontal Tabs: Overview, History, Invoices */}
        <div className="mt-8 flex items-center gap-9 border-b border-[#F0ECE6] pb-0">
          {(['Overview', 'History', 'Invoices'] as PaymentTab[]).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 font-manrope text-[14px] transition-colors cursor-pointer ${
                  isActive
                    ? 'font-bold text-[#C06B3E]'
                    : 'font-medium text-[#7A7065] hover:text-[#08182B]'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#C06B3E]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab 1: OVERVIEW TAB CONTENT (Upcoming Payments Card Container) */}
        {activeTab === 'Overview' && (
          <div className="mt-7 rounded-[20px] border border-[#EBE6DF] bg-white p-5 sm:p-7 shadow-xs">
            <h3 className="font-manrope text-[15.5px] font-bold text-[#08182B]">
              Upcoming Payments
            </h3>

            <div className="mt-5 flex flex-col space-y-3.5">
              {upcomingPayments.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-[16px] bg-[#F8F7F4] p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-[#F4F1EC]"
                >
                  {/* Left: Avatar + Title & Date */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-manrope text-[14.5px] font-bold text-white shadow-2xs ${item.avatarBg}`}
                    >
                      {item.initial}
                    </div>
                    <div>
                      <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 font-manrope text-[11.5px] text-[#7A7065]">
                        {item.dueDate}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Pending Status Tag */}
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="font-manrope text-[15px] font-bold text-[#08182B]">
                      {item.amount}
                    </span>
                    <span className="mt-0.5 font-manrope text-[11.5px] font-medium text-[#D97706]">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: HISTORY TAB CONTENT (Payment History List) */}
        {activeTab === 'History' && (
          <div className="mt-7 flex flex-col space-y-3.5">
            {historyList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[16px] border border-[#E5E7EB] bg-white p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-[#DEBBA5] hover:shadow-2xs"
              >
                {/* Left: Avatar + Title & Subtitle */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-manrope text-[14.5px] font-bold text-white shadow-2xs ${item.avatarBg}`}
                  >
                    {item.initial}
                  </div>
                  <div>
                    <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">
                      {item.title}
                    </h4>
                    <p className="mt-0.5 font-manrope text-[11.5px] text-[#7A7065]">
                      {item.clientOrPerson} · {item.date}
                    </p>
                  </div>
                </div>

                {/* Right: Amount & Completed / Refunded Status Tag */}
                <div className="flex flex-col items-start sm:items-end">
                  <span className="font-manrope text-[15px] font-bold text-[#08182B]">
                    {item.amount}
                  </span>
                  <span
                    className={`mt-0.5 font-manrope text-[11.5px] font-semibold ${
                      item.status === 'Completed' ? 'text-[#16A34A]' : 'text-[#EF4444]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: INVOICES TAB CONTENT */}
        {activeTab === 'Invoices' && (
          <div className="mt-7 flex flex-col space-y-3.5">
            {/* Header: Invoice icon + title */}
            <div className="flex items-center gap-2 font-manrope text-[14.5px] font-bold text-[#08182B] mb-1">
              <CreditCard size={16} />
              <span>Invoice</span>
            </div>

            {invoiceList.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 rounded-[16px] bg-[#F8F7F4] p-4 sm:px-6 sm:py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-[#F3EFE9]"
              >
                {/* Left: Title + Paid Tag + Date */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">
                      {inv.title}
                    </span>
                    <span className="rounded-full bg-[#EBF7EE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#16A34A]">
                      {inv.status}
                    </span>
                  </div>
                  <span className="mt-0.5 font-manrope text-[11.5px] text-[#7A7065]">
                    {inv.date}
                  </span>
                </div>

                {/* Right: Terracotta Download Button */}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#C06B3E] px-4 py-2 font-manrope text-[12.5px] font-bold text-white shadow-xs transition-all hover:bg-[#AA572D] active:scale-98 self-start sm:self-center"
                >
                  <span>Download</span>
                  <Download size={14} strokeWidth={2.3} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
