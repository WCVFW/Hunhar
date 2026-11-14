import React from 'react'
import { motion } from 'framer-motion'
import { Bot, BarChart3, Check, Zap, Target } from 'lucide-react'

export default function AIEngineSection(): React.JSX.Element {
  return (
    <section
      id="ai-engine"
      className="relative w-full overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] py-16 sm:py-20 lg:py-24"
      aria-label="AI Engine Section"
    >
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8">
        {/* =========================================================
            HEADER: Badge, Title, Subtitle
           ========================================================= */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {/* Badge Pill */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FAF0E8] border border-[#F1D1BD] text-[#C06B3E] font-manrope text-xs sm:text-[13px] font-semibold mb-4 shadow-xs">
            AI Engine
          </div>

          {/* Heading */}
          <h2 className="font-makira font-medium text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-[#0A1B37] leading-tight m-0">
            Smarter Connections, Better Opportunities.
          </h2>

          {/* Subtitle */}
          <p className="font-manrope text-sm sm:text-base text-[#555E6D] mt-4 mb-0 leading-relaxed max-w-xl">
            Our AI engine understands context, verifies capability, and ensures every project gets the perfect match.
          </p>
        </div>

        {/* =========================================================
            DESKTOP 3-WAY INTERACTIVE ANIMATED DIAGRAM (md and above)
           ========================================================= */}
        <div className="hidden md:block relative w-full max-w-5xl mx-auto h-[560px] lg:h-[580px]">
          {/* SVG Connector & Wave Energy Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1000 580"
            fill="none"
          >
            {/* Concentric Radar Circles behind AI Orb */}
            <circle
              cx="500"
              cy="255"
              r="80"
              stroke="#E65C00"
              strokeWidth="1"
              strokeOpacity="0.22"
              fill="none"
            />
            <circle
              cx="500"
              cy="255"
              r="125"
              stroke="#E65C00"
              strokeWidth="1"
              strokeOpacity="0.14"
              strokeDasharray="4 4"
              fill="none"
            />
            <circle
              cx="500"
              cy="255"
              r="170"
              stroke="#E65C00"
              strokeWidth="1"
              strokeOpacity="0.08"
              fill="none"
            />

            {/* Glowing Faint Ambient Radial Halo */}
            <radialGradient id="aiOrbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFA25B" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#E65C00" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#E65C00" stopOpacity="0" />
            </radialGradient>
            <circle cx="500" cy="255" r="160" fill="url(#aiOrbGlow)" />

            {/* Path 1: Center -> Left Card (AI-Powered Client Assistance) */}
            <line
              x1="500"
              y1="255"
              x2="310"
              y2="150"
              stroke="#F97316"
              strokeWidth="1.75"
              strokeDasharray="5 5"
              strokeOpacity="0.6"
            />

            {/* Path 2: Center -> Right Card (Task Tracking & Monitoring) */}
            <line
              x1="500"
              y1="255"
              x2="690"
              y2="150"
              stroke="#F97316"
              strokeWidth="1.75"
              strokeDasharray="5 5"
              strokeOpacity="0.6"
            />

            {/* Path 3: Center -> Bottom Card (AI-Based Skill Verification) */}
            <line
              x1="500"
              y1="255"
              x2="500"
              y2="425"
              stroke="#F97316"
              strokeWidth="1.75"
              strokeDasharray="5 5"
              strokeOpacity="0.6"
            />

            {/* =======================================================
                3-WAY PULSE PARTICLES (Flowing outwards from AI circle)
               ======================================================= */}
            {/* Particle 1 flowing to Left Card */}
            <motion.circle
              r="4.5"
              fill="#E65C00"
              animate={{
                cx: [500, 310],
                cy: [255, 150],
                opacity: [0, 1, 1, 0],
                scale: [0.7, 1.2, 1, 0.6],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              r="2"
              fill="#FFFFFF"
              animate={{
                cx: [500, 310],
                cy: [255, 150],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Particle 2 flowing to Right Card */}
            <motion.circle
              r="4.5"
              fill="#E65C00"
              animate={{
                cx: [500, 690],
                cy: [255, 150],
                opacity: [0, 1, 1, 0],
                scale: [0.7, 1.2, 1, 0.6],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.35,
              }}
            />
            <motion.circle
              r="2"
              fill="#FFFFFF"
              animate={{
                cx: [500, 690],
                cy: [255, 150],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.35,
              }}
            />

            {/* Particle 3 flowing to Bottom Card */}
            <motion.circle
              r="4.5"
              fill="#E65C00"
              animate={{
                cx: [500, 500],
                cy: [255, 425],
                opacity: [0, 1, 1, 0],
                scale: [0.7, 1.2, 1, 0.6],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.7,
              }}
            />
            <motion.circle
              r="2"
              fill="#FFFFFF"
              animate={{
                cx: [500, 500],
                cy: [255, 425],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.7,
              }}
            />

            {/* Connection Node Ring & Core Dots on Cards */}
            <circle cx="310" cy="150" r="4.5" fill="#E65C00" />
            <circle cx="310" cy="150" r="8" stroke="#FDBA74" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />

            <circle cx="690" cy="150" r="4.5" fill="#E65C00" />
            <circle cx="690" cy="150" r="8" stroke="#FDBA74" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />

            <circle cx="500" cy="425" r="4.5" fill="#E65C00" />
            <circle cx="500" cy="425" r="8" stroke="#FDBA74" strokeWidth="1.5" strokeOpacity="0.7" fill="none" />
          </svg>

          {/* ---------------------------------------------------------
              CARD 1: AI-Powered Client Assistance (Top-Left)
             --------------------------------------------------------- */}
          <div className="absolute left-0 top-12 w-[310px] lg:w-[330px] z-10">
            <div className="relative bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/5 hover:shadow-[0_14px_38px_rgba(0,0,0,0.09)] transition-all duration-200">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] mb-3.5 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              {/* Title */}
              <h3 className="font-makira font-bold text-base sm:text-lg text-[#0A1B37] mb-2 leading-snug">
                AI-Powered Client Assistance
              </h3>
              {/* Description */}
              <p className="font-manrope text-xs sm:text-[13px] text-[#555E6D] leading-relaxed m-0">
                AI evaluates freelancer profiles, compares bids, and selects the best candidates based on skills, history, and experience.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------------
              CARD 2: Task Tracking & Progress Monitoring (Top-Right)
             --------------------------------------------------------- */}
          <div className="absolute right-0 top-12 w-[310px] lg:w-[330px] z-10">
            <div className="relative bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/5 hover:shadow-[0_14px_38px_rgba(0,0,0,0.09)] transition-all duration-200">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] mb-3.5 shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              {/* Title */}
              <h3 className="font-makira font-bold text-base sm:text-lg text-[#0A1B37] mb-2 leading-snug">
                Task Tracking & Progress Monitoring
              </h3>
              {/* Description */}
              <p className="font-manrope text-xs sm:text-[13px] text-[#555E6D] leading-relaxed m-0">
                Monitor milestones, timelines, and deliverables in real time, ensuring full transparency and accountability.
              </p>
            </div>
          </div>

          {/* ---------------------------------------------------------
              CENTER NODE: Luminous 3D AI Orb + Floating Badges
             --------------------------------------------------------- */}
          <div className="absolute left-1/2 top-[255px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
            {/* Floating Badges above orb */}
            <div className="absolute -top-11 flex items-center gap-3 select-none pointer-events-none whitespace-nowrap">
              {/* Left Badge: 3.2x faster */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.07)] border border-black/5 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="font-manrope text-[11px] font-bold text-[#0A1B37]">3.2× faster</span>
              </motion.div>

              {/* Right Badge: 99.1% match */}
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.07)] border border-black/5 flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="font-manrope text-[11px] font-bold text-[#0A1B37]">99.1% match</span>
              </motion.div>
            </div>

            {/* Orbiting Satellite Particle (around AI Orb) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute w-44 h-44 pointer-events-none flex items-center justify-start"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#E65C00] shadow-[0_0_8px_rgba(230,92,0,0.8)]" />
            </motion.div>

            {/* Outer Expanding Ripple Ring Animation */}
            <motion.div
              animate={{
                scale: [1, 1.28, 1.4],
                opacity: [0.55, 0.2, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute w-28 h-28 lg:w-32 lg:h-32 rounded-full border-2 border-[#E65C00] pointer-events-none"
            />

            {/* Central Glossy 3D AI Sphere */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 12px 35px rgba(230,92,0,0.4), inset 0 2px 8px rgba(255,255,255,0.7)',
                  '0 16px 48px rgba(230,92,0,0.6), inset 0 3px 10px rgba(255,255,255,0.85)',
                  '0 12px 35px rgba(230,92,0,0.4), inset 0 2px 8px rgba(255,255,255,0.7)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center cursor-default select-none overflow-hidden"
              style={{
                background:
                  'radial-gradient(circle at 35% 32%, #FFA25B 0%, #E65C00 48%, #9E3C00 100%)',
              }}
            >
              {/* Glass specular top highlight reflection */}
              <div className="pointer-events-none absolute top-1 left-2 w-14 h-7 rounded-full bg-white/35 blur-[2px] transform -rotate-15" />

              {/* Bold AI Text */}
              <span className="font-makira font-bold text-2xl lg:text-3xl text-white tracking-wider drop-shadow-sm">
                AI
              </span>
            </motion.div>
          </div>

          {/* ---------------------------------------------------------
              CARD 3: AI-Based Skill Verification (Bottom-Center)
             --------------------------------------------------------- */}
          <div className="absolute left-1/2 top-[425px] -translate-x-1/2 w-full max-w-[440px] lg:max-w-[460px] z-10">
            <div className="relative bg-white rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/5 hover:shadow-[0_14px_38px_rgba(0,0,0,0.09)] transition-all duration-200 flex items-start gap-3.5">
              {/* Green Check Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              {/* Content */}
              <div>
                <h3 className="font-makira font-bold text-base sm:text-lg text-[#0A1B37] mb-1.5 leading-snug">
                  AI-Based Skill Verification
                </h3>
                <p className="font-manrope text-xs sm:text-[13px] text-[#555E6D] leading-relaxed m-0">
                  Skills verified through AI-driven assessments, ensuring optimal freelancer-project matches every time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            MOBILE RESPONSIVE FLOW (Hidden on md and above)
           ========================================================= */}
        <div className="md:hidden flex flex-col items-center gap-4">
          {/* Central AI Node with animation & badges */}
          <div className="relative flex flex-col items-center my-3">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white px-3 py-1 rounded-full shadow-xs border border-black/5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="font-manrope text-xs font-bold text-[#0A1B37]">3.2× faster</span>
              </div>
              <div className="bg-white px-3 py-1 rounded-full shadow-xs border border-black/5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="font-manrope text-xs font-bold text-[#0A1B37]">99.1% match</span>
              </div>
            </div>

            {/* Glowing Orb */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(230,92,0,0.35)] relative"
              style={{
                background:
                  'radial-gradient(circle at 35% 32%, #FFA25B 0%, #E65C00 48%, #9E3C00 100%)',
              }}
            >
              <span className="font-makira font-bold text-xl text-white">AI</span>
            </motion.div>

            {/* Subtle Connector to Cards */}
            <div className="w-0.5 h-5 border-l-2 border-dashed border-[#E65C00]/40 mt-3" />
          </div>

          {/* Card 1 */}
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-black/5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] mb-3">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="font-makira font-bold text-base text-[#0A1B37] mb-1.5">
              AI-Powered Client Assistance
            </h3>
            <p className="font-manrope text-xs text-[#555E6D] leading-relaxed m-0">
              AI evaluates freelancer profiles, compares bids, and selects the best candidates based on skills, history, and experience.
            </p>
          </div>

          {/* Card 2 */}
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-black/5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0E8] flex items-center justify-center text-[#C06B3E] mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-makira font-bold text-base text-[#0A1B37] mb-1.5">
              Task Tracking & Progress Monitoring
            </h3>
            <p className="font-manrope text-xs text-[#555E6D] leading-relaxed m-0">
              Monitor milestones, timelines, and deliverables in real time, ensuring full transparency and accountability.
            </p>
          </div>

          {/* Card 3 */}
          <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-makira font-bold text-base text-[#0A1B37] mb-1">
                AI-Based Skill Verification
              </h3>
              <p className="font-manrope text-xs text-[#555E6D] leading-relaxed m-0">
                Skills verified through AI-driven assessments, ensuring optimal freelancer-project matches every time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

