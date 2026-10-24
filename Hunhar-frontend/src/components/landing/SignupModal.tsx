import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Code2 } from 'lucide-react'

import hunharLogo from '../../assets/hunhar-Black.svg'
import mascotHire from '../../assets/Hire talent.png'
import mascotFind from '../../assets/Find work.png'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
}

type Role = 'client' | 'freelancer'

const options: {
  role: Role
  title: string
  subtitle: string
  Icon: typeof Search
}[] = [
    { role: 'client', title: 'Hire talent', subtitle: 'I am a client', Icon: Search },
    { role: 'freelancer', title: 'Find work', subtitle: 'I am a freelancer', Icon: Code2 },
  ]

const mascots: Record<Role, { src: string; alt: string }> = {
  client: { src: mascotHire, alt: 'Wolf mascot holding a briefcase' },
  freelancer: { src: mascotFind, alt: 'Wolf mascot holding a laptop' },
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps): React.JSX.Element {
  // Which mascot is showing (changes on hover / focus)
  const [activeRole, setActiveRole] = useState<Role>('client')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  const handleNavigate = (role: Role) => {
    onClose()
    window.location.href = `/signup?role=${role}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 my-auto w-full max-w-[430px]"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute -right-3 -top-3 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-[#0F1B3D] shadow-xl transition-all duration-200 hover:scale-105 hover:bg-[#C06B3E] hover:text-white"
              aria-label="Close modal"
            >
              <X size={18} strokeWidth={2.4} />
            </button>

            {/* Card */}
            <div
              className="relative overflow-hidden rounded-[28px] border border-[#E8DFD3] bg-[#F4EFE6] shadow-2xl"
              style={{
                backgroundImage: 'radial-gradient(rgba(15, 27, 61, 0.08) 1.2px, transparent 1.2px)',
                backgroundSize: '20px 20px',
              }}
            >
              {/* Header: beige curved banner + logo */}
              <div className="flex h-[104px] items-center justify-center bg-[#EBD9C6] [border-radius:0_0_50%_50%/0_0_30px_30px]">
                <img
                  src={hunharLogo}
                  alt="Hunhar Logo"
                  className="block h-10 w-auto object-contain"
                />
              </div>

              {/* Middle: heading + mascot */}
              <div className="relative min-h-[200px] px-6 pt-5">
                <div className="relative z-10 max-w-[48%]">
                  <h3
                    id="signup-modal-title"
                    className="m-0 font-makira text-[30px] font-extrabold leading-[1.08] tracking-[-0.01em]"
                  >
                    <span className="block text-[#0F1B3D]">Select</span>
                    <span className="block text-[#C06B3E]">Domain</span>
                  </h3>

                  <div className="mb-3 mt-2.5 h-[2.5px] w-12 rounded-full bg-[#0F1B3D]" />

                  <p className="m-0 max-w-[150px] font-manrope text-[13px] font-medium leading-[1.4] text-[#64748B]">
                    Are you looking for IT or Non IT?
                  </p>
                </div>

                {/* Mascots: both stacked, crossfade on hover */}
                <div className="pointer-events-none absolute bottom-0 right-3 h-[200px] w-[200px] select-none">
                  {options.map(({ role }) => {
                    const isActive = activeRole === role
                    return (
                      <img
                        key={role}
                        src={mascots[role].src}
                        alt={mascots[role].alt}
                        className={`absolute bottom-0 right-0 h-full w-full object-contain object-bottom transition-all duration-300 ease-out ${isActive
                            ? 'translate-x-0 scale-100 opacity-100'
                            : 'translate-x-2 scale-95 opacity-0'
                          }`}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Bottom: action buttons */}
              <div className="relative z-10 grid grid-cols-2 gap-3 p-6 pt-4">
                {options.map(({ role, title, subtitle, Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleNavigate(role)}
                    onMouseEnter={() => setActiveRole(role)}
                    onFocus={() => setActiveRole(role)}
                    className={`group flex cursor-pointer flex-col items-start rounded-[16px] border p-3.5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#C06B3E] hover:bg-white hover:shadow-[0_10px_24px_-8px_rgba(192,107,62,0.35)] focus-visible:-translate-y-1 focus-visible:border-[#C06B3E] focus-visible:bg-white focus-visible:outline-none ${activeRole === role
                        ? 'border-[#C06B3E]/60 bg-white/80'
                        : 'border-[#DDD4C5] bg-[#F7F3EB]/90'
                      }`}
                  >
                    <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                      <Icon size={15} strokeWidth={2.4} />
                    </span>
                    <span className="font-makira text-[15px] font-bold leading-snug text-[#0F1B3D]">
                      {title}
                    </span>
                    <span className="mt-0.5 font-manrope text-[12px] font-normal text-[#64748B]">
                      {subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}