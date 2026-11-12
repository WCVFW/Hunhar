import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  MessageCircle,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Mic,
  Monitor,
  Wallet,
  Users,
  Trophy,
  Check,
  type LucideIcon,
} from 'lucide-react'

interface CapabilityItem {
  step: string
  title: string
  description: string
  tag: string
  icon: LucideIcon
}

interface TabData {
  id: string
  name: string
  icon: LucideIcon
  featured: CapabilityItem
  sideCards: [CapabilityItem, CapabilityItem]
}

const tabs: TabData[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Rocket,
    featured: {
      step: '01',
      title: 'Smart Sign-Up & Onboarding',
      description:
        'A streamlined sign-up process for students and clients — quick profile creation, preference setup, and instant access to projects and talent without unnecessary complexity.',
      tag: 'Onboarding',
      icon: Rocket,
    },
    sideCards: [
      {
        step: '02',
        title: 'DigiLocker Identity Verification',
        description:
          'Secure verification via DigiLocker ensures authentic profiles, builds client trust, and prevents fraudulent activity on the platform.',
        tag: 'Security',
        icon: ShieldCheck,
      },
      {
        step: '03',
        title: 'College-Based Communities',
        description:
          'Join dedicated college communities, fostering peer learning, collaboration, and trust within a familiar academic environment.',
        tag: 'Community',
        icon: GraduationCap,
      },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: MessageCircle,
    featured: {
      step: '04',
      title: 'Real-Time Messaging',
      description:
        'In-platform messaging enables seamless, transparent communication between students and clients throughout the entire project lifecycle — no external tools needed.',
      tag: 'Communication',
      icon: MessageCircle,
    },
    sideCards: [
      {
        step: '05',
        title: 'Audio Communication',
        description:
          'Audio-only calls for focused discussions, reviews, and coordination with low bandwidth usage.',
        tag: 'Communication',
        icon: Mic,
      },
      {
        step: '06',
        title: 'Screen Sharing',
        description:
          'Demonstrate work, explain solutions, and resolve issues in real-time to improve collaboration.',
        tag: 'Collaboration',
        icon: Monitor,
      },
    ],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: TrendingUp,
    featured: {
      step: '07',
      title: 'Bidding System',
      description:
        'Post projects, receive competitive bids, and match with the right talent based on skills and timeline.',
      tag: 'Marketplace',
      icon: Wallet,
    },
    sideCards: [
      {
        step: '08',
        title: 'Collaborative Freelancing',
        description:
          'Two freelancers can collaborate on a single project, enabling skill-based teamwork, faster delivery, and higher-quality outcomes for clients.',
        tag: 'Teamwork',
        icon: Users,
      },
      {
        step: '09',
        title: 'Performance Leaderboard',
        description:
          'A performance-based leaderboard highlights top freelancers based on quality, consistency, and client feedback — helping clients quickly find reliable talent.',
        tag: 'Recognition',
        icon: Trophy,
      },
    ],
  },
]

export default function PlatformCapabilities(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<number>(0)
  const currentTab = tabs[activeTab]

  return (
    <section
      id="capabilities"
      className="relative w-full overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] py-16 sm:py-20 lg:py-24"
      aria-label="Platform Capabilities"
    >
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
        {/* =========================================================
            HEADER: Badge, Title, Subtitle
           ========================================================= */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          {/* Badge Pill */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FAF0E8] border border-[#F1D1BD] text-[#C06B3E] font-manrope text-xs sm:text-[13px] font-semibold mb-4 shadow-xs">
            Platform Capabilities
          </div>

          {/* Heading */}
          <h2 className="font-makira font-medium text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-[#0A1B37] leading-tight m-0">
            What we’re strong at and how we help your journey
          </h2>

          {/* Subtitle */}
          <p className="font-manrope text-sm sm:text-base text-[#555E6D] mt-4 mb-0 leading-relaxed max-w-2xl">
            Every tool students and clients need — from onboarding to project delivery, all in one place.
          </p>
        </div>

        {/* =========================================================
            INTERACTIVE TAB SWITCHER (3 Tabs) - Fully Responsive Grid
           ========================================================= */}
        <div className="flex justify-center mb-10 sm:mb-12 w-full px-1 sm:px-0">
          <div className="grid grid-cols-3 w-full max-w-xl p-1 sm:p-1.5 rounded-full bg-[#F3EFEA] border border-[#E8DFC9]/70 shadow-inner">
            {tabs.map((tab, idx) => {
              const TabIcon = tab.icon
              const isActive = activeTab === idx
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-1.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] min-[380px]:text-xs sm:text-sm font-manrope font-semibold flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 cursor-pointer border-none outline-none text-center ${
                    isActive
                      ? 'bg-white text-[#0A1B37] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                      : 'bg-transparent text-[#64748B] hover:text-[#0A1B37]'
                  }`}
                  aria-selected={isActive}
                >
                  <TabIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-[#0A1B37]' : 'text-[#64748B]'}`} />
                  <span className="truncate">{tab.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C06B3E] shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* =========================================================
            TAB CONTENT: Featured Large Card + 2 Smaller Cards + Status Bar
           ========================================================= */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-5xl mx-auto"
          >
            {/* ---------------------------------------------------------
                LEFT COLUMN: Large Featured Step Card
               --------------------------------------------------------- */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative bg-white rounded-2xl sm:rounded-3xl p-7 sm:p-9 border-2 border-[#C06B3E] shadow-[0_10px_30px_rgba(192,107,62,0.08)] flex-1 flex flex-col justify-between overflow-hidden min-h-[380px] sm:min-h-[420px]">
                {/* Top Info */}
                <div>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] mb-6 shadow-xs">
                    {React.createElement(currentTab.featured.icon, { className: 'w-6 h-6' })}
                  </div>

                  {/* Step Label */}
                  <span className="font-manrope text-xs font-bold tracking-widest text-[#C06B3E] uppercase block mb-2">
                    STEP {currentTab.featured.step}
                  </span>

                  {/* Title */}
                  <h3 className="font-makira font-bold text-xl sm:text-2xl text-[#0A1B37] tracking-tight mb-3.5 leading-snug">
                    {currentTab.featured.title}
                  </h3>

                  {/* Description */}
                  <p className="font-manrope text-sm sm:text-[15px] text-[#555E6D] leading-relaxed max-w-md">
                    {currentTab.featured.description}
                  </p>
                </div>

                {/* Bottom Row: Tag + Watermark Number */}
                <div className="flex items-center justify-between pt-6 mt-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#FAF0E8] text-[#C06B3E] font-manrope text-xs font-semibold">
                    {currentTab.featured.tag}
                  </span>

                  {/* Big Watermark Number */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute bottom-4 right-6 font-makira font-extrabold text-7xl sm:text-8xl text-black/[0.04] leading-none"
                  >
                    {currentTab.featured.step}
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------
                RIGHT COLUMN: 2 Side Cards + Status Bar
               --------------------------------------------------------- */}
            <div className="lg:col-span-6 flex flex-col gap-5 justify-between">
              {currentTab.sideCards.map((card) => {
                const SideIcon = card.icon
                return (
                  <div
                    key={card.step}
                    className="relative bg-white rounded-2xl p-6 border border-black/5 shadow-[0_6px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-200 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]"
                  >
                    {/* Header Row */}
                    <div className="flex items-center gap-3.5 mb-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] shrink-0">
                        <SideIcon className="w-5 h-5" />
                      </div>
                      <h4 className="font-makira font-bold text-base sm:text-lg text-[#0A1B37] leading-snug m-0 pr-12">
                        {card.title}
                      </h4>
                    </div>

                    {/* Watermark in top-right */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none select-none absolute top-4 right-6 font-makira font-extrabold text-4xl sm:text-5xl text-black/[0.04] leading-none"
                    >
                      {card.step}
                    </span>

                    {/* Description */}
                    <p className="font-manrope text-xs sm:text-sm text-[#555E6D] leading-relaxed mt-2 mb-4">
                      {card.description}
                    </p>

                    {/* Tag */}
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C06B3E] font-manrope text-[11px] font-semibold">
                        {card.tag}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Bottom Status Card */}
              <div className="bg-white rounded-2xl px-5 py-3.5 border border-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center justify-between">
                {/* Left side: check icon + label */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C06B3E] flex items-center justify-center text-white shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-manrope font-bold text-xs sm:text-[13px] text-[#0A1B37] block leading-tight">
                      3 of 9 capabilities
                    </span>
                    <span className="font-manrope text-[11px] text-[#71717A] leading-tight block">
                      in this category
                    </span>
                  </div>
                </div>

                {/* Right side: step indicator pills/dots */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((idx) => {
                    const isCurrent = activeTab === idx
                    return isCurrent ? (
                      <span
                        key={idx}
                        className="w-5 h-1.5 rounded-full bg-[#C06B3E] transition-all duration-300"
                      />
                    ) : (
                      <span
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full bg-[#D4D4D8] transition-all duration-300"
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

