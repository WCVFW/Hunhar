import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Send,
  Inbox,
  LayoutGrid,
  Clock,
  Users,
  ClipboardList,
  Sparkles,
  CircleDollarSign,
  Split,
  type LucideIcon,
} from 'lucide-react'

import hunharLogo from '../../assets/hunhar-Black.svg'
import bridgeIcon from '../../assets/bridge-icon.svg'
import handLeftImg from '../../assets/Left.png'
import handRightImg from '../../assets/right.png'
import mascotBusinessImg from '../../assets/mascot_business.png'
import mascotStudentImg from '../../assets/mascot_student.png'

interface StepItem {
  label: string
  icon: LucideIcon
  variant: 'orange' | 'green'
}

const businessSteps: StepItem[] = [
  { label: 'Post your requirement', icon: Send, variant: 'orange' },
  { label: 'Receive Proposals', icon: Inbox, variant: 'orange' },
  { label: 'Choose Your Talent', icon: LayoutGrid, variant: 'orange' },
  { label: 'Get the Work Done', icon: Clock, variant: 'green' },
]

const studentSteps: StepItem[] = [
  { label: 'Build your Profile', icon: Users, variant: 'orange' },
  { label: 'Apply to Projects', icon: ClipboardList, variant: 'orange' },
  { label: 'Deliver Quality Work', icon: Sparkles, variant: 'orange' },
  { label: 'Get Paid', icon: CircleDollarSign, variant: 'green' },
]

const rowDelays = [1.0, 1.15, 1.3, 1.45]

const leftHandVariants = {
  hidden: {
    opacity: 0,
    x: -200,
    transition: { duration: 0.45, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: 'easeOut' as const },
  },
}

const rightHandVariants = {
  hidden: {
    opacity: 0,
    x: 200,
    transition: { duration: 0.45, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, delay: 0.1, ease: 'easeOut' as const },
  },
}

const logoVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    scale: 0.92,
    transition: { duration: 0.35, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, delay: 0.4, ease: 'easeOut' as const },
  },
}

const bridgeVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    rotate: 3,
    scale: 0.92,
    transition: { duration: 0.35, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 3,
    scale: 1,
    transition: { duration: 0.6, delay: 0.6, ease: 'easeOut' as const },
  },
}

const stemVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, delay: 0.5, ease: 'easeOut' as const },
  },
}

const branchVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, delay: 0.7, ease: 'easeOut' as const },
  },
}

const headerCardVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    transition: { duration: 0.35, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.8, ease: 'easeOut' as const },
  },
}

const spineVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, delay: 0.9, ease: 'easeOut' as const },
  },
}

const stepBoxVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    transition: { duration: 0.3, ease: 'easeIn' as const },
  },
  visible: (idx: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: rowDelays[idx],
      ease: 'easeOut' as const,
    },
  }),
}

export default function HowItWorks(): React.JSX.Element {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0A1B37] text-white py-[60px] md:py-[80px] pb-[80px] md:pb-[120px] px-4 md:px-6 overflow-hidden"
      id="how-it-works"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Creation of Adam Pose - Halftone Hands */}
      <motion.img
        src={handLeftImg}
        alt="Business reach"
        className="absolute left-0 top-[25px] sm:top-[clamp(16px,2.5vw,35px)] lg:top-[clamp(8px,1.8vw,28px)] w-[clamp(130px,28vw,170px)] sm:w-[clamp(180px,26vw,240px)] md:w-[clamp(260px,30vw,340px)] lg:w-[clamp(420px,38vw,680px)] h-auto pointer-events-none z-30 select-none opacity-25 sm:opacity-45 md:opacity-75 lg:opacity-100"
        variants={leftHandVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      />

      <motion.img
        src={handRightImg}
        alt="Student reach"
        className="absolute right-0 top-[15px] sm:top-[clamp(10px,2vw,28px)] lg:top-[clamp(0px,0.8vw,15px)] w-[clamp(130px,28vw,170px)] sm:w-[clamp(180px,26vw,240px)] md:w-[clamp(260px,30vw,340px)] lg:w-[clamp(420px,38vw,680px)] h-auto pointer-events-none z-30 select-none opacity-25 sm:opacity-45 md:opacity-75 lg:opacity-100"
        variants={rightHandVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      />

      {/* Section Header */}
      <div className="text-center max-w-[680px] mx-auto mb-10 relative z-25">
        <h2 className="font-makira text-[clamp(2.1rem,4vw,2.75rem)] font-extrabold text-[#C06B3E] tracking-[-0.01em] m-0 leading-[1.2]">
          How It Works
        </h2>
        <p className="font-manrope text-[clamp(0.95rem,2vw,1.1rem)] text-[#CBD5E1] mt-2.5 leading-[1.5] font-medium">
          Simple steps for both businesses and students
        </p>
      </div>

      <div className="relative max-w-[1280px] mx-auto">
        {/* Center Flow: Logo -> Vertical Line -> Connect Bridge Box */}
        <div className="flex flex-col items-center relative z-20">
          {/* Logo Box */}
          <motion.div
            className="bg-white rounded-[14px] w-[300px] sm:w-[400px] lg:w-[503px] max-w-full h-[54px] sm:h-[76px] lg:h-[87px] flex items-center justify-center shadow-[0_12px_32px_rgba(0,0,0,0.35)] border border-white/90 box-border"
            variants={logoVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <img
              src={hunharLogo}
              alt="hunhar logo"
              className="h-[42px] sm:h-[50px] lg:h-[50px] w-auto object-contain block"
            />
          </motion.div>

          {/* Vertical Dashed Stem */}
          <motion.div
            className="w-0 h-7 sm:h-12 border-l-2 border-dashed border-white/55"
            variants={stemVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          />

          {/* The Connect Bridge Box */}
          <motion.div
            className="relative z-[2] w-[310px] sm:w-[370px] lg:w-[425px] max-w-full h-[68px] sm:h-[76px] lg:h-[86px] px-3 sm:px-4 lg:px-7 pl-3 sm:pl-4 flex items-center gap-3.5 bg-transparent box-border rotate-[3deg]
            before:content-[''] before:absolute before:inset-[-8px_-6px_-2px_-3px] before:bg-gradient-to-r before:from-[#17384E] before:to-[#0F5361] before:border-[1.5px] before:border-[#C06B3E] before:rounded-[14px] before:-rotate-[3.5deg] before:-z-[2] before:pointer-events-none
            after:content-[''] after:absolute after:inset-0 after:bg-white after:border-[1.5px] after:border-[#C06B3E] after:rounded-[12px] after:shadow-[0_10px_25px_rgba(0,0,0,0.35)] after:-z-[1] after:pointer-events-none"
            variants={bridgeVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {/* Diamond badge on top edge */}
            <div className="absolute -top-[17px] left-1/2 -translate-x-1/2 w-[30px] h-[30px] rounded-[7px] bg-[#0B1E38] border border-white/50 flex items-center justify-center text-white rotate-45 z-[3]">
              <Split size={14} strokeWidth={2.4} className="rotate-[135deg]" />
            </div>

            <div className="w-[46px] h-[46px] lg:w-[56px] lg:h-[56px] p-2 rounded-[10px] bg-[#F3F1EE] border border-[#E6E2DC] flex items-center justify-center shrink-0 box-border text-[#D98A52]">
              <img src={bridgeIcon} alt="" className="w-full h-full object-contain block" />
            </div>

            <span className="flex-1 text-center font-makira font-semibold text-[18px] sm:text-[24px] lg:text-[28px] text-[#0A1B37] tracking-[-0.01em] whitespace-nowrap">
              THE HUNHAR CONNECT
            </span>
          </motion.div>
        </div>

        {/* Branch connector SVG */}
        <motion.div
          className="hidden lg:block relative w-full h-0 z-[15]"
          variants={branchVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <svg
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[205px] h-[26px] block overflow-visible"
            viewBox="0 0 205 26"
            fill="none"
          >
            <path
              d="M 102.5 0 L 102.5 8 Q 102.5 20 90.5 20 L 0 20"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeDasharray="4 4"
              strokeWidth="2"
            />
            <path
              d="M 102.5 8 Q 102.5 20 114.5 20 L 205 20"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeDasharray="4 4"
              strokeWidth="2"
            />
          </svg>
        </motion.div>

        {/* Step Grid: Left Column (For Business) & Right Column (For Talent) */}
        <div className="grid grid-cols-1 md:grid-cols-2 justify-center justify-items-center gap-12 sm:gap-10 lg:gap-[110px] relative z-20 max-w-[840px] mx-auto mt-7 md:mt-1">
          {/* LEFT COLUMN: For Business */}
          <div className="relative flex flex-col items-center w-full max-w-[340px] sm:max-w-[320px] lg:max-w-[365px] lg:w-[365px]">
            {/* Spine Connector */}
            <motion.div
              className="absolute top-[60px] bottom-[36px] left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-white/55 z-[1]"
              variants={spineVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            />

            {/* Header Card */}
            <motion.div
              className="relative z-[2] w-full sm:w-[250px] lg:w-[270px] h-[72px] lg:h-[80px] px-3.5 pl-3 flex items-center justify-center sm:justify-start gap-3.5 bg-white rounded-[12px] border border-white/95 shadow-[0_8px_22px_rgba(0,0,0,0.3)] mb-11 lg:mb-[56px] box-border"
              variants={headerCardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <div className="w-[56px] h-[56px] rounded-[8px] overflow-hidden bg-[#F1F5F9] shrink-0">
                <img
                  src={mascotBusinessImg}
                  alt="Business avatar"
                  className="w-full h-full object-cover block"
                />
              </div>
              <span className="font-makira font-bold text-[22px] lg:text-[26px] text-[#0A1B37] tracking-[-0.01em] whitespace-nowrap">
                For Business
              </span>
            </motion.div>

            {/* Step Boxes */}
            <div className="flex flex-col gap-[30px] lg:gap-[37px] w-full items-center relative z-[2]">
              {businessSteps.map((step, idx) => {
                const IconComponent = step.icon
                return (
                  <motion.div
                    key={step.label}
                    className="w-full h-[66px] lg:h-[73px] px-[15px] flex items-center gap-3.5 bg-white rounded-[12px] border border-[#E7E5E4] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.3)] transition-shadow duration-200 box-border"
                    custom={idx}
                    variants={stepBoxVariants}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                  >
                    <div
                      className={`w-[54px] h-[54px] rounded-[10px] bg-[#F7F5F2] border border-[#ECE8E2] flex items-center justify-center shrink-0 ${step.variant === 'green' ? 'text-[#22A055]' : 'text-[#D97742]'
                        }`}
                    >
                      <IconComponent size={26} strokeWidth={1.8} />
                    </div>
                    <span className="flex-1 text-center font-makira font-semibold text-[18px] lg:text-[21px] text-[#0A1B37] leading-[1.25]">
                      {step.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: For Talent */}
          <div className="relative flex flex-col items-center w-full max-w-[340px] sm:max-w-[320px] lg:max-w-[365px] lg:w-[365px]">
            {/* Spine Connector */}
            <motion.div
              className="absolute top-[60px] bottom-[36px] left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-white/55 z-[1]"
              variants={spineVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            />

            {/* Header Card */}
            <motion.div
              className="relative z-[2] w-full sm:w-[250px] lg:w-[270px] h-[72px] lg:h-[80px] px-3.5 pl-3 flex items-center justify-center sm:justify-start gap-3.5 bg-white rounded-[12px] border border-white/95 shadow-[0_8px_22px_rgba(0,0,0,0.3)] mb-11 lg:mb-[56px] box-border"
              variants={headerCardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <div className="w-[56px] h-[56px] rounded-[8px] overflow-hidden bg-[#F1F5F9] shrink-0">
                <img
                  src={mascotStudentImg}
                  alt="Student avatar"
                  className="w-full h-full object-cover block"
                />
              </div>
              <span className="font-makira font-bold text-[22px] lg:text-[26px] text-[#0A1B37] tracking-[-0.01em] whitespace-nowrap uppercase">
                FOR TALENT
              </span>
            </motion.div>

            {/* Step Boxes */}
            <div className="flex flex-col gap-[30px] lg:gap-[37px] w-full items-center relative z-[2]">
              {studentSteps.map((step, idx) => {
                const IconComponent = step.icon
                return (
                  <motion.div
                    key={step.label}
                    className="w-full h-[66px] lg:h-[73px] px-[15px] flex items-center gap-3.5 bg-white rounded-[12px] border border-[#E7E5E4] shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.3)] transition-shadow duration-200 box-border"
                    custom={idx}
                    variants={stepBoxVariants}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                  >
                    <div
                      className={`w-[54px] h-[54px] rounded-[10px] bg-[#F7F5F2] border border-[#ECE8E2] flex items-center justify-center shrink-0 ${step.variant === 'green' ? 'text-[#22A055]' : 'text-[#D97742]'
                        }`}
                    >
                      <IconComponent size={26} strokeWidth={1.8} />
                    </div>
                    <span className="flex-1 text-center font-makira font-semibold text-[18px] lg:text-[21px] text-[#0A1B37] leading-[1.25]">
                      {step.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
