import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Newspaper, BookOpen, FileText } from 'lucide-react'
import featuresLunaImg from '../../assets/FeaturesLuna.png'

interface GrowthCard {
  step: string
  tag: string
  title: string
  description: string
  statNumber: string
  statLabel: string
  icon: React.ComponentType<{ className?: string }>
}

const cards: GrowthCard[] = [
  {
    step: '12',
    tag: 'AI',
    title: 'AI-Based Skill Verification',
    description:
      'Skills verified through AI-driven assessments - matched to projects by demonstrated capability, not self-declared expertise.',
    statNumber: '500+',
    statLabel: 'skills verified',
    icon: Clock,
  },
  {
    step: '13',
    tag: 'Insights',
    title: 'Tech News & Insights',
    description:
      'Real-time technology news and industry insights via APIs - stay updated with market trends and current technologies.',
    statNumber: '50+',
    statLabel: 'sources tracked',
    icon: Newspaper,
  },
  {
    step: '14',
    tag: 'Learning',
    title: 'AI-Based Skill Verification',
    description:
      'Access basic tutorials for specific skills upskill, bridge knowledge gaps, and prepare for real-world project requirements.',
    statNumber: '200+',
    statLabel: 'tutorials available',
    icon: BookOpen,
  },
]

export default function AIGrowthToolsSection(): React.JSX.Element {
  return (
    <section
      id="ai-growth-tools"
      className="relative w-full overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] py-16 sm:py-20 lg:py-24"
      aria-label="AI Growth Tools"
    >
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* =========================================================
              LEFT COLUMN: Header + 3 Growth Cards Grid
             ========================================================= */}
          <div className="flex flex-col lg:col-span-7">
            {/* Badge Pill */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FAF0E8] border border-[#F1D1BD] text-[#C06B3E] font-manrope text-xs sm:text-[13px] font-semibold mb-4 shadow-xs self-start">
              AI Growth Tools
            </div>

            {/* Main Headline */}
            <h2 className="font-Manrope semi-bold text-3xl sm:text-4xl md:text-5xl text-[#0A1B37] tracking-tight leading-[1.12] m-0">
              Learn, Verify & Stay Ahead
            </h2>

            {/* Subtitle */}
            <p className="font-manrope text-sm sm:text-base text-[#555E6D] mt-4 mb-8 leading-relaxed max-w-xl">
              Tools that help students grow their skills and stay updated with the latest in tech.
            </p>

            {/* 3 Growth Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cards.map((card) => {
                const IconComponent = card.icon
                return (
                  <div
                    key={card.step}
                    className="relative bg-white rounded-2xl p-5 border border-black/5 shadow-[0_8px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-200 min-h-[300px]"
                  >
                    {/* Top Content */}
                    <div>
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] mb-3 shadow-xs">
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Watermark in top-right */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute top-4 right-5 font-makira font-extrabold text-3xl sm:text-4xl text-black/[0.04] leading-none"
                      >
                        {card.step}
                      </span>

                      {/* Tag */}
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C06B3E] font-manrope text-[11px] font-semibold mb-2.5">
                        {card.tag}
                      </span>

                      {/* Title */}
                      <h3 className="font-makira font-bold text-sm sm:text-[15px] text-[#0A1B37] leading-snug mb-2">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="font-manrope text-xs text-[#555E6D] leading-relaxed m-0">
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom Highlight Stat */}
                    <div className="pt-4 mt-4 border-t border-black/5 flex items-baseline gap-1.5">
                      <span className="font-makira font-bold text-sm text-[#C06B3E]">
                        {card.statNumber}
                      </span>
                      <span className="font-manrope text-xs text-[#71717A] font-medium">
                        {card.statLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Luna Mascot with Glow Aura & Floating Badges
             ========================================================= */}
          <div className="lg:col-span-5 flex items-center justify-center relative py-6">
            <div className="relative w-full max-w-[420px] sm:max-w-[460px] flex items-center justify-center">
              {/* Background circular peach glow aura */}
              <div
                aria-hidden="true"
                className="absolute w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full bg-gradient-to-b from-[#FADBC8]/75 via-[#F7CDAF]/40 to-transparent pointer-events-none"
              />

              {/* Concentric thin orbit circular ring */}
              <div
                aria-hidden="true"
                className="absolute w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] rounded-full border border-[#C06B3E]/15 pointer-events-none"
              />

              {/* Floating Badge 1: Top-Left (Skill Verified) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 left-2 sm:left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-black/5 text-xs font-manrope font-semibold text-[#0A1B37] select-none"
              >
                Skill Verified
              </motion.div>

              {/* Floating Badge 2: Top-Right (Book icon chip) */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute top-8 right-2 sm:right-4 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-black/5 text-[#C06B3E] flex items-center justify-center select-none"
              >
                <BookOpen className="w-5 h-5" />
              </motion.div>

              {/* Floating Badge 3: Mid-Left (Document icon chip) */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute top-36 -left-2 sm:left-0 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-black/5 text-[#C06B3E] flex items-center justify-center select-none"
              >
                <FileText className="w-5 h-5" />
              </motion.div>

              {/* Floating Badge 4: Bottom-Right (Skill Verified) */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="absolute bottom-24 right-0 sm:right-2 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-black/5 text-xs font-manrope font-semibold text-[#0A1B37] select-none"
              >
                Skill Verified
              </motion.div>

              {/* FeaturesLuna Mascot Image */}
              <img
                src={featuresLunaImg}
                alt="Luna mascot studying with laptop"
                className="relative z-10 w-full h-auto max-h-[440px] sm:max-h-[480px] object-contain drop-shadow-[0_15px_35px_rgba(10,27,55,0.12)] block select-none pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

