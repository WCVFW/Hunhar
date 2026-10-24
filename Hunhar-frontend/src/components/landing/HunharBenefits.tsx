import React, { useState } from 'react'
import { motion } from 'framer-motion'

import {
  Coins,
  Briefcase,
  Layers,
  Sparkles,
  Clock,
  Users,
  TrendingDown,
  Zap,
  Cpu,
  Lightbulb,
  CheckCircle2,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

import vikashImg from '../../assets/vikash.jpg'
import rihanaImg from '../../assets/rihana.jpg'
import mascotStudentImg from '../../assets/mascot_student.png'
import mascotBusinessImg from '../../assets/mascot_business.png'
import indianStudentsImg from '../../assets/indian_students.jpg'
import indianBusinessImg from '../../assets/indian_business.jpg'

interface BenefitItem {
  title: string
  desc: string
  icon: LucideIcon
}

const studentBenefits: BenefitItem[] = [
  {
    title: 'Earn While You Learn',
    desc: 'Make money using your skills.',
    icon: Coins,
  },
  {
    title: 'Gain Real Experience',
    desc: 'Work on real-world projects.',
    icon: Briefcase,
  },
  {
    title: 'Build Your Portfolio',
    desc: 'Showcase work that proves your abilities.',
    icon: Layers,
  },
  {
    title: 'No Experience? No Problem.',
    desc: 'Start your journey without a long resume.',
    icon: Sparkles,
  },
  {
    title: 'Work on Your Terms',
    desc: 'Choose projects that fit your schedule.',
    icon: Clock,
  },
  {
    title: 'Build Your Network',
    desc: 'Connect with businesses and potential employers.',
    icon: Users,
  },
]

const businessBenefits: BenefitItem[] = [
  {
    title: 'Lower Costs',
    desc: 'Get services at student-friendly rates.',
    icon: TrendingDown,
  },
  {
    title: 'Quick Turnaround',
    desc: 'Move projects forward without long hiring cycles.',
    icon: Zap,
  },
  {
    title: 'Access Diverse Skills',
    desc: 'Find talent across design, tech, content and more.',
    icon: Cpu,
  },
  {
    title: 'Fresh Perspectives',
    desc: 'Bring new approaches to business challenges.',
    icon: Lightbulb,
  },
  {
    title: 'Reduce Workload',
    desc: 'Delegate time-consuming tasks to focus on core priorities.',
    icon: CheckCircle2,
  },
  {
    title: 'Discover Future Hires',
    desc: 'Identify promising talent through real project work.',
    icon: UserCheck,
  },
]

export default function HunharBenefits(): React.JSX.Element {
  const [activeSide, setActiveSide] = useState<'stu' | 'biz' | null>(null)

  const isStuOpen = activeSide === 'stu'
  const isBizOpen = activeSide === 'biz'

  return (
    <section
      className="relative w-full py-16 sm:py-24 px-6 overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px]"
      id="benefits"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* Section Header matching 'Start smarter' exactly */}
        <motion.div
          className="text-center max-w-xl mx-auto mb-14"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="font-display text-3xl sm:text-5xl font-medium text-terracotta leading-tight tracking-tight mb-3">
            What’s in it for you?
          </h2>
          <p className="font-sans text-base sm:text-lg font-medium text-navy leading-relaxed m-0">
            Pick your side. See what Hunhar brings.
          </p>
        </motion.div>

        {/* Interactive Split Card */}
        <div
          className="flex flex-col lg:flex-row gap-3.5 lg:h-[740px] w-full"
          onMouseLeave={() => setActiveSide(null)}
        >
          {/* For Students Half */}
          <div
            className={`relative rounded-[32px] sm:rounded-[36px] overflow-hidden cursor-pointer transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.65,0,0.2,1)] bg-terracotta text-[#FFF8EF] ${
              isStuOpen
                ? 'lg:[flex:4.4] cursor-default'
                : isBizOpen
                ? 'lg:[flex:1] max-lg:max-h-[140px]'
                : 'lg:[flex:1] min-h-[360px] lg:min-h-0'
            }`}
            onMouseEnter={() => setActiveSide('stu')}
            onClick={() => setActiveSide(activeSide === 'stu' ? null : 'stu')}
            role="region"
            aria-label="For Students, benefits section"
          >
            {/* Collapsed Tab */}
            <button
              type="button"
              className={`w-full h-full bg-transparent border-0 text-inherit cursor-pointer flex flex-col items-center justify-between p-6 sm:p-8 transition-all duration-300 z-10 ${
                isStuOpen
                  ? 'opacity-0 pointer-events-none absolute inset-0'
                  : 'opacity-100 relative lg:absolute lg:inset-0'
              }`}
              aria-expanded={isStuOpen}
              aria-label="For Students, show benefits"
              onFocus={() => setActiveSide('stu')}
            >
              {/* Big Real Indian Students Image */}
              <div className="relative w-full flex-1 max-h-[460px] rounded-2xl sm:rounded-[28px] overflow-hidden shadow-2xl border-2 border-white/20 group/photo">
                <img
                  src={indianStudentsImg}
                  alt="Indian college students working together"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover/photo:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-terracotta/80 via-transparent to-black/20" />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-terracotta font-manrope font-bold text-xs sm:text-sm py-1.5 px-3.5 rounded-full shadow-md">
                  College Talent
                </span>
              </div>

              {/* Horizontal Text Under Image */}
              <div className="flex flex-col items-center text-center mt-6 w-full">
                <span className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white mb-1.5">
                  For Students
                </span>
                <span className="font-manrope text-sm sm:text-base font-medium text-[#FFF8EF]/85">
                  Earn While You Learn • Real Experience • Freedom
                </span>
              </div>
            </button>

            {/* Expanded Body Content */}
            <div
              className={`transition-opacity duration-500 p-6 sm:p-8 lg:p-10 w-full ${
                isStuOpen
                  ? 'opacity-100 pointer-events-auto delay-300 relative lg:absolute lg:inset-0'
                  : 'opacity-0 pointer-events-none max-lg:hidden absolute inset-0'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 h-full items-start">
                {/* Left Side: Header & Benefits List */}
                <div className="flex flex-col">
                  <h3 className="font-display font-medium text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight mb-2 text-white">
                    For Students
                  </h3>
                  <p className="font-manrope text-sm sm:text-base font-medium opacity-90 mb-5 max-w-md">
                    Earn. Learn. Build Your Portfolio.
                  </p>

                  <div className="flex flex-col divide-y divide-white/20">
                    {studentBenefits.map((item, idx) => {
                      const IconComponent = item.icon
                      return (
                        <div
                          key={item.title}
                          className={`grid grid-cols-[2.5rem_1fr] items-center gap-3.5 py-2.5 transition-all duration-500 ${
                            isStuOpen
                              ? 'opacity-100 translate-x-0'
                              : 'opacity-0 translate-x-6'
                          }`}
                          style={{
                            transitionDelay: `${400 + idx * 70}ms`,
                          }}
                        >
                          <div className="w-9 h-9 rounded-full border border-white/70 flex items-center justify-center shrink-0 bg-white/10">
                            <IconComponent className="w-4 h-4 stroke-[2.2] text-white" />
                          </div>
                          <div className="flex flex-col">
                            <strong className="font-display font-semibold text-sm sm:text-base leading-snug text-white">
                              {item.title}
                            </strong>
                            <span className="font-manrope text-xs sm:text-sm opacity-85 leading-normal">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right Side Visuals: Polaroids & Mascot */}
                <div className="relative h-[280px] lg:h-full mt-4 lg:mt-0 flex items-center justify-center">
                  {/* Polaroid A */}
                  <img
                    className={`absolute top-2 left-2 sm:left-4 w-36 sm:w-44 aspect-[3/3.7] object-cover border-4 border-white rounded-2xl shadow-2xl transition-all duration-700 -rotate-6 ${
                      isStuOpen
                        ? 'opacity-100 scale-100 delay-[600ms]'
                        : 'opacity-0 scale-75'
                    }`}
                    src={vikashImg}
                    alt="Vikash, student with laptop"
                    loading="lazy"
                  />
                  {/* Polaroid B */}
                  <img
                    className={`absolute top-28 sm:top-32 right-2 sm:right-4 w-28 sm:w-36 aspect-[3/3.7] object-cover border-4 border-white rounded-2xl shadow-2xl transition-all duration-700 rotate-6 ${
                      isStuOpen
                        ? 'opacity-100 scale-100 delay-[750ms]'
                        : 'opacity-0 scale-75'
                    }`}
                    src={rihanaImg}
                    alt="Rihana, student with laptop"
                    loading="lazy"
                  />
                  {/* Floating Chip */}
                  <span
                    className={`absolute left-3 top-48 sm:top-52 bg-white text-navy font-manrope font-bold text-xs py-1.5 px-3 rounded-full shadow-lg whitespace-nowrap z-10 transition-all duration-500 ${
                      isStuOpen
                        ? 'opacity-100 translate-y-0 delay-[900ms]'
                        : 'opacity-0 translate-y-6'
                    }`}
                  >
                    Real wins, not stock photos
                  </span>
                  {/* Mascot Luna */}
                  <img
                    className={`absolute right-0 bottom-0 w-44 sm:w-56 lg:w-60 pointer-events-none select-none transition-all duration-700 ${
                      isStuOpen
                        ? 'opacity-100 translate-y-0 delay-[650ms]'
                        : 'opacity-0 translate-y-12'
                    }`}
                    src={mascotStudentImg}
                    alt="Hunhar wolf mascot"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* For Businesses Half */}
          <div
            className={`relative rounded-[32px] sm:rounded-[36px] overflow-hidden cursor-pointer transition-all duration-[850ms] [transition-timing-function:cubic-bezier(0.65,0,0.2,1)] bg-navy text-[#F3EFE6] ring-1 ring-[#CDA96B]/50 ${
              isBizOpen
                ? 'lg:[flex:4.4] cursor-default'
                : isStuOpen
                ? 'lg:[flex:1] max-lg:max-h-[140px]'
                : 'lg:[flex:1] min-h-[360px] lg:min-h-0'
            }`}
            onMouseEnter={() => setActiveSide('biz')}
            onClick={() => setActiveSide(activeSide === 'biz' ? null : 'biz')}
            role="region"
            aria-label="For Businesses, benefits section"
          >
            {/* Collapsed Tab */}
            <button
              type="button"
              className={`w-full h-full bg-transparent border-0 text-inherit cursor-pointer flex flex-col items-center justify-between p-6 sm:p-8 transition-all duration-300 z-10 ${
                isBizOpen
                  ? 'opacity-0 pointer-events-none absolute inset-0'
                  : 'opacity-100 relative lg:absolute lg:inset-0'
              }`}
              aria-expanded={isBizOpen}
              aria-label="For Businesses, show benefits"
              onFocus={() => setActiveSide('biz')}
            >
              {/* Big Real Indian Business People Image */}
              <div className="relative w-full flex-1 max-h-[460px] rounded-2xl sm:rounded-[28px] overflow-hidden shadow-2xl border-2 border-[#CDA96B]/30 group/photo">
                <img
                  src={indianBusinessImg}
                  alt="Indian business team collaborating in office"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/photo:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-transparent to-black/20" />
                <span className="absolute top-4 left-4 bg-navy/90 backdrop-blur-md text-[#CDA96B] font-manrope font-bold text-xs sm:text-sm py-1.5 px-3.5 rounded-full border border-[#CDA96B]/30 shadow-md">
                  Growing Companies
                </span>
              </div>

              {/* Horizontal Text Under Image */}
              <div className="flex flex-col items-center text-center mt-6 w-full">
                <span className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white mb-1.5">
                  For Businesses
                </span>
                <span className="font-manrope text-sm sm:text-base font-medium text-[#F3EFE6]/85">
                  Hire Affordably • Scale Faster • Diverse Talent
                </span>
              </div>
            </button>

            {/* Expanded Body Content */}
            <div
              className={`transition-opacity duration-500 p-6 sm:p-8 lg:p-10 w-full ${
                isBizOpen
                  ? 'opacity-100 pointer-events-auto delay-300 relative lg:absolute lg:inset-0'
                  : 'opacity-0 pointer-events-none max-lg:hidden absolute inset-0'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 h-full items-start">
                {/* Left Side: Header & Benefits List */}
                <div className="flex flex-col">
                  <h3 className="font-display font-medium text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight mb-2 text-white">
                    For Businesses
                  </h3>
                  <p className="font-manrope text-sm sm:text-base font-medium opacity-90 mb-5 max-w-md">
                    Get Work Done. Faster. Smarter. Affordably.
                  </p>

                  <div className="flex flex-col divide-y divide-white/20">
                    {businessBenefits.map((item, idx) => {
                      const IconComponent = item.icon
                      return (
                        <div
                          key={item.title}
                          className={`grid grid-cols-[2.5rem_1fr] items-center gap-3.5 py-2.5 transition-all duration-500 ${
                            isBizOpen
                              ? 'opacity-100 translate-x-0'
                              : 'opacity-0 translate-x-6'
                          }`}
                          style={{
                            transitionDelay: `${400 + idx * 70}ms`,
                          }}
                        >
                          <div className="w-9 h-9 rounded-full border border-white/70 flex items-center justify-center shrink-0 bg-white/10">
                            <IconComponent className="w-4 h-4 stroke-[2.2] text-white" />
                          </div>
                          <div className="flex flex-col">
                            <strong className="font-display font-semibold text-sm sm:text-base leading-snug text-white">
                              {item.title}
                            </strong>
                            <span className="font-manrope text-xs sm:text-sm opacity-85 leading-normal">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right Side Visuals: Polaroids & Mascot */}
                <div className="relative h-[280px] lg:h-full mt-4 lg:mt-0 flex items-center justify-center">
                  {/* Polaroid A */}
                  <img
                    className={`absolute top-2 left-2 sm:left-4 w-36 sm:w-44 aspect-[3/3.7] object-cover border-4 border-white rounded-2xl shadow-2xl transition-all duration-700 -rotate-6 ${
                      isBizOpen
                        ? 'opacity-100 scale-100 delay-[600ms]'
                        : 'opacity-0 scale-75'
                    }`}
                    src={vikashImg}
                    alt="Vikash, student with laptop"
                    loading="lazy"
                  />
                  {/* Polaroid B */}
                  <img
                    className={`absolute top-28 sm:top-32 right-2 sm:right-4 w-28 sm:w-36 aspect-[3/3.7] object-cover border-4 border-white rounded-2xl shadow-2xl transition-all duration-700 rotate-6 ${
                      isBizOpen
                        ? 'opacity-100 scale-100 delay-[750ms]'
                        : 'opacity-0 scale-75'
                    }`}
                    src={rihanaImg}
                    alt="Rihana, student with laptop"
                    loading="lazy"
                  />
                  {/* Floating Chip */}
                  <span
                    className={`absolute left-3 top-48 sm:top-52 bg-white text-navy font-manrope font-bold text-xs py-1.5 px-3 rounded-full shadow-lg whitespace-nowrap z-10 transition-all duration-500 ${
                      isBizOpen
                        ? 'opacity-100 translate-y-0 delay-[900ms]'
                        : 'opacity-0 translate-y-6'
                    }`}
                  >
                    Fresh perspectives
                  </span>
                  {/* Mascot */}
                  <img
                    className={`absolute right-0 bottom-0 w-44 sm:w-56 lg:w-60 pointer-events-none select-none transition-all duration-700 ${
                      isBizOpen
                        ? 'opacity-100 translate-y-0 delay-[650ms]'
                        : 'opacity-0 translate-y-12'
                    }`}
                    src={mascotBusinessImg}
                    alt="Hunhar business mascot"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
