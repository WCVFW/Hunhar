import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Crosshair,
  MessageSquare,
  BarChart3,
  Sparkles,
  Rocket,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react'
import InteractiveDotGrid from './InteractiveDotGrid'

interface FeaturesHeroProps {
  onOpenSignup?: () => void
}

export default function FeaturesHero({ onOpenSignup }: FeaturesHeroProps): React.JSX.Element {
  const handleGetStarted = (e: React.MouseEvent) => {
    if (onOpenSignup) {
      e.preventDefault()
      onOpenSignup()
    }
  }

  return (
    <div className="p-2 sm:p-4 lg:p-5 bg-[#0A1B37]">
      <section
        id="features"
        className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24"
        aria-label="Features Section"
      >
        {/* Interactive Dot Mesh Grid with Mouse Repulsion & Ripple Effect */}
        <InteractiveDotGrid />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* =========================================================
              LEFT COLUMN: Header, Description, CTAs, Stats
             ========================================================= */}
          <div className="flex flex-col items-start lg:col-span-6 xl:col-span-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0E8] border border-[#F1D1BD] text-[#C06B3E] font-manrope text-xs sm:text-[13px] font-semibold mb-6 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C06B3E]" />
              <span>Platform Features</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-makira font-medium text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[3.75rem] xl:text-[5rem] text-[#0A1B37] leading-[0.96] tracking-[-0.025em] uppercase m-0">
              Everything You Need
              <br />
              to{' '}
              <span className="bg-gradient-to-r from-[#C06B3E] via-[#D8783B] to-[#E39D52] bg-clip-text text-transparent">
                Build, Collaborate
              </span>
              <br />
              & Succeed
            </h1>

            {/* Subhead / Description */}
            <p className="font-manrope text-[0.9375rem] sm:text-base xl:text-[1.125rem] leading-[1.6] font-medium text-[#0A1B37]/85 max-w-xl mt-6 mb-8">
              A complete ecosystem for students and clients — from onboarding to delivery, powered
              by AI and built for real-world impact.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Button 1: EXPLORE FEATURES */}
              <a
                href="#capabilities"
                className="bg-[#C06B3E] hover:bg-[#AA572D] active:scale-98 text-white font-manrope font-semibold text-xs sm:text-[13px] tracking-wider uppercase px-6 sm:px-7 py-3.5 rounded-lg shadow-sm transition-all duration-200 no-underline inline-flex items-center justify-center cursor-pointer"
              >
                EXPLORE FEATURES
              </a>

              {/* Button 2: GET STARTED FREE → */}
              {onOpenSignup ? (
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="group bg-white hover:bg-[#FAF8F5] active:scale-98 text-[#0A1B37] border border-[#0A1B37]/30 hover:border-[#0A1B37] font-manrope font-semibold text-xs sm:text-[13px] tracking-wider uppercase px-6 sm:px-7 py-3.5 rounded-lg shadow-xs transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>GET STARTED FREE</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              ) : (
                <a
                  href="/signup"
                  className="group bg-white hover:bg-[#FAF8F5] active:scale-98 text-[#0A1B37] border border-[#0A1B37]/30 hover:border-[#0A1B37] font-manrope font-semibold text-xs sm:text-[13px] tracking-wider uppercase px-6 sm:px-7 py-3.5 rounded-lg shadow-xs transition-all duration-200 no-underline inline-flex items-center justify-center gap-2"
                >
                  <span>GET STARTED FREE</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </a>
              )}
            </div>

            {/* Metrics / Stats Row */}
            <div className="flex items-center gap-8 sm:gap-12 mt-10 pt-6 border-t border-black/5 w-full max-w-lg">
              <div>
                <div className="font-makira font-bold text-2xl sm:text-3xl text-[#0A1B37] tracking-tight">
                  14+
                </div>
                <div className="font-manrope text-xs sm:text-[13px] text-[#71717A] font-medium mt-1">
                  Core Features
                </div>
              </div>

              <div>
                <div className="font-makira font-bold text-2xl sm:text-3xl text-[#0A1B37] tracking-tight">
                  2x
                </div>
                <div className="font-manrope text-xs sm:text-[13px] text-[#71717A] font-medium mt-1">
                  Faster Delivery
                </div>
              </div>

              <div>
                <div className="font-makira font-bold text-2xl sm:text-3xl text-[#0A1B37] tracking-tight">
                  100%
                </div>
                <div className="font-manrope text-xs sm:text-[13px] text-[#71717A] font-medium mt-1">
                  Student Verified
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: Orbit Decoration, Feature Suite Card & Floating Badges
             ========================================================= */}
          <div className="relative flex items-center justify-center lg:col-span-6 xl:col-span-5 py-6 sm:py-8 lg:py-10">
            {/* Concentric Circular Orbit Rings (matching screenshot) */}
            <div
              aria-hidden="true"
              className="absolute w-[440px] h-[440px] sm:w-[500px] sm:h-[500px] lg:w-[530px] lg:h-[530px] rounded-full border border-[#0A1B37]/8 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute w-[330px] h-[330px] sm:w-[380px] sm:h-[380px] lg:w-[410px] lg:h-[410px] rounded-full border border-[#0A1B37]/6 pointer-events-none"
            />

            {/* Main Interactive Container */}
            <div className="relative w-full max-w-[420px] sm:max-w-[440px]">
              {/* TOP-RIGHT FLOATING BADGE (500+ Students Onboarded) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 sm:-top-5 -right-2 sm:-right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-[0_12px_28px_rgba(10,27,55,0.12)] border border-black/5 flex items-center gap-3 select-none"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FDF2EB] flex items-center justify-center text-[#C06B3E] shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-makira font-bold text-xs sm:text-sm text-[#0A1B37] leading-tight">
                    500+ Students
                  </div>
                  <div className="font-manrope text-[11px] text-[#71717A] font-medium leading-tight mt-0.5">
                    Onboarded
                  </div>
                </div>
              </motion.div>

              {/* BOTTOM-LEFT FLOATING BADGE (AI Powered Smart automation) */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 sm:-bottom-5 -left-2 sm:-left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-[0_12px_28px_rgba(10,27,55,0.12)] border border-black/5 flex items-center gap-3 select-none"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FDF2EB] flex items-center justify-center text-[#C06B3E] shrink-0">
                  <Sparkles className="w-5 h-5 text-[#C06B3E]" />
                </div>
                <div>
                  <div className="font-makira font-bold text-xs sm:text-sm text-[#0A1B37] leading-tight">
                    AI Powered
                  </div>
                  <div className="font-manrope text-[11px] text-[#71717A] font-medium leading-tight mt-0.5">
                    Smart automation
                  </div>
                </div>
              </motion.div>

              {/* MAIN GRADIENT CARD: FEATURE SUITE */}
              <div className="relative bg-gradient-to-br from-[#BA5D2C] via-[#CD7439] to-[#E2934D] rounded-[24px] sm:rounded-[28px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(186,93,44,0.28)] border border-white/20 z-10 select-none overflow-hidden">
                {/* Subtle specular lighting accent inside card */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-white/15 rounded-full blur-2xl"
                />

                {/* Card Title & Subtitle */}
                <div className="mb-5">
                  <span className="font-manrope text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 block">
                    FEATURE SUITE
                  </span>
                  <h3 className="font-makira text-xl sm:text-2xl font-bold text-white mt-1 mb-0 tracking-tight">
                    All-in-one platform
                  </h3>
                </div>

                {/* 2x3 Grid of Feature Tiles */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Tile 1: Milestone Tracking */}
                  <div className="bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-2.5 transition-colors">
                    <Crosshair className="w-4 h-4 text-white/95 shrink-0" />
                    <span className="text-white text-xs sm:text-[13px] font-medium leading-tight">
                      Milestone Tracking
                    </span>
                  </div>

                  {/* Tile 2: Client Chat */}
                  <div className="bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-2.5 transition-colors">
                    <MessageSquare className="w-4 h-4 text-white/95 shrink-0" />
                    <span className="text-white text-xs sm:text-[13px] font-medium leading-tight">
                      Client Chat
                    </span>
                  </div>

                  {/* Tile 3: Performance Insights */}
                  <div className="bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-2.5 transition-colors">
                    <BarChart3 className="w-4 h-4 text-white/95 shrink-0" />
                    <span className="text-white text-xs sm:text-[13px] font-medium leading-tight">
                      Performance Insights
                    </span>
                  </div>

                  {/* Tile 4: AI Quality Check */}
                  <div className="bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-2.5 transition-colors">
                    <Sparkles className="w-4 h-4 text-white/95 shrink-0" />
                    <span className="text-white text-xs sm:text-[13px] font-medium leading-tight">
                      AI Quality Check
                    </span>
                  </div>

                  {/* Tile 5: Project Delivery */}
                  <div className="bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-2.5 transition-colors">
                    <Rocket className="w-4 h-4 text-white/95 shrink-0" />
                    <span className="text-white text-xs sm:text-[13px] font-medium leading-tight">
                      Project Delivery
                    </span>
                  </div>

                  {/* Tile 6: Secure Payments */}
                  <div className="bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center gap-2.5 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-white/95 shrink-0" />
                    <span className="text-white text-xs sm:text-[13px] font-medium leading-tight">
                      Secure Payments
                    </span>
                  </div>
                </div>

                {/* Progress Metric: On-time Delivery 94% */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-manrope text-white/80 font-medium">On-time Delivery</span>
                    <span className="font-manrope font-bold text-white tracking-wide">94%</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/15 rounded-full mt-2.5 overflow-hidden p-[2px]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#FFA25B] via-[#FFCA80] to-white w-[94%] shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  )
}

