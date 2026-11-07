import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Import the 12 complete full-illustration cards
import card1 from '../../assets/cta_cards/card_1.png'
import card2 from '../../assets/cta_cards/card_2.png'
import card3 from '../../assets/cta_cards/card_3.png'
import card4 from '../../assets/cta_cards/card_4.png'
import card5 from '../../assets/cta_cards/card_5.png'
import card6 from '../../assets/cta_cards/card_6.png'
import card7 from '../../assets/cta_cards/card_7.png'
import card8 from '../../assets/cta_cards/card_8.png'
import card9 from '../../assets/cta_cards/card_9.png'
import card10 from '../../assets/cta_cards/card_10.png'
import card11 from '../../assets/cta_cards/card_11.png'
import card12 from '../../assets/cta_cards/card_12.png'

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
  { id: 1, img: card1, alt: 'Student on floor', left: '0.5%', top: '10%', width: '11.2%' },
  { id: 2, img: card2, alt: 'Code on laptop', left: '0.5%', top: '44%', width: '11.2%' },

  // Col 2
  { id: 3, img: card3, alt: 'Phone with checkmark', left: '13%', top: '2%', width: '11.2%' },
  { id: 4, img: card4, alt: 'Handshake deal confirmed', left: '13%', top: '36%', width: '11.2%' },

  // Col 3
  { id: 5, img: card5, alt: 'Chat bubbles collaboration', left: '25.5%', top: '10%', width: '11.2%' },

  // Col 4
  { id: 6, img: card6, alt: 'Video editing on laptop', left: '38%', top: '10%', width: '11.2%' },

  // Col 5
  { id: 7, img: card7, alt: 'Analytics dashboard graph', left: '50.5%', top: '10%', width: '11.2%' },

  // Col 6
  { id: 8, img: card8, alt: 'Student with certificate', left: '63%', top: '10%', width: '11.2%' },

  // Col 7
  { id: 9, img: card9, alt: 'Desk with coffee', left: '75.5%', top: '2%', width: '11.2%' },
  { id: 10, img: card10, alt: '5-star customer review', left: '75.5%', top: '36%', width: '11.2%' },

  // Col 8 (Far Right)
  { id: 11, img: card11, alt: 'Pointing up surrounded by icons', left: '88%', top: '10%', width: '11.2%' },
  { id: 12, img: card12, alt: 'Three students team', left: '88%', top: '44%', width: '11.2%' },
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
            <h2 className="font-makira semi-bold text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] text-[#0A1B37] tracking-tight leading-[1.14] m-0 select-text cursor-text">
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
                className="relative z-30 group bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-manrope font-semibold text-xs sm:text-sm tracking-wider uppercase px-7 sm:px-8 py-3.5 rounded-xl shadow-[0_6px_20px_rgba(234,88,12,0.32)] transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>GET STARTED FREE</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <a
                href="/signup"
                className="relative z-30 group bg-[#c06b3e] hover:bg-[#C2410C] active:scale-95 text-white font-manrope font-semibold text-xs sm:text-sm tracking-wider uppercase px-7 sm:px-8 py-3.5 rounded-xl shadow-[0_6px_20px_rgba(234,88,12,0.32)] transition-all duration-200 no-underline inline-flex items-center justify-center gap-2 cursor-pointer"
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
          <h2 className="font-makira font-bold text-2xl text-[#0A1B37] text-center tracking-tight leading-[1.16] m-0 max-w-sm select-text cursor-text">
            Ready to Experience the Future of Freelancing?
          </h2>

          {/* Subtitle */}
          <p className="font-manrope text-xs sm:text-sm text-[#555E6D] text-center mt-2.5 mb-6 max-w-xs leading-relaxed select-text cursor-text">
            Join thousands of students and clients building amazing things on THEUNOIA.
          </p>

          {/* CTA Button */}
          {onOpenSignup ? (
            <button
              type="button"
              onClick={handleSignup}
              className="relative z-30 group bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-manrope font-semibold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>GET STARTED FREE</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          ) : (
            <a
              href="/signup"
              className="relative z-30 group bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-manrope font-semibold text-xs tracking-wider uppercase px-8 py-3.5 rounded-xl shadow-md transition-all duration-200 no-underline inline-flex items-center justify-center gap-2 cursor-pointer"
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
