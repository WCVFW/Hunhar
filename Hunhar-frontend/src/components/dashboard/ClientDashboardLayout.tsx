import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import ClientSidebar from './ClientSidebar'
import ClientTopNavbar from './ClientTopNavbar'

export default function ClientDashboardLayout(): React.JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen w-full bg-[#EEEEEE] font-manrope text-[#08182B]">
      {/* Client Sidebar */}
      <ClientSidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main Container dynamically adjusts margin based on collapsed state */}
      <div
        className={`flex min-h-screen flex-col transition-[margin-left] duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* Global Sticky Client Top Navigation Bar */}
        <ClientTopNavbar />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
