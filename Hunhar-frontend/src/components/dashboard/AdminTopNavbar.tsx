import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Bell,
  ShieldAlert,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react'

export default function AdminTopNavbar(): React.JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

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

  const adminNotifications = [
    { id: 1, title: 'New KYC Submission', time: '10m ago', unread: true },
    { id: 2, title: 'Project flagged for spam review', time: '1h ago', unread: true },
    { id: 3, title: 'Dispute opened for Milestone #2', time: '2h ago', unread: false },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-[64px] sm:h-[72px] lg:h-[76px] w-full items-center justify-between gap-3 bg-[#EEEEEE] px-3 sm:px-6 lg:px-8 font-manrope">
      {/* Search Input Box */}
      <div className="relative min-w-0 flex-1 max-w-[440px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]"
        />
        <input
          type="text"
          placeholder="Search users, project IDs, disputes, transactions..."
          className="h-9 sm:h-11 w-full rounded-full border border-[#E5DACD] bg-white pl-9 sm:pl-11 pr-3 sm:pr-4 font-manrope text-[12.5px] sm:text-[14px] text-[#08182B] placeholder-[#9D9183] shadow-xs transition-all focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
        />
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>System Healthy</span>
        </div>

        {/* Quick Platform Switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-white border border-[#E5DACD] p-1 rounded-full text-xs font-semibold text-[#524B42]">
          <Link
            to="/freelancer/dashboard"
            className="px-2.5 py-1 rounded-full hover:bg-[#F8F4EE] hover:text-[#08182B] transition-colors"
          >
            Freelancer
          </Link>
          <Link
            to="/client/dashboard"
            className="px-2.5 py-1 rounded-full hover:bg-[#F8F4EE] hover:text-[#08182B] transition-colors"
          >
            Client
          </Link>
          <span className="px-2.5 py-1 rounded-full bg-[#08182B] text-white">
            Admin
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-[#E5DACD] bg-white text-[#524B42] shadow-xs transition-colors hover:bg-[#F8F4EE]"
            aria-label="Admin Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C06B3E] ring-2 ring-white" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E5DACD] bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2 px-1">
                <span className="text-sm font-bold text-[#08182B]">Admin Alerts</span>
                <span className="rounded-full bg-[#C06B3E]/10 px-2 py-0.5 text-[10px] font-bold text-[#C06B3E]">
                  2 Pending
                </span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {adminNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-colors ${
                      n.unread ? 'bg-[#F9F6F0] font-semibold text-[#08182B]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-gray-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/verifications"
                onClick={() => setIsNotifOpen(false)}
                className="mt-2 block text-center text-xs font-semibold text-[#C06B3E] hover:underline pt-2 border-t border-[#F0EAE1]"
              >
                View all security alerts
              </Link>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 rounded-full border border-[#E5DACD] bg-white p-1 pr-3 shadow-xs transition-colors hover:bg-[#F8F4EE]"
          >
            <div className="h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full bg-gradient-to-tr from-[#08182B] to-[#1B254B] flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
            <div className="hidden text-left xl:block">
              <div className="text-[12px] font-bold text-[#08182B] leading-tight">Super Admin</div>
              <div className="text-[10px] text-[#8E8376]">admin@hunhar.com</div>
            </div>
            <ChevronDown size={14} className="text-[#8E8376]" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E5DACD] bg-white p-2 shadow-xl z-50 font-manrope">
              <div className="px-3 py-2 border-b border-[#F0EAE1] mb-1">
                <p className="text-xs font-bold text-[#08182B]">Hunhar Master Control</p>
                <p className="text-[11px] text-[#8E8376]">Admin Level: Root</p>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#08182B] hover:bg-[#F9F6F0] transition-colors"
              >
                <Settings size={15} className="text-[#C06B3E]" />
                Security & Settings
              </Link>
              <Link
                to="/admin/analytics"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#08182B] hover:bg-[#F9F6F0] transition-colors"
              >
                <Activity size={15} className="text-[#C06B3E]" />
                Platform Audit Log
              </Link>

              <div className="my-1 border-t border-[#F0EAE1]" />

              <a
                href="/"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
