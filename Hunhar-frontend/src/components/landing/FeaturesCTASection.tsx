import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Import the 12 complete full-illustration cards from FEATURE SECTION CTA
import certifiateImg from '../../assets/FEATURE SECTION CTA/CERTIFIATE.png'
import clientImg from '../../assets/FEATURE SECTION CTA/CLIENT.png'
import dataImg from '../../assets/FEATURE SECTION CTA/DATA.png'
import friendsImg from '../../assets/FEATURE SECTION CTA/FRIENDS.png'
import jobsImg from '../../assets/FEATURE SECTION CTA/JOBS.png'
import modeImg from '../../assets/FEATURE SECTION CTA/MODE.png'
import msgImg from '../../assets/FEATURE SECTION CTA/MSG.png'
import oneImg from '../../assets/FEATURE SECTION CTA/ONE.png'
import paymentImg from '../../assets/FEATURE SECTION CTA/PAYMENT.png'
import typeImg from '../../assets/FEATURE SECTION CTA/TYPE.png'
import verifyImg from '../../assets/FEATURE SECTION CTA/VERIFY.png'
import workImg from '../../assets/FEATURE SECTION CTA/WORK.png'

interface FeaturesCTASectionProps {
  onOpenSignup?: () => void
}

interface CardItem {
  id: number
  img: string
  alt: string
  left: string
  top: string
  width: string
}

// 8 Columns spread edge-to-edge across the full page (width 11.2% each)
const cards: CardItem[] = [
  // Col 1 (Far Left)
  { id: 1, img: modeImg, alt: 'Student on floor', left: '0.5%', top: '10%', width: '11.2%' },
  { id: 2, img: typeImg, alt: 'Code on laptop', left: '0.5%', top: '44%', width: '11.2%' },

  // Col 2
  { id: 3, img: paymentImg, alt: 'Phone with checkmark', left: '13%', top: '2%', width: '11.2%' },
  { id: 4, img: clientImg, alt: 'Handshake deal confirmed', left: '13%', top: '36%', width: '11.2%' },

  // Col 3
  { id: 5, img: msgImg, alt: 'Chat bubbles collaboration', left: '25.5%', top: '10%', width: '11.2%' },

  // Col 4
  { id: 6, img: workImg, alt: 'Video editing on laptop', left: '38%', top: '10%', width: '11.2%' },

  // Col 5
  { id: 7, img: dataImg, alt: 'Analytics dashboard graph', left: '50.5%', top: '10%', width: '11.2%' },

  // Col 6
  { id: 8, img: certifiateImg, alt: 'Student with certificate', left: '63%', top: '10%', width: '11.2%' },

  // Col 7
  { id: 9, img: oneImg, alt: 'Desk with coffee', left: '75.5%', top: '2%', width: '11.2%' },
  { id: 10, img: verifyImg, alt: '5-star customer review', left: '75.5%', top: '36%', width: '11.2%' },

  // Col 8 (Far Right)
  { id: 11, img: jobsImg, alt: 'Pointing up surrounded by icons', left: '88%', top: '10%', width: '11.2%' },
  { id: 12, img: friendsImg, alt: 'Three students team', left: '88%', top: '44%', width: '11.2%' },
]

export default function FeaturesCTASection({ onOpenSignup }: FeaturesCTASectionProps): React.JSX.Element {
  const handleSignup = (e: React.MouseEvent) => {
    if (onOpenSignup) {
      e.preventDefault()
      onOpenSignup()
    }
  }

  return (
    <section
      id="cta"
      className="relative w-full overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] pt-8 sm:pt-10 pb-16 sm:pb-20"
      aria-label="Features CTA Section"
    >
      <div className="relative w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================================
            DESKTOP / TABLET ARCH GRID (Spanning full page width)
           ========================================================= */}
        <div className="hidden md:block relative w-full aspect-[1024/440] mx-auto">
          {/* The 12 floating cards: full illustration visible, object-cover, centered */}
          {cards.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ y: -4, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              style={{
                left: c.left,
                top: c.top,
                width: c.width,
              }}
              className="absolute bg-white rounded-2xl p-1 shadow-[0_6px_20px_rgba(0,0,0,0.06)] border border-black/5 z-10 transition-shadow hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <img
                src={c.img}
                alt={c.alt}
                className="w-full h-auto object-cover rounded-xl block pointer-events-none select-none"
                loading="lazy"
              />
            </motion.div>
          ))}

          {/* Central Call to Action Content (Selectable & copyable text) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[55%] w-full max-w-2xl text-center z-20 flex flex-col items-center">
            {/* Heading (Selectable and copyable) */}
            <h2 className="font-makira font-medium text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-[#0A1B37] leading-tight m-0 select-text cursor-text">
              Ready to Experience the
              <br />
              Future of Freelancing?
            </h2>

            {/* Subtitle (Selectable and copyable) */}
            <p className="font-manrope text-sm sm:text-base text-[#555E6D] mt-3.5 mb-6 max-w-lg leading-relaxed select-text cursor-text">
              Join thousands of students and clients building amazing things on Hunhar.
            </p>

            {/* CTA Button (Clickable with active states) */}
            {onOpenSignup ? (
              <button
                type="button"
                onClick={handleSignup}
                className="relative z-30 group bg-terracotta hover:bg-[#AA572D] active:scale-95 text-white font-manrope font-semibold text-xs sm:text-sm tracking-wider uppercase px-7 sm:px-8 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(192,107,62,0.35)] hover:shadow-[0_10px_28px_rgba(192,107,62,0.45)] transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>GET STARTED FREE</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <a
                href="/signup"
                className="relative z-30 group bg-terracotta hover:bg-[#AA572D] active:scale-95 text-white font-manrope font-semibold text-xs sm:text-sm tracking-wider uppercase px-7 sm:px-8 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(192,107,62,0.35)] hover:shadow-[0_10px_28px_rgba(192,107,62,0.45)] transition-all duration-200 no-underline inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>GET STARTED FREE</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            )}
          </div>
        </div>

        {/* =========================================================
            MOBILE LAYOUT (Screen below md)
           ========================================================= */}
        <div className="md:hidden flex flex-col items-center">
          {/* Compact 4-col preview grid of cards */}
          <div className="grid grid-cols-4 gap-2.5 mb-8 w-full max-w-md mx-auto">
            {cards.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl p-1 shadow-xs border border-black/5 overflow-hidden"
              >
                <img
                  src={c.img}
                  alt={c.alt}
                  className="w-full h-auto object-cover rounded-lg block pointer-events-none"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Heading */}
          <h2 className="font-makira font-medium text-xl sm:text-2xl uppercase tracking-wide text-[#0A1B37] text-center leading-tight m-0 max-w-sm select-text cursor-text">
            Ready to Experience the Future of Freelancing?
          </h2>

          {/* Subtitle */}
          <p className="font-manrope text-xs sm:text-sm text-[#555E6D] text-center mt-2.5 mb-6 max-w-xs leading-relaxed select-text cursor-text">
            Join thousands of students and clients building amazing things on Hunhar.
          </p>

          {/* CTA Button */}
          {onOpenSignup ? (
            <button
              type="button"
              onClick={handleSignup}
              className="relative z-30 group bg-terracotta hover:bg-[#AA572D] active:scale-95 text-white font-manrope font-semibold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(192,107,62,0.35)] hover:shadow-[0_10px_28px_rgba(192,107,62,0.45)] transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>GET STARTED FREE</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          ) : (
            <a
              href="/signup"
              className="relative z-30 group bg-terracotta hover:bg-[#AA572D] active:scale-95 text-white font-manrope font-semibold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(192,107,62,0.35)] hover:shadow-[0_10px_28px_rgba(192,107,62,0.45)] transition-all duration-200 no-underline inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>GET STARTED FREE</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
