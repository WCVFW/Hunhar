import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'

import slide1 from '../../assets/image copy 5.png'
import slide2 from '../../assets/skills_slide_2.jpg'
import slide3 from '../../assets/skills_slide_3.jpg'
import slide4 from '../../assets/skills_slide_4.jpg'

interface Slide {
  id: number
  image: string
  alt: string
  category: string
}

const slides: Slide[] = [
  {
    id: 1,
    image: slide1,
    alt: 'Creative Design & Brand Campaign',
    category: 'Brand Strategy & Creative Direction',
  },
  {
    id: 2,
    image: slide2,
    alt: 'Tech & Fullstack Engineering',
    category: 'Web & App Development',
  },
  {
    id: 3,
    image: slide3,
    alt: 'Digital Marketing & Content Production',
    category: 'Content Creation & Growth Marketing',
  },
  {
    id: 4,
    image: slide4,
    alt: 'UI/UX & Product Design',
    category: 'UI/UX Design & Prototyping',
  },
]

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.04,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 280, damping: 32 },
      opacity: { duration: 0.45 },
      scale: { duration: 0.6 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: 'spring', stiffness: 280, damping: 32 },
      opacity: { duration: 0.35 },
    },
  }),
}

interface SkillsShowcaseProps {
  onOpenSignup?: () => void
}

export default function SkillsShowcase({ onOpenSignup }: SkillsShowcaseProps) {
  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0])
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevIndex]) => {
      let nextIndex = prevIndex + newDirection
      if (nextIndex < 0) nextIndex = slides.length - 1
      if (nextIndex >= slides.length) nextIndex = 0
      return [nextIndex, newDirection]
    })
  }, [])

  const goToSlide = (idx: number) => {
    setPage(([prevIndex]) => [idx, idx > prevIndex ? 1 : -1])
  }

  // Auto-play slides every 4.5 seconds when not hovered
  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      paginate(1)
    }, 4500)
    return () => clearInterval(timer)
  }, [isHovered, paginate])

  const activeSlide = slides[currentIndex]

  return (
    <section
      id="skills-place"
      className="relative overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] px-3 py-[50px] min-[541px]:px-4 min-[541px]:py-[70px] min-[861px]:px-6 min-[861px]:py-[100px]"
    >
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-stretch gap-6 min-[861px]:grid-cols-[360px_1fr] min-[861px]:gap-5 min-[1025px]:grid-cols-[400px_1fr] min-[1025px]:gap-7">

        {/* LEFT CARD: Dark Navy Brand Card */}
        <motion.div
          className="relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#08182B] px-5 py-[34px] shadow-[0_20px_45px_rgba(8,24,43,0.28)] min-[541px]:rounded-[28px] min-[541px]:px-7 min-[541px]:py-10 min-[861px]:min-h-[480px] min-[861px]:rounded-[36px] min-[861px]:px-8 min-[861px]:pb-9 min-[861px]:pt-11 min-[1025px]:min-h-[520px] min-[1025px]:px-11 min-[1025px]:pb-12 min-[1025px]:pt-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Subtle decorative curved pattern in background */}
          <svg
            className="pointer-events-none absolute left-0 top-0 z-[1] h-full w-full opacity-[0.15]"
            viewBox="0 0 400 520"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-40,120 Q180,80 260,260 T500,380"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
            />
            <path
              d="M-80,240 Q120,200 220,380 T460,540"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <circle
              cx="320"
              cy="160"
              r="140"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </svg>

          <div className="relative z-[2]">
            <h2 className="m-0 font-['Makira',sans-serif] text-[length:clamp(2rem,8vw,2.4rem)] font-extrabold leading-[1.14] tracking-[-0.02em] text-white min-[541px]:text-[length:clamp(2.4rem,3.8vw,3.4rem)]">
              Let your skills
              <br />
              Find their
              <br />
              Place.
            </h2>
            <p className="mb-0 mt-6 max-w-[320px] font-['Manrope',sans-serif] text-sm font-medium leading-[1.65] text-[#94A3B8] min-[541px]:text-[15px]">
              hunhar.in connects ambitious freelancers with real projects, real
              businesses, and opportunities to grow.
            </p>
          </div>

          <div className="relative z-[2] mt-10">
            {onOpenSignup ? (
              <button
                type="button"
                onClick={onOpenSignup}
                className="group inline-flex cursor-pointer items-center gap-[14px] rounded-full border-none bg-white py-1.5 pl-[26px] pr-2 no-underline shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition-[transform,box-shadow] duration-[250ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(192,107,62,0.35)]"
              >
                <span className="font-['Makira',sans-serif] text-sm font-extrabold uppercase tracking-[0.04em] text-[#C06B3E]">
                  START HERE
                </span>
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#C06B3E] text-white transition-[transform,background-color] duration-[250ms] ease-in-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-[#a8572e]">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                </div>
              </button>
            ) : (
              <a
                href="#register"
                className="group inline-flex cursor-pointer items-center gap-[14px] rounded-full border-none bg-white py-1.5 pl-[26px] pr-2 no-underline shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition-[transform,box-shadow] duration-[250ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(192,107,62,0.35)]"
              >
                <span className="font-['Makira',sans-serif] text-sm font-extrabold uppercase tracking-[0.04em] text-[#C06B3E]">
                  START HERE
                </span>
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#C06B3E] text-white transition-[transform,background-color] duration-[250ms] ease-in-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-[#a8572e]">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                </div>
              </a>
            )}
          </div>
        </motion.div>

        {/* RIGHT CARD: Image Slider / Carousel */}
        <motion.div
          className="group/slider relative h-[320px] overflow-hidden rounded-[24px] bg-[#0B1E38] shadow-[0_20px_45px_rgba(10,27,55,0.16)] min-[541px]:h-[380px] min-[541px]:rounded-[28px] min-[861px]:h-auto min-[861px]:min-h-[480px] min-[861px]:rounded-[36px] min-[1025px]:min-h-[520px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative h-full w-full">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeSlide.id}
                className="absolute inset-0 h-full w-full"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <img
                  src={activeSlide.image}
                  alt={activeSlide.alt}
                  className="block h-full w-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.15)_70%,rgba(0,0,0,0.45)_100%)]" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide Category Tag (hidden on small mobile) */}
          <div className="absolute bottom-5 left-5 z-10 hidden items-center gap-2.5 rounded-[14px] border border-white/20 bg-[rgba(11,30,56,0.75)] px-[18px] py-2 text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-[12px] min-[541px]:flex min-[861px]:bottom-7 min-[861px]:left-8">
            <span className="h-2 w-2 rounded-full bg-[#C06B3E] shadow-[0_0_8px_#C06B3E]" />
            <span className="font-['Manrope',sans-serif] text-[13px] font-bold tracking-[0.02em] text-white">
              {activeSlide.category}
            </span>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            className="absolute left-5 top-1/2 z-[15] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/95 bg-white/90 text-[#0A1B37] opacity-[0.85] shadow-[0_6px_20px_rgba(0,0,0,0.2)] backdrop-blur-[8px] transition-[opacity,transform,background-color,color] duration-200 hover:scale-[1.08] hover:bg-white hover:text-[#C06B3E] min-[861px]:opacity-0 min-[861px]:group-hover/slider:opacity-100"
            onClick={() => paginate(-1)}
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="absolute right-5 top-1/2 z-[15] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/95 bg-white/90 text-[#0A1B37] opacity-[0.85] shadow-[0_6px_20px_rgba(0,0,0,0.2)] backdrop-blur-[8px] transition-[opacity,transform,background-color,color] duration-200 hover:scale-[1.08] hover:bg-white hover:text-[#C06B3E] min-[861px]:opacity-0 min-[861px]:group-hover/slider:opacity-100"
            onClick={() => paginate(1)}
            aria-label="Next slide"
          >
            <ChevronRight size={22} strokeWidth={2.4} />
          </button>

          {/* Pagination Indicators */}
          <div className="absolute bottom-5 right-5 z-[15] flex items-center gap-2 rounded-full border border-white/[0.18] bg-[rgba(11,30,56,0.65)] px-3.5 py-2 backdrop-blur-[10px] min-[861px]:bottom-7 min-[861px]:right-8">
            {slides.map((slide, idx) => (
              <button
                type="button"
                key={slide.id}
                className={`h-2 cursor-pointer rounded-full border-none p-0 transition-all duration-300 ${idx === currentIndex
                    ? 'w-[22px] bg-[#C06B3E] shadow-[0_0_10px_rgba(192,107,62,0.6)]'
                    : 'w-2 bg-white/40'
                  }`}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}