import { ArrowUpRight } from 'lucide-react'
import mascotBusiness from '../../assets/mascot_business.png'
import mascotStudent from '../../assets/mascot_student.png'

const cards = [
  {
    badge: 'I NEED WORK DONE',
    title: ['Hire students.', 'Get it done.'],
    description:
      'Post a task, receive bids from skilled students and get your work done affordably.',
    mascot: mascotBusiness,
    mascotAlt: 'Client mascot in business suit',
    href: '/signup?role=client',
    cta: 'Post a Task',
  },
  {
    badge: 'I WANT TO EARN',
    title: ['Find work.', 'Earn money.'],
    description:
      'Create your profile, showcase your skills, bid on real work and get paid.',
    mascot: mascotStudent,
    mascotAlt: 'Student mascot Luna in suit',
    href: '/signup?role=freelancer',
    cta: 'Create Profile',
  },
]

interface TwoSidesProps {
  onOpenSignup?: () => void
}

export default function TwoSides({ onOpenSignup }: TwoSidesProps) {
  return (
    <section className="relative overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">

        {/* Section Heading & Subtitle */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <h2 className="m-0 font-[family-name:var(--font-makira)] text-2xl font-medium uppercase tracking-wide text-[color:var(--color-terracotta,#C06B3E)] sm:text-3xl md:text-4xl">
            TWO SIDES. ONE OPPORTUNITY
          </h2>
          <p className="mt-3 font-[family-name:var(--font-manrope)] text-sm leading-relaxed text-[#404040] sm:text-base">
            Great work happens when the right talent meets the right opportunity.
            <br className="hidden sm:inline" />{' '}
            <strong className="font-bold text-[color:var(--color-navy,#0F1B3D)]">HUNHAR</strong>{' '}
            makes that connection simple.
          </p>
        </div>

        {/* Two Opportunity Cards Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {cards.map((card) => (
            <div
              key={card.badge}
              className="relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[28px] border border-[#EBCDBB] bg-white p-0 transition-shadow duration-300 hover:shadow-[0_8px_24px_-8px_rgba(192,107,62,0.18)] sm:min-h-[380px] sm:rounded-[32px]"
            >
              {/* Top Text Content */}
              <div className="relative z-20 px-6 pt-6 sm:px-8 sm:pt-8">
                {/* Badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EFDCCF] bg-white px-3.5 py-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--color-terracotta,#C06B3E)]" />
                  <span className="font-[family-name:var(--font-manrope)] text-xs font-semibold uppercase tracking-wider text-[color:var(--color-terracotta,#C06B3E)]">
                    {card.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="m-0 font-[family-name:var(--font-makira)] text-2xl font-black leading-[1.1] tracking-tight text-[color:var(--color-navy,#0F1B3D)] sm:text-3xl lg:text-[34px]">
                  {card.title[0]}
                  <br />
                  {card.title[1]}
                </h3>

                {/* Description */}
                <p className="mb-0 mt-4 max-w-[13.5rem] font-[family-name:var(--font-manrope)] text-[13px] leading-[1.7] text-neutral-800 sm:max-w-[15rem] sm:text-[15px]">
                  {card.description}
                </p>
              </div>

              {/* Mascot Image */}
              <div className="pointer-events-none absolute bottom-[4.25rem] right-2 z-10 w-[46%] max-w-[15.5rem] select-none">
                <img
                  src={card.mascot}
                  alt={card.mascotAlt}
                  className="block h-auto w-full object-contain mix-blend-multiply"
                  loading="lazy"
                />
              </div>

              {/* Bottom Action Button */}
              {onOpenSignup ? (
                <button
                  type="button"
                  onClick={onOpenSignup}
                  className="group relative z-20 mx-2 mb-2 mt-6 flex h-16 w-[calc(100%-1rem)] cursor-pointer items-center justify-between rounded-[20px] border border-[rgba(229,229,229,0.9)] bg-white px-5 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_6px_18px_-4px_rgba(0,0,0,0.18)] focus-visible:shadow-[0_6px_18px_-4px_rgba(0,0,0,0.18)] sm:rounded-[22px] sm:px-6"
                >
                  {/* Text: navy base + terracotta overlay sweeping in from the left */}
                  <span className="relative inline-block font-[family-name:var(--font-makira)] text-sm font-bold text-[color:var(--color-navy,#0F1B3D)] sm:text-base">
                    {card.cta}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 text-[color:var(--color-terracotta,#C06B3E)] [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:[clip-path:inset(0_0_0_0)]"
                    >
                      {card.cta}
                    </span>
                  </span>

                  {/* Arrow circle */}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(229,229,229,0.8)] text-[#404040] transition-[background-color,color] delay-200 duration-300 group-hover:bg-[color:var(--color-terracotta,#C06B3E)] group-hover:text-white group-focus-visible:bg-[color:var(--color-terracotta,#C06B3E)] group-focus-visible:text-white sm:h-9 sm:w-9">
                    <ArrowUpRight className="h-4 w-4 transition-transform delay-150 duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-45 group-focus-visible:rotate-45 sm:h-[18px] sm:w-[18px]" />
                  </span>
                </button>
              ) : (
                <a
                  href={card.href}
                  className="group relative z-20 mx-2 mb-2 mt-6 flex h-16 items-center justify-between rounded-[20px] border border-[rgba(229,229,229,0.9)] bg-white px-5 no-underline shadow-[0_4px_14px_-4px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_6px_18px_-4px_rgba(0,0,0,0.18)] focus-visible:shadow-[0_6px_18px_-4px_rgba(0,0,0,0.18)] sm:rounded-[22px] sm:px-6"
                >
                  {/* Text: navy base + terracotta overlay sweeping in from the left */}
                  <span className="relative inline-block font-[family-name:var(--font-makira)] text-sm font-bold text-[color:var(--color-navy,#0F1B3D)] sm:text-base">
                    {card.cta}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 text-[color:var(--color-terracotta,#C06B3E)] [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:[clip-path:inset(0_0_0_0)]"
                    >
                      {card.cta}
                    </span>
                  </span>

                  {/* Arrow circle */}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(229,229,229,0.8)] text-[#404040] transition-[background-color,color] delay-200 duration-300 group-hover:bg-[color:var(--color-terracotta,#C06B3E)] group-hover:text-white group-focus-visible:bg-[color:var(--color-terracotta,#C06B3E)] group-focus-visible:text-white sm:h-9 sm:w-9">
                    <ArrowUpRight className="h-4 w-4 transition-transform delay-150 duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-45 group-focus-visible:rotate-45 sm:h-[18px] sm:w-[18px]" />
                  </span>
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}