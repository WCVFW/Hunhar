import React from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Clock,
  ChevronRight,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'

interface ActiveProjectCard {
  id: string
  category: string
  timeAgo: string
  title: string
  deadline: string
  client: string
  description: string
  budget: string
  tags: string[]
  status: string
}

const activeProjectsList: ActiveProjectCard[] = [
  {
    id: '1',
    category: 'MOTION DESIGN',
    timeAgo: '2h ago',
    title: 'Motion Graphics Package',
    deadline: 'Sep 05',
    client: 'Aeris Creative',
    description:
      'We need a set of animated graphics for a product launch campaign. We need a set of animated graphics for a product launch campaign.',
    budget: '₹1,800 – ₹2,400',
    tags: ['After Effects', 'Motion Design', 'Premiere Pro'],
    status: 'Bid Open',
  },
  {
    id: '2',
    category: 'MOTION DESIGN',
    timeAgo: '2h ago',
    title: 'Motion Graphics Package',
    deadline: 'Sep 05',
    client: 'Aeris Creative',
    description:
      'We need a set of animated graphics for a product launch campaign. We need a set of animated graphics for a product launch campaign.',
    budget: '₹1,800 – ₹2,400',
    tags: ['After Effects', 'Motion Design', 'Premiere Pro'],
    status: 'Bid Open',
  },
  {
    id: '3',
    category: 'MOTION DESIGN',
    timeAgo: '2h ago',
    title: 'Motion Graphics Package',
    deadline: 'Sep 05',
    client: 'Aeris Creative',
    description:
      'We need a set of animated graphics for a product launch campaign. We need a set of animated graphics for a product launch campaign.',
    budget: '₹1,800 – ₹2,400',
    tags: ['After Effects', 'Motion Design', 'Premiere Pro'],
    status: 'Bid Open',
  },
]

interface DeadlineItem {
  id: string
  title: string
  clientCategory: string
  date: string
}

const upcomingDeadlines: DeadlineItem[] = [
  { id: '1', title: 'Final Logo Concepts', clientCategory: 'Acme Studio • Branding', date: 'Aug 28' },
  { id: '2', title: 'Final Logo Concepts', clientCategory: 'Acme Studio • Branding', date: 'Aug 28' },
  { id: '3', title: 'Final Logo Concepts', clientCategory: 'Acme Studio • Branding', date: 'Aug 28' },
  { id: '4', title: 'Final Logo Concepts', clientCategory: 'Acme Studio • Branding', date: 'Aug 28' },
]

interface RecentBidItem {
  id: string
  title: string
  clientDate: string
  amount: string
  status: 'Shortlisted' | 'Rejected' | 'Pending'
}

const recentBids: RecentBidItem[] = [
  { id: '1', title: 'UX Audit', clientDate: 'Prisma Health • Aug 19', amount: '$950', status: 'Shortlisted' },
  { id: '2', title: 'UX Audit', clientDate: 'Prisma Health • Aug 19', amount: '$550', status: 'Rejected' },
  { id: '3', title: 'UX Audit', clientDate: 'Prisma Health • Aug 19', amount: '$450', status: 'Pending' },
  { id: '4', title: 'UX Audit', clientDate: 'Prisma Health • Aug 19', amount: '$750', status: 'Pending' },
]

export default function ActiveProjectsPage(): React.JSX.Element {
  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 sm:p-7 lg:p-8 shadow-xs font-manrope">
      <div className="flex w-full flex-col gap-6">
        {/* 1. TOP TITLE */}
        <div className="flex items-center gap-2.5 pb-2 text-[#08182B]">
          <Briefcase size={22} className="text-[#8E8376]" />
          <h1 className="font-manrope text-[20px] sm:text-[22px] font-bold text-[#08182B]">
            Active Project
          </h1>
        </div>

      {/* 2. ACTIVE PROJECTS 3-COLUMN CARDS ROW */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {activeProjectsList.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#E7DCCE] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-all hover:border-[#C06B3E]/50 hover:shadow-lg"
          >
            <div>
              {/* Header Tag + Time */}
              <div className="mb-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DACD] bg-[#FBF8F3] px-3 py-1 font-manrope text-[11px] font-bold tracking-wide text-[#9C5128]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C06B3E]" />
                  {project.category}
                </span>
                <span className="flex items-center gap-1 font-manrope text-[12px] font-medium text-[#9E9284]">
                  <Clock size={13} />
                  {project.timeAgo}
                </span>
              </div>

              {/* Project Image Banner */}
              <div className="relative mb-3.5 h-[145px] w-full overflow-hidden rounded-[14px] bg-[#E8DDD0]">
                <img
                  src={cardDeskMascot}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Title & Deadline */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                    {project.title}
                  </h4>
                  <p className="mt-0.5 text-[12px] text-[#918578]">{project.client}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-medium text-[#B8572A]">Deadline :</span>
                  <span className="font-manrope text-[12px] font-bold text-[#863D1A]">
                    {project.deadline}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-2.5 line-clamp-2 font-manrope text-[12px] leading-relaxed text-[#73685C]">
                {project.description}
              </p>

              {/* Budget */}
              <div className="mt-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A05C35]">
                  BUDGET{' '}
                </span>
                <span className="font-manrope text-[13px] font-extrabold text-[#08182B]">
                  {project.budget}
                </span>
              </div>

              {/* Skill tags */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[8px] bg-[#F5ECE1] px-2.5 py-1 font-manrope text-[11px] font-medium text-[#6F6457]"
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F5ECE1] text-[#6F6457] hover:bg-[#EBDDCF]"
                  aria-label="More tags"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Bottom Bid Status & Open Workspace Action */}
            <div className="mt-4 flex items-center justify-between border-t border-[#F2E8DC] pt-3">
              <span className="inline-flex items-center gap-1.5 font-manrope text-[12px] font-bold text-[#1F874C]">
                <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                {project.status}
              </span>

              {/* Open Workspace Link */}
              <Link
                to={`/freelancer/projects/${project.id}`}
                className="flex items-center gap-1 font-manrope text-[12px] font-extrabold text-[#08182B] transition-colors hover:text-[#C06B3E]"
              >
                Open workspace
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* 3. BOTTOM ROW: UPCOMING DEADLINES & RECENT BIDS */}
      <section className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="flex flex-col justify-between rounded-[20px] border border-[#E7DCCE] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                Upcoming Deadlines
              </h3>
              <Link
                to="/freelancer/calendar"
                className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] hover:text-[#C06B3E]"
              >
                View all <ChevronRight size={15} />
              </Link>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[14px] border border-[#EFE4D7] bg-[#FAF7F2] p-3 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F0D5C3] bg-[#FCF1E8] text-[#C06B3E]">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="font-manrope text-[13px] font-bold text-[#08182B]">
                        {item.title}
                      </h4>
                      <p className="font-manrope text-[11px] text-[#8E8376]">
                        {item.clientCategory}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#FFEAE5] px-3 py-1 font-manrope text-[11px] font-bold text-[#D34026]">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bids */}
        <div className="flex flex-col justify-between rounded-[20px] border border-[#E7DCCE] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">Recent Bids</h3>
              <Link
                to="/freelancer/projects"
                className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] hover:text-[#C06B3E]"
              >
                View all <ChevronRight size={15} />
              </Link>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {recentBids.map((bid) => {
                let badgeClass = 'bg-[#EDE9FE] text-[#7C3AED]'
                let dotClass = 'bg-[#7C3AED]'

                if (bid.status === 'Rejected') {
                  badgeClass = 'bg-[#FEE2E2] text-[#DC2626]'
                  dotClass = 'bg-[#DC2626]'
                } else if (bid.status === 'Pending') {
                  badgeClass = 'bg-[#FEF3C7] text-[#D97706]'
                  dotClass = 'bg-[#D97706]'
                }

                return (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between rounded-[14px] border border-[#EFE4D7] bg-[#FAF7F2] p-3 transition-colors hover:bg-white"
                  >
                    <div>
                      <h4 className="font-manrope text-[13px] font-bold text-[#08182B]">
                        {bid.title}
                      </h4>
                      <p className="font-manrope text-[11px] text-[#8E8376]">{bid.clientDate}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-manrope text-[13px] font-bold text-[#08182B]">
                        {bid.amount}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                        {bid.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
