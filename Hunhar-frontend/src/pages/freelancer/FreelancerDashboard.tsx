import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react'
import quoteMascot from '../../assets/Leadership_luna.png'
import cardDeskMascot from '../../assets/Job_details_image.png'

interface StatCardProps {
  label: string
  value: string | number
  isHighlighted?: boolean
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-[#DECFBE]/90 bg-[#FBF8F3] px-3 py-4 text-center shadow-[0_2px_8px_rgba(192,107,62,0.04)] transition-all hover:border-[#C06B3E]/40 hover:shadow-md">
      <span className="font-manrope text-[11px] font-bold uppercase tracking-wider text-[#C06B3E]">
        {label}
      </span>
      <span className="mt-1 font-manrope text-[28px] font-extrabold tracking-tight text-[#C06B3E] lg:text-[32px]">
        {value}
      </span>
    </div>
  )
}

interface ProjectCardData {
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

const featuredProjects: ProjectCardData[] = [
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

export default function FreelancerDashboard(): React.JSX.Element {
  const [todoList, setTodoList] = useState([
    { id: '1', text: 'Learn something New', completed: true },
    { id: '2', text: 'Website Redesign Milestone', completed: false },
    { id: '3', text: 'Website Redesign Milestone', completed: false },
  ])
  const [newTodoText, setNewTodoText] = useState('')
  const [isAddingTodo, setIsAddingTodo] = useState(false)

  const toggleTodo = (id: string) => {
    setTodoList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    )
  }

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim()) return
    setTodoList((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newTodoText.trim(), completed: false },
    ])
    setNewTodoText('')
    setIsAddingTodo(false)
  }

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 sm:p-7 lg:p-8 shadow-xs font-manrope">
      <div className="flex w-full flex-col gap-6">
        {/* 1. WELCOME BANNER & DATE */}
        <section className="flex flex-col justify-between gap-2 border-b border-[#F0F0F0] pb-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-manrope text-[26px] font-extrabold tracking-tight text-[#C06B3E] sm:text-[30px]">
              Good afternoon, Rajshankar.M.
            </h1>
            <p className="mt-0.5 font-manrope text-[14px] text-[#786D61]">
              Here's what's happening with your work today.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium text-[#786D61]">
            <CalendarIcon size={16} className="text-[#96897A]" />
            <span>Wednesday, August 20, 2026</span>
          </div>
        </section>

        {/* 3. ROW: QUOTE BANNER + TO DO LIST + 4 STAT CARDS */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Quote Card (lg:col-span-4) - Matched to UI Design */}
          <div className="relative flex min-h-[225px] flex-col justify-between overflow-hidden rounded-[20px] border border-[#DECFBE] bg-[#EFE5DB] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] lg:col-span-4">
            {/* Subtle warm circle backdrop behind Luna (as seen in UI design 1) */}
            <div className="pointer-events-none absolute -bottom-8 right-2 h-44 w-44 rounded-full bg-[#D7A97E]/35" />

            {/* Top & Middle: Quote Mark and Heading */}
            <div className="relative z-10 max-w-[200px] sm:max-w-[215px]">
              {/* SVG Quote Icon matching UI 1 design */}
              <svg
                className="h-7 w-7 text-[#D5A885]"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M10 8c-3.3 0-6 2.7-6 6 0 3.3 2.7 6 6 6 1 0 1.9-.3 2.8-.7C11.9 22.3 9.2 24.6 6 25l-.5.1v2.9h.5c6.6 0 12-5.4 12-12 0-4.4-3.6-8-8-8zm14 0c-3.3 0-6 2.7-6 6 0 3.3 2.7 6 6 6 1 0 1.9-.3 2.8-.7-.9 3-3.6 5.3-6.8 5.7l-.5.1v2.9h.5c6.6 0 12-5.4 12-12 0-4.4-3.6-8-8-8z" />
              </svg>

              {/* Quote Heading */}
              <h2 className="mt-2 font-manrope text-[20px] font-extrabold leading-[1.22] tracking-tight text-[#C06B3E] sm:text-[21px]">
                Leadership is not a position or title. it is example and action.
              </h2>
            </div>

            {/* Author Name */}
            <div className="relative z-10 mt-4 flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#5C5248]">
              <span className="inline-block h-[1.5px] w-5 bg-[#5C5248]" />
              <span>Paulo Coelho</span>
            </div>

            {/* Luna Mascot - Bottom-right positioned, cleanly cropped at bottom edge */}
            <div className="pointer-events-none absolute -bottom-1 -right-1 z-10 w-[155px] sm:w-[170px] select-none">
              <img
                src={quoteMascot}
                alt="Luna Mascot"
                className="h-full w-full object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
              />
            </div>
          </div>

          {/* To Do List Card (lg:col-span-4) */}
          <div className="flex min-h-[225px] flex-col justify-between rounded-[20px] border border-[#DECFBE] bg-[#FBF8F3] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] lg:col-span-4">
            <div className="flex flex-col">
              {/* Header: Icon, Title, Add Task button */}
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E7D7C7] bg-[#FDFBF7] text-[#C06B3E] shadow-2xs">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">To do List</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTodo(!isAddingTodo)}
                  className="flex items-center gap-1 rounded-full bg-[#C06B3E] px-3.5 py-1.5 font-manrope text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Optional Input when Add Task clicked */}
              {isAddingTodo && (
                <form onSubmit={handleAddTodo} className="mb-2 mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder="Enter task name..."
                    className="h-8 flex-1 rounded-lg border border-[#DBCAB8] bg-white px-2.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#C06B3E]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#C06B3E] px-3 text-[11px] font-bold text-white hover:bg-[#AA572D]"
                  >
                    Save
                  </button>
                </form>
              )}

              {/* List of To Do Items: Fixed height showing exactly 3 items, scrollable for 4th and beyond */}
              <div className="mt-1 flex max-h-[148px] flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#DECFBE_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#DECFBE] [&::-webkit-scrollbar-track]:bg-transparent">
                {todoList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleTodo(item.id)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-[12px] border px-3.5 py-2.5 transition-all ${item.completed
                      ? 'border-[#E7D3C3] bg-[#F7EBE1]/90 text-[#8E7F73]'
                      : 'border-[#E5D7CA] bg-white text-[#2D241C] hover:border-[#C06B3E]/40 hover:bg-[#FFFDF9]'
                      }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${item.completed
                        ? 'border-[#C06B3E] bg-[#C06B3E] text-white'
                        : 'border-[#CCAFA0] bg-transparent group-hover:border-[#C06B3E]'
                        }`}
                    >
                      {item.completed && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span
                      className={`font-manrope text-[13px] font-medium leading-tight ${item.completed ? 'line-through opacity-80' : ''
                        }`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Stat Cards in 2x2 Grid (lg:col-span-4) */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-4">
            <StatCard label="ACTIVE PROJECTS" value="3" />
            <StatCard label="WALLET BALANCE" value="₹2,840" />
            <StatCard label="CREDITS" value="680" />
            <StatCard label="PENDING BIDS" value="5" />
          </div>
        </section>

        {/* 4. RECOMMENDED / MOTION GRAPHICS CARDS (Horizontal 3 Columns) */}
        <section className="mt-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
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

                  {/* Project Image Banner with Mascot Desk */}
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

                {/* Bottom Bid Status & Action */}
                <div className="mt-4 flex items-center justify-between border-t border-[#F2E8DC] pt-3">
                  <span className="inline-flex items-center gap-1.5 font-manrope text-[12px] font-bold text-[#1F874C]">
                    <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                    {project.status}
                  </span>

                  <a
                    href={`/freelancer/browse/${project.id}`}
                    className="flex items-center gap-1 font-manrope text-[12px] font-extrabold text-[#08182B] transition-colors hover:text-[#C06B3E]"
                  >
                    View & Bid
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. BOTTOM ROW: UPCOMING DEADLINES & RECENT BIDS */}
        <section className="mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Upcoming Deadlines */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#E7DCCE] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <div>
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                  Upcoming Deadlines
                </h3>
                <a
                  href="/freelancer/calendar"
                  className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] hover:text-[#C06B3E]"
                >
                  View all <ChevronRight size={15} />
                </a>
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
                <a
                  href="/freelancer/projects"
                  className="flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B] hover:text-[#C06B3E]"
                >
                  View all <ChevronRight size={15} />
                </a>
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
