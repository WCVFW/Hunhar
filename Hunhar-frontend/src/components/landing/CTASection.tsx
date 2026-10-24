import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import mascotLuna from '../../assets/Leadership_luna.png'

interface CTASectionProps {
  onOpenSignup?: () => void
}

export default function CTASection({ onOpenSignup }: CTASectionProps): React.JSX.Element {
  return (
    <section className="relative w-full overflow-hidden isolate bg-gradient-to-r from-[#D4925F] via-[#C06B3E] to-[#C06B3E]" aria-label="Start Your First Project">
      {/* Background Watermark Lettermark */}
      <div className="absolute right-[6%] lg:right-[8%] top-1/2 -translate-y-1/2 font-makira text-[16rem] lg:text-[22rem] font-black text-white/10 leading-none pointer-events-none select-none z-0 tracking-tighter" aria-hidden="true">
        oa
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-12 sm:pt-14 lg:pt-0 relative flex flex-col lg:flex-row lg:items-center justify-between lg:min-h-[325px]">
        {/* Left Column: Heading, Subtitle & Buttons */}
        <motion.div
          className="relative z-10 pb-8 lg:pb-0"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <h2 className="font-makira text-2xl sm:text-4xl lg:text-5xl xl:whitespace-nowrap font-medium text-white leading-tight tracking-tight m-0 mb-3">
            Start Your First Project Today
          </h2>

          <p className="font-manrope text-base sm:text-lg xl:text-2xl xl:whitespace-nowrap font-normal text-white/95 leading-normal m-0 mb-7">
            Join thousands of students earning and businesses growing with THEUNOiA.
          </p>

          <div className="flex items-center flex-wrap gap-4">
            {onOpenSignup ? (
              <button
                type="button"
                onClick={onOpenSignup}
                className="group inline-flex items-center gap-2.5 bg-[#F5EFE6] text-terracotta hover:bg-white hover:text-[#AA572D] font-manrope text-base font-medium uppercase px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <span>POST TASK</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <a
                href="/signup?role=client"
                className="group inline-flex items-center gap-2.5 bg-[#F5EFE6] text-terracotta hover:bg-white hover:text-[#AA572D] font-manrope text-base font-medium uppercase px-4 py-3 rounded-lg no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <span>POST TASK</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            )}

            {onOpenSignup ? (
              <button
                type="button"
                onClick={onOpenSignup}
                className="group inline-flex items-center gap-2.5 bg-navy text-white hover:bg-[#11284E] font-manrope text-base font-medium uppercase px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <span>START EARNING</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <a
                href="/signup?role=freelancer"
                className="group inline-flex items-center gap-2.5 bg-navy text-white hover:bg-[#11284E] font-manrope text-base font-medium uppercase px-4 py-3 rounded-lg no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <span>START EARNING</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            )}
          </div>
        </motion.div>

        {/* Right Column: Mascot Character */}
        <motion.div
          className="relative z-10 flex items-end justify-center mt-2 lg:mt-0 lg:self-end ml-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, delay: 0.15, ease: 'easeOut' }}
        >
          <img
            src={mascotLuna}
            alt="Luna mascot"
            className="w-[220px] sm:w-[250px] lg:w-auto lg:h-[300px] object-contain pointer-events-none select-none block drop-shadow-md"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  )
}
