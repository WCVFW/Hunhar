import React, { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface TransactionItem {
  id: string
  title: string
  subtitle: string
  date: string
  amount: string
  type: 'incoming' | 'outgoing'
}

const transactionsData: TransactionItem[] = [
  {
    id: '1',
    title: 'Payment from Nova Labs',
    subtitle: 'Website Redesign',
    date: 'Aug 18, 2026',
    amount: '+₹ 1,750',
    type: 'incoming',
  },
  {
    id: '2',
    title: 'Payment from Acme Studio',
    subtitle: 'Brand Identity (Milestone 2)',
    date: 'Aug 14, 2026',
    amount: '+₹ 600',
    type: 'incoming',
  },
  {
    id: '3',
    title: 'Withdrawal to bank',
    subtitle: 'HDFC ****4821',
    date: 'Aug 10, 2026',
    amount: '-₹2,000',
    type: 'outgoing',
  },
  {
    id: '4',
    title: 'Payment from Orbit',
    subtitle: 'Social Media Campaign',
    date: 'Aug 5, 2026',
    amount: '+$400',
    type: 'incoming',
  },
  {
    id: '5',
    title: 'Platform fee',
    subtitle: 'Nova Labs — Website Redesign',
    date: 'Aug 4, 2026',
    amount: '-$175',
    type: 'outgoing',
  },
  {
    id: '6',
    title: 'Bonus — Top Bidder',
    subtitle: 'THEUNOIA Rewards',
    date: 'Aug 1, 2026',
    amount: '+$50',
    type: 'incoming',
  },
]

export default function WalletPage(): React.JSX.Element {
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false)
  const [showAddFundsModal, setShowAddFundsModal] = useState<boolean>(false)

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching image */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="font-manrope text-[20px] font-bold text-[#C06B3E]">
            Wallet
          </h1>
          <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">
            Find and invite talented freelancers to collaborate on your projects.
          </p>
        </div>

        {/* Big Top Card: AVAILABLE BALANCE */}
        <div className="flex flex-col justify-between rounded-[20px] border border-[#DEBBA5] bg-[#F7F2EC] p-6 sm:p-8">
          <div>
            <span className="font-manrope text-[11px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              AVAILABLE BALANCE
            </span>
            <div className="mt-2">
              <span className="font-manrope text-[38px] sm:text-[44px] font-extrabold leading-none text-[#C06B3E]">
                ₹ 2,840.00
              </span>
            </div>
            <p className="mt-2 font-manrope text-[13px] font-semibold text-[#1A202C]">
              +₹ 700.00 this month
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white shadow-xs transition-all hover:bg-[#A95A30] active:scale-98"
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => setShowAddFundsModal(true)}
              className="flex h-11 w-full items-center justify-center rounded-[12px] bg-[#0A1629] font-manrope text-[14px] font-bold text-white shadow-xs transition-all hover:bg-[#122340] active:scale-98"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {/* Box 1: TOTAL EARNED */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              TOTAL EARNED
            </span>
            <span className="mt-3 font-manrope text-[24px] font-bold leading-none text-[#C06B3E]">
              ₹ 18,240
            </span>
          </div>

          {/* Box 2: THIS MONTH */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              THIS MONTH
            </span>
            <span className="mt-3 font-manrope text-[24px] font-bold leading-none text-[#C06B3E]">
              ₹ 2,800
            </span>
          </div>

          {/* Box 3: PENDING */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              PENDING
            </span>
            <span className="mt-3 font-manrope text-[24px] font-bold leading-none text-[#C06B3E]">
              ₹ 950
            </span>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mt-8 rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF] p-6 sm:p-7">
          <h2 className="font-manrope text-[15px] font-bold text-[#111827]">
            Transaction History
          </h2>

          <div className="mt-5 flex flex-col space-y-4">
            {transactionsData.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between ${
                  index !== 0 ? 'border-t border-[#F8F6F2] pt-4' : ''
                }`}
              >
                {/* Left: Icon + Title & Subtitle */}
                <div className="flex items-center gap-3.5">
                  {/* Icon Box */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                      item.type === 'incoming'
                        ? 'bg-[#EBF7EE] text-[#16A34A]'
                        : 'bg-[#FEECEC] text-[#EF4444]'
                    }`}
                  >
                    {item.type === 'incoming' ? (
                      <ArrowDownLeft size={17} strokeWidth={2.3} />
                    ) : (
                      <ArrowUpRight size={17} strokeWidth={2.3} />
                    )}
                  </div>

                  {/* Texts */}
                  <div className="flex flex-col">
                    <span className="font-manrope text-[14px] font-bold text-[#111827]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 font-manrope text-[12px] text-[#A0AEC0]">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Date */}
                <div className="flex flex-col items-end">
                  <span
                    className={`font-manrope text-[14.5px] font-bold ${
                      item.type === 'incoming'
                        ? 'text-[#16A34A]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {item.amount}
                  </span>
                  <span className="mt-0.5 font-manrope text-[11.5px] text-[#A0AEC0]">
                    {item.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Withdraw Modal placeholder if clicked */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-[#111827]">Withdraw Funds</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">
              Current available balance: <strong className="text-[#C06B3E]">₹ 2,840.00</strong>
            </p>
            <div className="mt-4">
              <label className="text-[12px] font-bold text-[#8C9BA8] uppercase">Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount"
                defaultValue="2000"
                className="mt-1 w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[14px] outline-none focus:border-[#C06B3E]"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-[10px] border border-[#CBD5E1] px-4 py-2 text-[13px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Withdrawal request submitted successfully!')
                  setShowWithdrawModal(false)
                }}
                className="rounded-[10px] bg-[#C06B3E] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Add Funds Modal placeholder if clicked */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-[#111827]">Add Funds</h3>
            <p className="mt-1 text-[13px] text-[#64748B]">
              Top up your balance for payments and services.
            </p>
            <div className="mt-4">
              <label className="text-[12px] font-bold text-[#8C9BA8] uppercase">Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount"
                defaultValue="500"
                className="mt-1 w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[14px] outline-none focus:border-[#0A1629]"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddFundsModal(false)}
                className="rounded-[10px] border border-[#CBD5E1] px-4 py-2 text-[13px] font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Funds added successfully!')
                  setShowAddFundsModal(false)
                }}
                className="rounded-[10px] bg-[#0A1629] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
