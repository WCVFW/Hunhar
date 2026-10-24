import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Bell,
  Coins,
  Wallet,
  Gavel,
  Trophy,
  FileText,
  BadgeCheck,
  ChevronRight,
  LogOut,
  User,
  CheckCircle2,
  DollarSign,
  Briefcase,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'
import { mockNotifications } from '../../pages/freelancer/FreelancerNotificationsPage'

export default function FreelancerTopNavbar(): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-[64px] sm:h-[72px] lg:h-[76px] w-full items-center justify-between gap-2 bg-[#EEEEEE] px-3 sm:px-6 lg:px-8">
      {/* Search Input Box */}
      <div className="relative min-w-0 flex-1 max-w-[420px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]"
        />
        <input
          type="text"
          placeholder="Search..."
          className="h-9 sm:h-11 w-full rounded-full border border-[#E5DACD] bg-white pl-9 sm:pl-11 pr-3 sm:pr-4 font-manrope text-[12.5px] sm:text-[14px] text-[#08182B] placeholder-[#9D9183] shadow-xs transition-all focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
        />
      </div>

      {/* Top Badges & Freelancer Profile */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-3">
        {/* Credits Badge (Hidden on mobile < 640px, visible on sm+) */}
        <Link
          to="/freelancer/credits"
          className="hidden sm:flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-full border border-[#F2C5A5] bg-[#FCECE0]/80 px-3 sm:px-4 font-manrope text-[12px] sm:text-[13px] font-semibold text-[#A85123] shadow-xs shrink-0 transition-all hover:bg-[#F9DEC9] active:scale-98"
        >
          <Coins size={14} className="text-[#C06B3E]" />
          <span>680 Credits</span>
        </Link>

        {/* Wallet Balance Badge (Compact on mobile) */}
        <Link
          to="/freelancer/wallet"
          className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-full border border-[#BDE8CA] bg-[#E9F9EE] px-2.5 sm:px-4 font-manrope text-[12px] sm:text-[13px] font-bold text-[#1F874C] shadow-xs shrink-0 transition-all hover:bg-[#D6F4DF] active:scale-98"
        >
          <Wallet size={14} className="text-[#1F874C]" />
          <span>₹ 2,840</span>
        </Link>

        {/* Notification Bell with Dropdown Menu & Direct Route */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen((prev) => !prev)
              setIsDropdownOpen(false)
            }}
            className={`relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${isNotifOpen
              ? 'border-[#C06B3E] bg-[#FFF7ED] text-[#C06B3E] shadow-sm'
              : 'border-[#E5DACD] bg-white text-[#524B42] shadow-xs hover:bg-[#F8F4EE]'
              }`}
            aria-label="Notifications"
            aria-expanded={isNotifOpen}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E04F36] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Quick Notification Dropdown Preview */}
          {isNotifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] sm:w-[380px] overflow-hidden rounded-[24px] border border-[#E5E5E5] bg-white p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-150 font-manrope">
              {/* Header */}
              <div className="flex items-center justify-between px-1.5 pb-2.5 border-b border-[#F0ECE6]">
                <div className="flex items-center gap-2">
                  <h3 className="font-manrope text-[14.5px] font-extrabold text-[#08182B]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[11px] font-bold text-[#C06B3E]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <Link
                  to="/freelancer/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-[12px] font-bold text-[#C06B3E] hover:underline"
                >
                  View all
                </Link>
              </div>

              {/* Items List (Top 4 recent notifications) */}
              <div className="mt-2 divide-y divide-[#F5F2EC] max-h-[340px] overflow-y-auto">
                {mockNotifications.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    to={item.actionUrl || '/freelancer/notifications'}
                    onClick={() => setIsNotifOpen(false)}
                    className={`flex items-start gap-3 p-2.5 rounded-[14px] transition-colors ${item.read
                      ? 'hover:bg-[#FAF8F5]'
                      : 'bg-[#FFFBF7] hover:bg-[#FFF7ED]'
                      }`}
                  >
                    <div className="mt-0.5">
                      {item.iconType === 'bid_accepted' && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF7EE] text-[#16A34A]">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      {item.iconType === 'payment_received' && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C06B3E]">
                          <DollarSign size={16} />
                        </div>
                      )}
                      {item.iconType === 'invite' && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                          <Briefcase size={15} />
                        </div>
                      )}
                      {item.iconType === 'message' && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
                          <MessageSquare size={15} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-[12.5px] font-bold text-[#08182B] truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10.5px] text-[#94A3B8] shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11.5px] text-[#64748B] mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View Full Page Bottom Button */}
              <div className="mt-2.5 border-t border-[#F0ECE6] pt-2">
                <Link
                  to="/freelancer/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#08182B] text-center font-manrope text-[12px] font-bold text-white transition-all hover:bg-[#C06B3E] active:scale-98 shadow-xs"
                >
                  <span>Open Full Notifications Page</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Freelancer Avatar & Interactive Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen((prev) => !prev)
              setIsNotifOpen(false)
            }}
            className="flex items-center gap-1 cursor-pointer select-none rounded-full p-0.5 sm:p-1 transition-all hover:bg-black/5 focus:outline-none"
            aria-expanded={isDropdownOpen}
            aria-label="User Profile Menu"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#08182B] font-manrope text-[13px] sm:text-[14px] font-bold text-white shadow-xs ring-2 ring-[#E5DACD]">
              R
            </div>
            <svg
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8E8376] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#C06B3E]' : ''
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* DROPDOWN MENU MODAL (Matching User Images 1 & 2 in Hunhar Theme) */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-[24px] border border-[#E5E5E5] bg-white p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-150 font-manrope">
              {/* Top: LinkedIn-style Freelancer Identity Section (Hunhar Theme) */}
              <div className="rounded-[18px] border border-[#EFE8DF] bg-[#FAF8F5] p-3.5">
                <div className="flex items-start gap-3">
                  {/* Avatar with Verified Ring / Status badge */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#08182B] font-manrope text-[16px] font-bold text-white shadow-xs">
                    <span>R</span>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1F874C] ring-2 ring-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  </div>

                  {/* Name, Verified badge & Headline */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-manrope text-[14.5px] font-bold text-[#08182B] truncate">
                        Rajshankar.M
                      </h4>
                      <BadgeCheck size={16} className="text-[#C06B3E] shrink-0" />
                    </div>
                    <p className="mt-0.5 line-clamp-2 font-manrope text-[11px] leading-snug text-[#7A7065]">
                      UI/UX Designer | Frontend Developer | Creating Digital Experiences
                    </p>
                  </div>
                </div>

                {/* View Profile Pill Button */}
                <Link
                  to="/freelancer/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="mt-3 flex h-8 w-full items-center justify-center rounded-full border border-[#C06B3E] font-manrope text-[12px] font-bold text-[#C06B3E] transition-all hover:bg-[#C06B3E] hover:text-white active:scale-98"
                >
                  View profile
                </Link>
              </div>

              {/* Navigation Items (Matching Image 1: My Bids, Leadership Board, Contract, Wallet) */}
              <div className="mt-2.5 flex flex-col space-y-0.5 border-t border-[#F0ECE6] pt-2">
                <Link
                  to="/freelancer/bids"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <Gavel size={16} className="text-[#C06B3E]" />
                    <span>My Bids</span>
                  </div>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </Link>

                <Link
                  to="/freelancer/leaderboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy size={16} className="text-[#C06B3E]" />
                    <span>Leadership Board</span>
                  </div>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </Link>

                <Link
                  to="/freelancer/projects"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-[#C06B3E]" />
                    <span>Contract</span>
                  </div>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </Link>

                <Link
                  to="/freelancer/wallet"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet size={16} className="text-[#1F874C]" />
                    <span>Wallet</span>
                  </div>
                  <span className="rounded-full bg-[#E9F9EE] px-2 py-0.5 text-[11px] font-extrabold text-[#1F874C]">
                    ₹ 2,840
                  </span>
                </Link>
              </div>

              {/* Bottom Logout */}
              <div className="mt-2 border-t border-[#F0ECE6] pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false)
                    window.location.href = '/'
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2 font-manrope text-[13px] font-bold text-[#E11D48] transition-colors hover:bg-[#FFF1F2]"
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
