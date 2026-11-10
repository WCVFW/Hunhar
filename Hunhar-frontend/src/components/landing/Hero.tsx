import React, { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { FaSalesforce } from 'react-icons/fa6'
import { SiGmail, SiJira } from 'react-icons/si'

import vikashImg from '../../assets/vikash.jpg'
import studentLeftImg from '../../assets/student_left.jpg'
import rihanaImg from '../../assets/rihana.jpg'

interface StudentCard {
  id: number
  name: string
  photo: string
  tagline1: string
  tagline2: string
}

const cards: StudentCard[] = [
  {
    id: 1,
    name: 'Ananya Sharma',
    photo: studentLeftImg,
    tagline1: 'Real wins, not stock photos',
    tagline2: 'Money becomes proof. Proof builds belief.',
  },
  {
    id: 2,
    name: 'Vikash Kumar',
    photo: vikashImg,
    tagline1: 'Real wins, not stock photos',
    tagline2: 'Money becomes proof. Proof builds belief.',
  },
  {
    id: 3,
    name: 'Rihana',
    photo: rihanaImg,
    tagline1: 'Real wins, not stock photos',
    tagline2: 'Money becomes proof. Proof builds belief.',
  },
]

interface HeroProps {
  onOpenSignup?: () => void
}

export default function Hero({ onOpenSignup }: HeroProps): React.JSX.Element {
  // Default to index 1 (Vikash Kumar) in center to match UI design screenshot
  const [activeIndex, setActiveIndex] = useState<number>(1)
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Auto-slide faster & smoother (1.2 seconds interval with smooth glide)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => prev + 1)
    }, 1200)
    return () => clearInterval(timer)
  }, [isPaused])

  // Navigate directly to a specific card via shortest path
  const goToCard = (targetCardIndex: number) => {
    const currentCardIndex = ((activeIndex % cards.length) + cards.length) % cards.length
    let diff = targetCardIndex - currentCardIndex
    if (diff > cards.length / 2) diff -= cards.length
    if (diff < -cards.length / 2) diff += cards.length
    setActiveIndex((prev) => prev + diff)
  }

  // Smooth transforms for continuous unidirectional conveyor effect
  const visibleOffsets = [-2, -1, 0, 1, 2]

  const getCardClasses = (d: number) => {
    if (d === 0) {
      return '-translate-x-1/2 -translate-y-1/2 scale-100 opacity-100 z-30 blur-none pointer-events-auto cursor-default'
    }
    if (d === -1) {
      return '-translate-x-[144%] -translate-y-1/2 scale-[0.78] opacity-90 z-20 blur-none pointer-events-auto cursor-pointer hover:opacity-70'
    }
    if (d === 1) {
      return 'translate-x-[44%] -translate-y-1/2 scale-[0.78] opacity-90 z-20 blur-none pointer-events-auto cursor-pointer hover:opacity-70'
    }
    if (d <= -2) {
      return '-translate-x-[240%] -translate-y-1/2 scale-[0.6] opacity-0 z-10 blur-[2px] pointer-events-none'
    }
    return 'translate-x-[140%] -translate-y-1/2 scale-[0.6] opacity-0 z-10 blur-[2px] pointer-events-none'
  }

  return (
    <section className="relative overflow-hidden bg-[#0A1B37] p-2 sm:p-4 lg:p-5">
      {/* Cream rounded card with faint dots (replaces ::before) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 sm:inset-4 lg:inset-5 rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white bg-[radial-gradient(circle,#E8DFC9_1.1px,transparent_1.1px)] [background-size:32px_32px] z-0"
      />

      <div className="relative z-[1] max-w-[90rem] mx-auto pt-[5.5rem] pb-[3.5rem] px-2 sm:pt-24 sm:pb-16 sm:px-6 lg:pt-[6.5rem] lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Headline, Subheadline, CTA */}
          <div className="flex flex-col items-start z-20 lg:col-span-6">
            {/* Forced 3-line headline with responsive sizing */}
            <h1 className="font-makira font-medium text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[3.75rem] xl:text-[5rem] leading-[0.96] tracking-[-0.025em] uppercase m-0">
              <span className="block text-[#C06B3E]">CONNECTING</span>
              <span className="block text-[#0A1B37]">TALENT WITH</span>
              <span className="block text-[#0A1B37]">OPPORTUNITY</span>
            </h1>

            {/* Subheadline paragraph */}
            <p className="font-manrope text-[0.9375rem] sm:text-base xl:text-[1.125rem] leading-[1.6] font-medium text-[#0A1B37]/85 max-w-[32rem] mt-6 mb-8">
              Hire Skilled Students Or Earn Through Your Skills -
              <br className="hidden sm:inline" />
              {' '}In One Trusted Marketplace.
            </p>

            {/* 'GET STARTED →' button */}
            {onOpenSignup ? (
              <button
                type="button"
                onClick={onOpenSignup}
                className="group bg-[#C06B3E] hover:bg-[#C06B3E]/90 text-white font-manrope font-semibold text-[0.9375rem] px-5 py-3 rounded-lg uppercase tracking-[0.02em] inline-flex items-center gap-2.5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] transition-all duration-200"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <a
                href="/signup"
                className="group bg-[#C06B3E] hover:bg-[#C06B3E]/90 text-white font-manrope font-semibold text-[0.9375rem] px-5 py-3 rounded-lg uppercase tracking-[0.02em] inline-flex items-center gap-2.5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] transition-all duration-200"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            )}
          </div>

          {/* Right Column: Center-Focus Coverflow Auto-Slide Carousel */}
          <div
            className="relative w-full overflow-hidden py-2 select-none lg:col-span-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Left Edge Gradient Fade */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-white/95 via-white/50 to-transparent z-40" />

            {/* Right Edge Gradient Fade */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-white/95 via-white/50 to-transparent z-40" />

            {/* Carousel Stage (compact height) */}
            <div className="relative w-full h-[470px] sm:h-[490px] lg:h-[500px] flex items-center justify-center">
              {visibleOffsets.map((d) => {
                const virtualIndex = activeIndex + d
                const cardIndex = ((virtualIndex % cards.length) + cards.length) % cards.length
                const card = cards[cardIndex]

                return (
                  <div
                    key={virtualIndex}
                    onClick={() => {
                      if (d === -1) setActiveIndex((prev) => prev - 1)
                      if (d === 1) setActiveIndex((prev) => prev + 1)
                    }}
                    className={`absolute top-1/2 left-1/2 w-[260px] sm:w-[280px] lg:w-[300px] transition-all duration-800 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${getCardClasses(d)}`}
                  >
                    <div className="bg-white border border-[#E5E5E5]/60 rounded-[20px] p-3 shadow-[0_20px_25px_-5px_rgba(23,23,23,0.08),0_8px_10px_-6px_rgba(23,23,23,0.08)]">
                      {/* Photo with rounded border */}
                      <div className="w-full h-52 sm:h-[14.5rem] lg:h-64 rounded-[14px] overflow-hidden border border-[#737373]/45 bg-white mb-3.5">
                        <img
                          src={card.photo}
                          alt={card.name}
                          className="w-full h-full object-cover block"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>

                      {/* Name below photo */}
                      <h3 className="font-makira font-bold text-[#0A1B37] text-[1.0625rem] tracking-[-0.01em] px-1.5 overflow-hidden text-ellipsis whitespace-nowrap m-0">
                        {card.name}
                      </h3>

                      {/* Tagline lines */}
                      <p className="font-manrope text-xs font-medium leading-[1.4] text-[#737373] px-1.5 mt-1.5 mb-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {card.tagline1}
                      </p>
                      <p className="font-manrope text-xs leading-[1.4] text-[#737373] px-1.5 my-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {card.tagline2}
                      </p>

                      {/* Bottom row: 3 icons (Salesforce, Gmail, Jira) + 'Hire →' button */}
                      <div className="flex items-center justify-between mt-3.5 px-1.5 pb-1">
                        {/* Small integration badge chips matching UI design */}
                        <div className="flex items-center gap-1">
                          {/* Salesforce chip */}
                          <span
                            className="w-[1.625rem] h-[1.625rem] rounded-lg bg-[#00A1E0] flex items-center justify-center text-white"
                            title="Salesforce"
                          >
                            <FaSalesforce className="w-4 h-4" />
                          </span>

                          {/* Gmail chip */}
                          <span
                            className="w-[1.625rem] h-[1.625rem] rounded-lg bg-white flex items-center justify-center shadow-xs"
                            title="Gmail"
                          >
                            <SiGmail className="w-3.5 h-3.5 text-[#EA4335]" />
                          </span>

                          {/* Jira chip */}
                          <span
                            className="w-[1.625rem] h-[1.625rem] rounded-lg bg-white flex items-center justify-center shadow-xs"
                            title="Jira"
                          >
                            <SiJira className="w-3.5 h-3.5 text-[#0052CC]" />
                          </span>
                        </div>

                        {/* 'Hire →' pill outline button */}
                        <button
                          type="button"
                          className="group border border-[#171717] bg-white hover:bg-[#fafafa] active:scale-95 px-4 py-1.5 rounded-full font-manrope text-[0.8125rem] font-semibold text-[#171717] inline-flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
                        >
                          <span>Hire</span>
                          <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Slide Indicator Pills */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {cards.map((card, idx) => {
                const currentCardIndex = ((activeIndex % cards.length) + cards.length) % cards.length
                const isActive = currentCardIndex === idx
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => goToCard(idx)}
                    aria-label={`Go to slide ${card.name}`}
                    className={`h-1.5 rounded-full transition-all duration-300 p-0 cursor-pointer border-none ${
                      isActive
                        ? 'w-5 bg-[#C06B3E]'
                        : 'w-1.5 bg-[#d4d4d4] hover:bg-[#a3a3a3]'
                    }`}
                  />
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
