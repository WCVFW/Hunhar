import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import FreelancerTopNavbar from './FreelancerTopNavbar'

export default function DashboardLayout(): React.JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen w-full bg-[#EEEEEE] font-manrope text-[#08182B]">
      {/* Sidebar with Expand & Collapse support */}
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main Container dynamically adjusts margin based on collapsed state */}
      <div
        className={`flex min-h-screen flex-col transition-[margin-left] duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Global Sticky Top Navigation Bar (white background) */}
        <FreelancerTopNavbar />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 2xl:p-8">
          <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1720px] 3xl:max-w-[1840px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
