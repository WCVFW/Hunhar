import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Activity,
} from 'lucide-react'
import { adminApi, logout, tokenStorage } from '../../services/api'
import { initials } from '../../services/format'

interface AdminAlert {
  id: string
  title: string
  to: string
}

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

  const navigate = useNavigate()
  const me = tokenStorage.getUser()
  const [search, setSearch] = useState('')
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [healthy, setHealthy] = useState<boolean | null>(null)

  // Live work queue for the bell, refreshed every minute
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [kyc, disputes, payouts, analytics] = await Promise.allSettled([
        adminApi.kycList('PENDING_REVIEW'),
        adminApi.disputes('OPEN'),
        adminApi.payouts('REQUESTED'),
        adminApi.analytics(),
      ])
      if (cancelled) return
      const next: AdminAlert[] = []
      const count = <T,>(r: PromiseSettledResult<T[]>) => (r.status === 'fulfilled' ? r.value.length : 0)
      const k = count(kyc)
      const d = count(disputes)
      const p = count(payouts)
      if (k) next.push({ id: 'kyc', title: `${k} KYC application${k === 1 ? '' : 's'} waiting for review`, to: '/admin/verifications' })
      if (d) next.push({ id: 'disputes', title: `${d} open dispute${d === 1 ? '' : 's'}`, to: '/admin/disputes' })
      if (p) next.push({ id: 'payouts', title: `${p} withdrawal request${p === 1 ? '' : 's'} to pay`, to: '/admin/transactions' })
      setAlerts(next)
      setHealthy(analytics.status === 'fulfilled' ? analytics.value.unavailable.length === 0 : false)
    }
    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/admin/users?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-[64px] sm:h-[72px] lg:h-[76px] w-full items-center justify-between gap-3 bg-[#EEEEEE] px-3 sm:px-6 lg:px-8 font-manrope">
      {/* Search Input Box */}
      <form onSubmit={submitSearch} className="relative min-w-0 flex-1 max-w-[440px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email or mobile..."
          className="h-9 sm:h-11 w-full rounded-full border border-[#E5DACD] bg-white pl-9 sm:pl-11 pr-3 sm:pr-4 font-manrope text-[12.5px] sm:text-[14px] text-[#08182B] placeholder-[#9D9183] shadow-xs transition-all focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
        />
      </form>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* System Status Pill */}
        {healthy !== null && (
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              healthy ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {healthy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${healthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span>{healthy ? 'All Services Up' : 'Service Issue'}</span>
          </div>
        )}

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
            {alerts.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C06B3E] ring-2 ring-white" />}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E5DACD] bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2 px-1">
                <span className="text-sm font-bold text-[#08182B]">Admin Alerts</span>
                {alerts.length > 0 && (
                  <span className="rounded-full bg-[#C06B3E]/10 px-2 py-0.5 text-[10px] font-bold text-[#C06B3E]">{alerts.length} Pending</span>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {alerts.length === 0 ? (
                  <p className="p-2.5 text-xs text-gray-500">Nothing needs your attention right now.</p>
                ) : (
                  alerts.map((n) => (
                    <Link
                      key={n.id}
                      to={n.to}
                      onClick={() => setIsNotifOpen(false)}
                      className="block p-2.5 rounded-xl text-xs bg-[#F9F6F0] font-semibold text-[#08182B] hover:bg-[#F3EDE4] transition-colors"
                    >
                      {n.title}
                    </Link>
                  ))
                )}
              </div>
              <Link
                to="/admin/verifications"
                onClick={() => setIsNotifOpen(false)}
                className="mt-2 block text-center text-xs font-semibold text-[#C06B3E] hover:underline pt-2 border-t border-[#F0EAE1]"
              >
                Open KYC queue
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
              {initials(me?.fullName || 'Admin')}
            </div>
            <div className="hidden text-left xl:block">
              <div className="text-[12px] font-bold text-[#08182B] leading-tight">{me?.fullName || 'Admin'}</div>
              <div className="text-[10px] text-[#8E8376]">{me?.email || ''}</div>
            </div>
            <ChevronDown size={14} className="text-[#8E8376]" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#E5DACD] bg-white p-2 shadow-xl z-50 font-manrope">
              <div className="px-3 py-2 border-b border-[#F0EAE1] mb-1">
                <p className="text-xs font-bold text-[#08182B]">{me?.fullName || 'Admin'}</p>
                <p className="text-[11px] text-[#8E8376] truncate">{me?.email || 'Platform administrator'}</p>
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
                Platform Analytics
              </Link>

              <div className="my-1 border-t border-[#F0EAE1]" />

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
