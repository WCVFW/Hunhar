import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Search,
  Briefcase,
  MessageSquare,
  Users2,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import hunharLogo from '../../assets/hunha Logo.png'
import sidebarCollapseLogo from '../../assets/Sidebar_collaps.png'
import promoMascotCard from '../../assets/promo_mascot_card.png'
import { logout } from '../../services/api'

interface MenuItem {
  name: string
  to: string
  icon: LucideIcon
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', to: '/freelancer/dashboard', icon: LayoutGrid },
  { name: 'Browse Projects', to: '/freelancer/browse', icon: Search },
  { name: 'Active Projects', to: '/freelancer/projects', icon: Briefcase },
  { name: 'Messages', to: '/freelancer/messages', icon: MessageSquare },
  { name: 'Team Collab', to: '/freelancer/team', icon: Users2 },
  { name: 'Calendar', to: '/freelancer/calendar', icon: Calendar },
]

const linkBase =
  'flex items-center rounded-[10px] py-[clamp(7px,1.1vh,9px)] font-manrope text-[12.5px] font-medium no-underline transition-all duration-200'
const activeClass =
  'bg-gradient-to-r from-[#D98F62] to-[#C06B3E] text-white shadow-[0_4px_12px_-4px_rgba(192,107,62,0.6)]'
const idleClass = 'text-[#D6DCE5] hover:bg-white/5 hover:text-white'

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

/**
 * Standard Sidebar Dock / Panel Toggle Icon matching real-world UI design (e.g. VS Code, Notion, Linear, etc.)
 * Styled to match Hunhar brand colors.
 */
function SidebarToggleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer rounded rect */}
      <rect x="3" y="3" width="18" height="18" rx="4" />
      {/* Sidebar divider vertical line */}
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  const handleLogout = () => {
    logout()
  }

  const renderNavContent = (collapsed: boolean = false) => (
    <div
      className={`flex h-full flex-col justify-between overflow-y-auto pb-4 pt-[clamp(14px,2.5vh,20px)] transition-all duration-300 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
        collapsed ? 'px-2.5 items-center' : 'px-4'
      }`}
    >
      {/* Top: Header (Logo + Toggle Icon at Top) + Menu */}
      <div className="flex w-full flex-col">
        {/* Top Header Row with Logo (Always centered) */}
        <div
          className={`mb-[clamp(14px,3.5vh,28px)] flex w-full items-center justify-center transition-all duration-300 ${
            collapsed ? 'px-0' : 'px-2'
          }`}
        >
          {/* Logo: full logo when expanded, Sidebar_collaps.png when collapsed */}
          <NavLink
            to="/freelancer/dashboard"
            className="flex items-center justify-center no-underline"
            aria-label="Hunhar Home"
            title="Hunhar Home"
          >
            {collapsed ? (
              <img
                src={sidebarCollapseLogo}
                alt="Hunhar Logo Icon"
                className="block h-9 w-9 object-contain drop-shadow-sm"
              />
            ) : (
              <img
                src={hunharLogo}
                alt="Hunhar"
                className="block h-[clamp(30px,4.2vh,38px)] w-auto max-w-[150px] object-contain"
              />
            )}
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex flex-col gap-[clamp(4px,1.2vh,10px)]"
          aria-label="Freelancer navigation"
        >
          {menuItems.map(({ name, to, icon: Icon }) => (
            <NavLink
              key={name}
              to={to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? name : undefined}
              className={({ isActive }) =>
                `${linkBase} ${collapsed ? 'justify-center px-0 w-9 h-9 mx-auto' : 'px-3 gap-3'} ${
                  isActive ? activeClass : idleClass
                }`
              }
            >
              <Icon size={16} strokeWidth={1.8} className="shrink-0" />
              {!collapsed && <span className="truncate">{name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Middle/Bottom: Promo Card (Hidden when collapsed) */}
      {!collapsed && (
        <div className="my-2.5 w-full">
          <div className="relative overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-[#11243E] to-[#0A182B] p-3 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="max-w-[110px] space-y-0.5 pt-1">
                <p className="font-manrope text-[11.5px] font-bold leading-tight text-white">
                  Good Talent Builds Better Things.
                </p>
              </div>
              <img
                src={promoMascotCard}
                alt="Hunhar Mascot"
                className="h-14 w-14 -mr-1 object-contain drop-shadow-md"
              />
            </div>
            <NavLink
              to="/freelancer/credits"
              className="mt-2 block w-full rounded-[10px] bg-[#F4EFE6] py-1.5 text-center font-manrope text-[11px] font-semibold text-[#C06B3E] no-underline shadow-sm transition-all hover:bg-white"
            >
              Buy Credits
            </NavLink>
          </div>
        </div>
      )}

      {/* Bottom: Settings + Logout */}
      <div className={`flex w-full flex-col gap-[clamp(5px,1.2vh,8px)] ${collapsed ? 'items-center' : ''}`}>
        <NavLink
          to="/freelancer/settings"
          onClick={() => setMobileOpen(false)}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `${linkBase} ${collapsed ? 'justify-center px-0 w-9 h-9' : 'px-3 gap-3'} ${
              isActive ? activeClass : idleClass
            }`
          }
        >
          <Settings size={16} strokeWidth={1.8} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex cursor-pointer items-center justify-center rounded-[10px] border-none bg-[#F4EFE6] font-manrope font-semibold text-[#08182B] transition-colors duration-200 hover:bg-white active:scale-[0.99] ${
            collapsed
              ? 'h-9 w-9 p-0'
              : 'h-[36px] w-full gap-2 text-[12px]'
          }`}
        >
          <LogOut size={14} strokeWidth={2} />
          {!collapsed && <span>Logut</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar (< 1024px) */}
      <div className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-[#08182B] px-5 text-white lg:hidden">
        <NavLink to="/freelancer/dashboard" className="flex items-center">
          <img
            src={hunharLogo}
            alt="Hunhar"
            className="h-7 w-auto object-contain"
          />
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-none bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop Fixed Sidebar with Expand / Collapse */}
      <div
        className={`fixed inset-y-2.5 left-2.5 z-40 hidden transition-[width] duration-300 ease-in-out lg:block ${
          isCollapsed ? 'w-[74px]' : 'w-[245px]'
        }`}
      >
        <aside className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-[#08182B] shadow-2xl">
          {renderNavContent(isCollapsed)}
        </aside>

        {/* Floating Toggle Button (Shifted up to comfortable position) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="group absolute -right-3.5 bottom-24 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#08182B] bg-[#C06B3E] text-[#F4EFE6] shadow-[0_4px_14px_rgba(192,107,62,0.45)] transition-all duration-200 hover:scale-110 hover:bg-[#D98F62] hover:text-white active:scale-95"
          >
            <SidebarToggleIcon
              className={`h-[15px] w-[15px] text-[#F4EFE6] transition-transform duration-300 group-hover:text-white ${
                isCollapsed ? 'scale-x-[-1]' : 'scale-x-100'
              }`}
            />
          </button>
        )}
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[270px] bg-[#08182B] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 text-white hover:bg-white/20"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <div className="h-full">{renderNavContent(false)}</div>
      </aside>
    </>
  )
}