import React from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  Clock,
  Briefcase,
  TrendingUp,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'

interface BidItem {
  id: string
  title: string
  budget: string
  status: 'Under Review' | 'Shortlisted' | 'Awaiting'
}

const recentBids: BidItem[] = [
  {
    id: '1',
    title: 'Mobile Banking App',
    budget: '$3,200',
    status: 'Under Review',
  },
  {
    id: '2',
    title: 'Portfolio Website',
    budget: '$650',
    status: 'Shortlisted',
  },
  {
    id: '3',
    title: 'SaaS Landing Page',
    budget: '$1,100',
    status: 'Awaiting',
  },
]

interface DeadlineItem {
  id: string
  title: string
  date: string
  daysLeft: string
}

const upcomingDeadlines: DeadlineItem[] = [
  {
    id: '1',
    title: 'E-Commerce App',
    date: 'Aug 28',
    daysLeft: '7d left',
  },
  {
    id: '2',
    title: 'Dashboard UI',
    date: 'Sep 5',
    daysLeft: '15d left',
  },
  {
    id: '3',
    title: 'Brand Identity',
    date: 'Sep 12',
    daysLeft: '22d left',
  },
]

export default function ClientDashboardPage(): React.JSX.Element {
  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching Hunhar Design System */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* 1. Header Welcome Bar & Create Project CTA */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#F5F2ED] pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#C06B3E]">
              Good afternoon, Alex.
            </h1>
            <p className="mt-1 font-manrope text-[13px] text-[#7A7065]">
              Here's what's happening with your projects today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 font-manrope text-[13px] font-medium text-[#7A7065]">
              <CalendarIcon size={15} className="text-[#96897A]" />
              <span>Wednesday, September 10, 2026</span>
            </div>

            <Link
              to="/client/create-project"
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#C06B3E] px-5 py-2.5 font-manrope text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.5)] transition-all hover:bg-[#A95A30] active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Project</span>
            </Link>
          </div>
        </div>

        {/* 2. Top Row: Project Overview (Left) + Project Tracking (Right) */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Project Overview Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              {/* Top row: Title + ACTIVE status */}
              <div className="flex items-center justify-between">
                <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Project Overview
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  ACTIVE
                </span>
              </div>

              {/* Mascot Banner Artwork matching screenshot */}
              <div className="relative mt-4 h-[180px] sm:h-[210px] w-full overflow-hidden rounded-[20px] bg-[#E8DDD0]">
                <img
                  src={cardDeskMascot}
                  alt="Brand Identity Project"
                  className="h-full w-full object-cover select-none"
                />
              </div>

              {/* Project Details */}
              <div className="mt-5">
                <h3 className="font-manrope text-[18px] font-extrabold text-[#08182B]">
                  Brand Identity
                </h3>
                <p className="mt-0.5 font-manrope text-[13px] text-[#7A7065]">
                  Assigned to <span className="font-semibold text-[#08182B]">Arun Kumar</span>
                </p>

                {/* Deadline & Phase */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#C06B3E]">
                    <Clock size={15} />
                    <span>Deadline</span>
                  </div>
                  <span className="font-manrope text-[13px] font-bold text-[#08182B]">
                    Aug 28, 2026
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[13px] text-[#7A7065]">Current Phase</span>
                  <span className="rounded-[8px] border border-[#DEBBA5] bg-[#FBF8F4] px-2.5 py-0.5 text-[11.5px] font-bold text-[#C06B3E]">
                    Design
                  </span>
                </div>

                {/* Completion Progress Bar */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[12.5px] font-medium text-[#7A7065]">
                    <span>Completion</span>
                    <span className="font-bold text-[#C06B3E]">65%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]"
                      style={{ width: '65%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Open Project CTA Button */}
            <Link
              to="/client/projects"
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#C06B3E] font-manrope text-[13.5px] font-bold text-white shadow-xs transition-all hover:bg-[#A95A30] active:scale-98"
            >
              <span>Open Project</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Right: Project Tracking Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                Project Tracking
              </h2>

              {/* Box 1: On Track (65%) */}
              <div className="mt-4 flex min-h-[76px] items-center justify-between rounded-[18px] border border-[#DEBBA5] bg-[#FAF6F1] px-5 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EFE5DB] text-[#C06B3E]">
                    <TrendingUp size={18} strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-manrope text-[14.5px] font-bold leading-snug text-[#C06B3E]">
                      On Track
                    </span>
                    <span className="mt-0.5 font-manrope text-[12px] text-[#7A7065]">
                      Brand Identity · Phase 2 of 5
                    </span>
                  </div>
                </div>
                <span className="font-manrope text-[26px] font-extrabold leading-none text-[#C06B3E]">
                  65%
                </span>
              </div>

              {/* Box 2: ACTIVE PHASE */}
              <div className="mt-3.5 flex min-h-[82px] flex-col justify-center rounded-[18px] border border-[#DEBBA5] bg-[#FAF6F1] px-5 py-3.5">
                <span className="font-manrope text-[10px] font-extrabold tracking-wider text-[#C06B3E] uppercase">
                  ⚡ ACTIVE PHASE
                </span>
                <h4 className="mt-1 font-manrope text-[14.5px] font-bold leading-snug text-[#08182B]">
                  Design — Logo Concepts
                </h4>
                <p className="mt-1 font-manrope text-[12px] text-[#7A7065]">
                  3 of 5 tasks complete · Due Aug 22
                </p>
              </div>

              {/* Weekly Tasks Completed Bar Graph matching screenshot */}
              <div className="mt-5">
                <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
                  TASKS COMPLETED / DAY (THIS WEEK)
                </span>

                {/* Bar visualization */}
                <div className="mt-3.5 flex items-end justify-between gap-2 px-1">
                  {/* Mon */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#C5A880] h-[30px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">M</span>
                  </div>
                  {/* Tue */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#C5A880] h-[40px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">T</span>
                  </div>
                  {/* Wed */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#C5A880] h-[15px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">W</span>
                  </div>
                  {/* Thu */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#C5A880] h-[55px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">T</span>
                  </div>
                  {/* Fri */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#C5A880] h-[26px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">F</span>
                  </div>
                  {/* Sat */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#C5A880] h-[16px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">S</span>
                  </div>
                  {/* Sun */}
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="w-full rounded-[4px] bg-[#CBD5E1] h-[8px]" />
                    <span className="text-[11px] font-semibold text-[#8C9BA8]">S</span>
                  </div>
                </div>
              </div>
            </div>

            {/* View Full Tracking Dark Button matching screenshot */}
            <Link
              to="/client/projects"
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0A1629] font-manrope text-[13.5px] font-bold text-white shadow-xs transition-all hover:bg-[#122340] active:scale-98"
            >
              <span>View Full Tracking</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* 3. Bottom Row: RECENT BIDS (Left) + UPCOMING DEADLINES (Right) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Recent Bids Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-3.5">
                <span className="font-manrope text-[11px] font-bold tracking-wider text-[#8C9BA8] uppercase">
                  RECENT BIDS
                </span>
                <Link
                  to="/client/projects"
                  className="flex items-center gap-1 text-[12px] font-bold text-[#08182B] hover:text-[#C06B3E]"
                >
                  <span>All bids</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* List */}
              <div className="mt-4 flex flex-col space-y-3.5">
                {recentBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between rounded-[14px] border border-[#F0ECE6] bg-[#FFFFFF] p-3.5 transition-all hover:border-[#DEBBA5]"
                  >
                    <div className="flex flex-col">
                      <span className="font-manrope text-[13.5px] font-bold text-[#08182B]">
                        {bid.title}
                      </span>
                      <span className="font-manrope text-[12px] font-semibold text-[#7A7065]">
                        {bid.budget}
                      </span>
                    </div>

                    <div>
                      {bid.status === 'Under Review' && (
                        <span className="rounded-full bg-[#FEF5E7] px-2.5 py-0.5 text-[11px] font-bold text-[#D97706]">
                          Under Review
                        </span>
                      )}
                      {bid.status === 'Shortlisted' && (
                        <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#4F46E5]">
                          Shortlisted
                        </span>
                      )}
                      {bid.status === 'Awaiting' && (
                        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">
                          Awaiting
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Card (lg:col-span-6) */}
          <div className="flex flex-col justify-between rounded-[22px] border border-[#F2ECE6] bg-white p-6 lg:col-span-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-3.5">
                <span className="font-manrope text-[11px] font-bold tracking-wider text-[#8C9BA8] uppercase">
                  UPCOMING DEADLINES
                </span>
                <Link
                  to="/client/calendar"
                  className="flex items-center gap-1 text-[12px] font-bold text-[#08182B] hover:text-[#C06B3E]"
                >
                  <span>View all</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* List */}
              <div className="mt-4 flex flex-col space-y-3.5">
                {upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[14px] border border-[#F0ECE6] bg-[#FFFFFF] p-3.5 transition-all hover:border-[#DEBBA5]"
                  >
                    <div className="flex flex-col">
                      <span className="font-manrope text-[13.5px] font-bold text-[#08182B]">
                        {item.title}
                      </span>
                      <span className="font-manrope text-[12px] text-[#8C9BA8]">
                        {item.date}
                      </span>
                    </div>

                    <div>
                      <span className="rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-[11px] font-bold text-[#EF4444]">
                        {item.daysLeft}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
