import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Do I need experience to start?',
    answer:
      'No! Hunhar is built specifically to help talented students and emerging freelancers build their portfolios. Even without prior formal job experience, your coursework, class projects, and self-taught skills are enough to start bidding on tasks and earning.',
  },
  {
    id: 'faq-2',
    question: 'Is my payment safe?',
    answer:
      'Yes, 100%. Hunhar uses a secure escrow payment protection system. When a client hires you, the payment is securely held upfront in escrow. Once you submit the completed work and the client approves it, the funds are instantly released to your wallet.',
  },
  {
    id: 'faq-3',
    question: "What if the work isn't good enough?",
    answer:
      'Every project includes built-in revision rounds. Clients can request specific changes directly through the platform. If deliverables still fail to meet agreed criteria, our dedicated dispute resolution team steps in to ensure a fair outcome, including full or partial refunds.',
  },
  {
    id: 'faq-4',
    question: 'How do clients find and hire students?',
    answer:
      'Clients can post specific tasks or project scopes and receive competitive proposals from verified students within minutes. Alternatively, businesses can browse student portfolios directly and invite top talent with one click.',
  },
  {
    id: 'faq-5',
    question: 'How and when do students withdraw earnings?',
    answer:
      'Once a client approves your submitted project, your earnings are credited immediately to your Hunhar balance. You can withdraw directly to your bank account or UPI with zero hidden delay.',
  },
]

export default function FAQ(): React.JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="relative w-full py-16 sm:py-24 px-6 overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px]" id="faq" aria-label="Frequently Asked Questions">
      <div className="max-w-[820px] mx-auto">
        {/* Title */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="font-makira text-4xl sm:text-5xl font-medium text-terracotta leading-tight tracking-tight m-0 uppercase">
            FAQ
          </h2>
        </motion.div>

        {/* Accordion Cards */}
        <div className="flex flex-col gap-4 w-full" role="region" aria-label="Questions list">
          {faqData.map((item, idx) => {
            const isOpen = openId === item.id
            const questionId = `question-${item.id}`
            const answerId = `answer-${item.id}`

            return (
              <motion.div
                key={item.id}
                className={`bg-white border-[1.5px] rounded-[18px] overflow-hidden shadow-sm transition-all duration-200 ${
                  isOpen
                    ? 'border-terracotta shadow-[0_8px_22px_rgba(192,107,62,0.08)]'
                    : 'border-[#E5DAC8] hover:border-gold hover:shadow-md hover:-translate-y-0.5'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: 'easeOut' }}
              >
                <button
                  type="button"
                  id={questionId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="w-full flex items-center justify-between p-5 sm:p-6 bg-transparent border-none cursor-pointer outline-none text-left select-none gap-4 focus-visible:outline-2 focus-visible:outline-terracotta"
                  onClick={() => toggleFAQ(item.id)}
                >
                  <span
                    className={`font-makira text-base sm:text-lg font-bold leading-snug transition-colors duration-200 ${
                      isOpen ? 'text-terracotta' : 'text-navy'
                    }`}
                  >
                    {item.question}
                  </span>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-transform duration-300 ease-out ${
                      isOpen ? 'rotate-180 text-terracotta bg-terracotta/10' : 'text-navy'
                    }`}
                  >
                    <ChevronDown size={20} strokeWidth={2.4} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={answerId}
                      role="region"
                      aria-labelledby={questionId}
                      className="overflow-hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.33, 1, 0.68, 1] },
                          opacity: { duration: 0.25, delay: 0.08 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.28, ease: [0.33, 1, 0.68, 1] },
                          opacity: { duration: 0.18 },
                        },
                      }}
                    >
                      <div className="px-6 pb-5 pt-3 border-t border-[#E5DAC8]/40">
                        <p className="font-manrope text-[15px] sm:text-base font-medium text-navy/80 leading-relaxed m-0">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
