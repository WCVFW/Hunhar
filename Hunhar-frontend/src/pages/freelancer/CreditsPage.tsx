import React, { useState } from 'react'
import { Check } from 'lucide-react'

interface PlanTier {
  id: string
  name: string
  price: string
  period: string
  tokens: string
  tokenRate: string
  badge?: {
    text: string
    colorClass: string
  }
  features: string[]
  buttonText: string
  isCurrent?: boolean
  highlightCard?: boolean
  borderColor?: string
}

const plans: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹99',
    period: '/mo',
    tokens: '100 Tokens',
    tokenRate: '₹1/token',
    features: [
      '200 credits/month',
      '5 active bids',
      'Basic analytics',
      'Email support',
      'Badge: Elite Freelancer',
    ],
    buttonText: 'Switch Plan',
    borderColor: 'border-[#F0ECE6]',
  },
  {
    id: 'value',
    name: 'Value',
    price: '₹499',
    period: '/mo',
    tokens: '670 Tokens',
    tokenRate: '₹1/token',
    badge: {
      text: 'BEST VALUE',
      colorClass: 'bg-[#0A1629] text-white',
    },
    features: [
      '700 credits/month',
      'Unlimited bids',
      'Priority listing',
      'Advanced analytics',
      'Badge: Pro Freelancer',
    ],
    buttonText: 'Current Plan',
    isCurrent: true,
    highlightCard: true,
    borderColor: 'border-[#0A1629]',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '₹999',
    period: '/mo',
    tokens: '1500 Tokens',
    tokenRate: '₹1/token',
    badge: {
      text: 'MOST POPULAR',
      colorClass: 'bg-[#C06B3E] text-white',
    },
    features: [
      '2,000 credits/month',
      'Unlimited bids',
      'Featured profile',
      'Dedicated support',
      'Badge: Elite Freelancer',
    ],
    buttonText: 'Switch Plan',
    borderColor: 'border-[#F0BCA2]',
  },
]

interface HistoryItem {
  id: string
  title: string
  date: string
  amount: string
  amountType: 'positive' | 'negative'
  balanceLeft: string
}

const historyData: HistoryItem[] = [
  {
    id: '1',
    title: 'Credit renewal',
    date: 'Aug 1, 2026',
    amount: '+700',
    amountType: 'positive',
    balanceLeft: '700 left',
  },
  {
    id: '2',
    title: 'Bid placed — UX Audit',
    date: 'Aug 19, 2026',
    amount: '-20',
    amountType: 'negative',
    balanceLeft: '680 left',
  },
  {
    id: '3',
    title: 'Profile boost (7 days)',
    date: 'Aug 15, 2026',
    amount: '-50',
    amountType: 'negative',
    balanceLeft: '700 left',
  },
  {
    id: '4',
    title: 'Bid placed — App Icon Set',
    date: 'Aug 17, 2026',
    amount: '-20',
    amountType: 'negative',
    balanceLeft: '680 left',
  },
]

export default function CreditsPage(): React.JSX.Element {
  const [currentPlanId, setCurrentPlanId] = useState<string>('value')

  return (
    <div className="w-full font-manrope">
      {/* Outer White Main Panel Card */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="font-manrope text-[20px] font-bold text-[#C06B3E]">
            Credits
          </h1>
          <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">
            Your current plan and credit balance
          </p>
        </div>

        {/* Top Current Balance Banner Box */}
        <div className="flex flex-col justify-between rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF] p-6 sm:flex-row sm:items-center sm:p-7 shadow-xs">
          <div className="flex flex-col">
            <span className="font-manrope text-[11px] font-bold tracking-wider text-[#A0AEC0] uppercase">
              CURRENT BALANCE
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-manrope text-[38px] font-extrabold tracking-tight text-[#08182B]">
                ₹206
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-manrope text-[12.5px] text-[#C06B3E]">
              {/* Sparkle icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-[#C06B3E]"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>
                Renews in 12 days · <span className="font-semibold">Pro Plan</span>
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:mt-0 sm:items-end">
            <span className="font-manrope text-[12px] text-[#A0AEC0]">
              Each bid costs
            </span>
            <span className="mt-0.5 font-manrope text-[20px] font-bold text-[#C06B3E]">
              20 credits
            </span>
            <span className="mt-1 font-manrope text-[12px] text-[#A0AEC0]">
              Profile boost = 50 credits
            </span>
          </div>
        </div>

        {/* 3 Pricing Plans Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = plan.id === currentPlanId

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-[20px] border bg-[#FFFFFF] p-6 transition-all ${
                  plan.borderColor || 'border-[#F0ECE6]'
                } ${plan.highlightCard ? 'border-[1.5px] shadow-sm' : ''}`}
              >
                {/* Floating Top Badge if present */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`rounded-full px-3.5 py-1 font-manrope text-[10.5px] font-bold tracking-wider uppercase ${plan.badge.colorClass}`}
                    >
                      {plan.badge.text}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name */}
                  <h3 className="font-manrope text-[15px] font-bold text-[#08182B]">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline">
                    <span className="font-manrope text-[28px] font-extrabold text-[#08182B]">
                      {plan.price}
                    </span>
                    <span className="ml-0.5 font-manrope text-[13px] font-medium text-[#8C9BA8]">
                      {plan.period}
                    </span>
                  </div>

                  {/* Tokens & Rate */}
                  <p className="mt-1 font-manrope text-[12px] text-[#A0AEC0]">
                    {plan.tokens} · {plan.tokenRate}
                  </p>

                  {/* Features List */}
                  <div className="mt-5 flex flex-col space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {/* Green checkmark circle */}
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#22C55E]/40 text-[#22C55E]">
                          <Check size={11} strokeWidth={2.5} />
                        </div>
                        <span className="font-manrope text-[12.5px] text-[#4A5568]">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="mt-7">
                  {isSelected ? (
                    <button
                      type="button"
                      className="w-full rounded-[10px] bg-[#0A1629] py-2.5 font-manrope text-[12.5px] font-semibold text-white shadow-xs transition-all hover:bg-[#122340]"
                    >
                      Current Plan
                    </button>
                  ) : plan.id === 'elite' ? (
                    <button
                      type="button"
                      onClick={() => setCurrentPlanId(plan.id)}
                      className="w-full rounded-[10px] bg-[#C06B3E] py-2.5 font-manrope text-[12.5px] font-semibold text-white shadow-xs transition-all hover:bg-[#A95A30] active:scale-98"
                    >
                      Switch Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentPlanId(plan.id)}
                      className="w-full rounded-[10px] bg-[#CFD4DC] py-2.5 font-manrope text-[12.5px] font-semibold text-[#4A5568] transition-all hover:bg-[#BFC5CF]"
                    >
                      Switch Plan
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Transaction History Section */}
        <div className="mt-8 rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF] p-5 sm:p-7">
          <div className="flex flex-col space-y-5">
            {historyData.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between ${
                  index !== 0 ? 'border-t border-[#F8F6F2] pt-4.5' : ''
                }`}
              >
                {/* Title & Date */}
                <div className="flex flex-col">
                  <span className="font-manrope text-[14px] font-bold text-[#1A202C]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 font-manrope text-[12px] text-[#A0AEC0]">
                    {item.date}
                  </span>
                </div>

                {/* Amount & Balance Left */}
                <div className="flex items-center gap-6 sm:gap-12">
                  <span
                    className={`font-manrope text-[15px] font-bold ${
                      item.amountType === 'positive'
                        ? 'text-[#22C55E]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {item.amount}
                  </span>
                  <span className="min-w-[65px] text-right font-manrope text-[12.5px] text-[#A0AEC0]">
                    {item.balanceLeft}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
