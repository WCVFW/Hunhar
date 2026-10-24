import React, { useState } from 'react'
import { Link } from 'react-router-dom'

interface BidItem {
  id: string
  title: string
  client: string
  category: string
  status: 'Accepted' | 'Pending' | 'Rejected'
  amount: string
  submittedDate: string
  statusMessage: string
  deadline: string
  actionType: 'workspace' | 'withdraw' | 'none'
  workspaceId?: string
}

const initialBidsData: BidItem[] = [
  {
    id: '1',
    title: 'Dashboard UI Design',
    client: 'Nexus Labs',
    category: 'Web Design',
    status: 'Accepted',
    amount: '$1,800',
    submittedDate: 'Submitted Aug 8, 2026',
    statusMessage: 'Congratulations! You got the project.',
    deadline: 'Project deadline: Aug 30',
    actionType: 'workspace',
    workspaceId: '1',
  },
  {
    id: '2',
    title: 'App Icon Set',
    client: 'Folio Studio',
    category: 'Illustration',
    status: 'Pending',
    amount: '₹ 480',
    submittedDate: 'Submitted Aug 17, 2026',
    statusMessage: 'Awaiting client review.',
    deadline: 'Project deadline: Sep 3',
    actionType: 'withdraw',
  },
  {
    id: '3',
    title: 'Annual Report Design',
    client: 'FinEdge',
    category: 'Print Design',
    status: 'Rejected',
    amount: '₹ 2,200',
    submittedDate: 'Submitted Aug 15, 2026',
    statusMessage: 'Client chose another freelancer.',
    deadline: 'Project deadline: Sep 20',
    actionType: 'none',
  },
  {
    id: '4',
    title: 'Product Photography Direction',
    client: 'Luma Goods',
    category: 'Photography',
    status: 'Pending',
    amount: '$1,100',
    submittedDate: 'Submitted Aug 12, 2026',
    statusMessage: 'Awaiting client review.',
    deadline: 'Project deadline: Sep 15',
    actionType: 'withdraw',
  },
]

export default function MyBidsPage(): React.JSX.Element {
  const [bids, setBids] = useState<BidItem[]>(initialBidsData)

  const handleWithdraw = (id: string) => {
    if (window.confirm('Are you sure you want to withdraw this bid?')) {
      setBids((prev) => prev.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching image */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="font-manrope text-[20px] font-bold text-[#C06B3E]">
            My Bids
          </h1>
          <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">
            Find your bids history
          </p>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-4.5 lg:gap-5">
          {/* Card 1: TOTAL BIDS */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              TOTAL BIDS
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              5
            </span>
          </div>

          {/* Card 2: PENDING */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              PENDING
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              2
            </span>
          </div>

          {/* Card 3: SHORTLISTED */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              SHORTLISTED
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              1
            </span>
          </div>

          {/* Card 4: ACCEPTED */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              ACCEPTED
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              1
            </span>
          </div>
        </div>

        {/* Bids List */}
        <div className="mt-8 flex flex-col space-y-4">
          {bids.map((bid) => {
            return (
              <div
                key={bid.id}
                className="group relative flex flex-col justify-between rounded-[18px] border border-[#EBEBEB] bg-[#FFFFFF] p-5 sm:p-6 transition-all duration-150 hover:border-[#DCDCDC]"
              >
                {/* Header row: Title + Status Pill & Amount + Date */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col">
                    {/* Title & Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-manrope text-[15px] font-bold text-[#111827]">
                        {bid.title}
                      </h3>

                      {/* Status Pill matching image exact styling */}
                      {bid.status === 'Accepted' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 font-manrope text-[11px] font-medium text-[#22C55E]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                          Accepted
                        </span>
                      )}

                      {bid.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF5E7] px-2.5 py-0.5 font-manrope text-[11px] font-medium text-[#F59E0B]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                          Pending
                        </span>
                      )}

                      {bid.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEECEC] px-2.5 py-0.5 font-manrope text-[11px] font-medium text-[#EF4444]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                          Rejected
                        </span>
                      )}
                    </div>

                    {/* Client & Category Subtitle */}
                    <p className="mt-1 font-manrope text-[12px] text-[#A0AEC0]">
                      {bid.client} · {bid.category}
                    </p>
                  </div>

                  {/* Amount & Submitted Date */}
                  <div className="flex flex-col sm:items-end">
                    <span className="font-manrope text-[15px] font-bold text-[#111827]">
                      {bid.amount}
                    </span>
                    <span className="mt-0.5 font-manrope text-[11.5px] text-[#A0AEC0]">
                      {bid.submittedDate}
                    </span>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mt-2.5">
                  <p className="font-manrope text-[12.5px] text-[#718096]">
                    {bid.statusMessage}
                  </p>
                </div>

                {/* Divider & Footer: Deadline & Action */}
                <div className="mt-4 flex items-center justify-between border-t border-[#F2F2F2] pt-3.5">
                  <span className="font-manrope text-[11.5px] text-[#A0AEC0]">
                    {bid.deadline}
                  </span>

                  <div>
                    {bid.actionType === 'workspace' && (
                      <Link
                        to={`/freelancer/projects/${bid.workspaceId || '1'}`}
                        className="inline-flex items-center justify-center rounded-[10px] bg-[#C06B3E] px-4 py-1.5 font-manrope text-[12px] font-semibold text-white shadow-xs transition-all hover:bg-[#A95A30] active:scale-98"
                      >
                        Open Workspace
                      </Link>
                    )}

                    {bid.actionType === 'withdraw' && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(bid.id)}
                        className="font-manrope text-[12px] font-medium text-[#E11D48] transition-colors hover:text-[#BE123C] hover:underline"
                      >
                        Withdraw bid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
