import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronRight,
  PlusCircle,
  Briefcase,
  CreditCard,
  LogOut,
  User,
} from 'lucide-react'

export default function ClientTopNavbar(): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-[64px] sm:h-[72px] lg:h-[76px] w-full items-center justify-between gap-2 bg-[#EEEEEE] px-3 sm:px-6 lg:px-8 font-manrope">
      {/* Search Input Box */}
      <div className="relative min-w-0 flex-1 max-w-[420px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]"
        />
        <input
          type="text"
          placeholder="Search projects, clients, bids..."
          className="h-9 sm:h-11 w-full rounded-full border border-[#E5DACD] bg-white pl-9 sm:pl-11 pr-3 sm:pr-4 font-manrope text-[12.5px] sm:text-[14px] text-[#08182B] placeholder-[#9D9183] shadow-xs transition-all focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
        />
      </div>

      {/* Top Badges & Client Profile */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-[#E5DACD] bg-white text-[#524B42] shadow-xs transition-colors hover:bg-[#F8F4EE]"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E04F36] ring-2 ring-white" />
        </button>

        {/* Client Profile Avatar & Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 cursor-pointer select-none rounded-full p-0.5 sm:p-1 transition-all hover:bg-black/5 focus:outline-none"
            aria-expanded={isDropdownOpen}
            aria-label="Client Profile Menu"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#08182B] font-manrope text-[13px] sm:text-[14px] font-bold text-white shadow-xs ring-2 ring-[#E5DACD]">
              A
            </div>
            <svg
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8E8376] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#C06B3E]' : ''
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Profile Dropdown Menu Card */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[280px] sm:w-[310px] rounded-[24px] border border-[#F0ECE6] bg-white p-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Client Profile Summary */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#08182B] text-[16px] font-bold text-white ring-2 ring-[#F0ECE6]">
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate font-manrope text-[15px] font-bold text-[#08182B]">
                        Alex Rivers
                      </h4>
                      <span className="rounded-full bg-[#F0FDF4] px-1.5 py-0.2 text-[10px] font-bold text-[#16A34A] border border-[#86EFAC]">
                        Client
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 font-manrope text-[11.5px] text-[#7A7065]">
                      Founder @ NovaTech Inc.
                    </p>
                  </div>
                </div>

                <Link
                  to="/client/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="mt-3 flex h-8 w-full items-center justify-center rounded-full border border-[#C06B3E] font-manrope text-[12px] font-bold text-[#C06B3E] transition-all hover:bg-[#C06B3E] hover:text-white active:scale-98"
                >
                  View Profile
                </Link>
              </div>

              {/* Navigation Items */}
              <div className="mt-2.5 flex flex-col space-y-0.5 border-t border-[#F0ECE6] pt-2">
                <Link
                  to="/client/create-project"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle size={16} className="text-[#C06B3E]" />
                    <span>Post New Project</span>
                  </div>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </Link>

                <Link
                  to="/client/projects"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase size={16} className="text-[#C06B3E]" />
                    <span>My Projects</span>
                  </div>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </Link>

                <Link
                  to="/client/payments"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between rounded-[12px] px-3 py-2.5 font-manrope text-[13.5px] font-semibold text-[#08182B] transition-colors hover:bg-[#FAF8F5] hover:text-[#C06B3E]"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard size={16} className="text-[#C06B3E]" />
                    <span>Billing & Payments</span>
                  </div>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </Link>
              </div>

              {/* Logout Button */}
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
