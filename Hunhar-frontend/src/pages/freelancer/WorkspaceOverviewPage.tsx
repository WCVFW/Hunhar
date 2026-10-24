import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Send,
  Paperclip,
  TrendingUp,
  ArrowDownCircle,
  Receipt,
  UserPlus,
  Search,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'

type TabType = 'overview' | 'files' | 'payments' | 'hustlers'

interface Milestone {
  id: number
  title: string
  status: 'completed' | 'current' | 'pending'
}

interface RecentFile {
  name: string
  ext: string
}

export default function WorkspaceOverviewPage(): React.JSX.Element {
  const { projectId = '1' } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Mock Workspace Data matching user design 2 & 3
  const workspace = {
    title: 'Brand Identity',
    status: 'In Progress',
    clientName: 'Acme Studio',
    clientInitial: 'A',
    clientVerified: true,
    price: '₹ 1,200',
    priceType: 'Fixed price',
    progress: 65,
    currentMilestone: 'Final Logo Concepts',
    deadline: 'Aug 28, 2026',
    description:
      'Full brand identity design including logo, colour palette, typography, and brand guidelines.',
    milestones: [
      { id: 1, title: 'Initial Concepts', status: 'completed' },
      { id: 2, title: 'Client Review Round 1', status: 'completed' },
      { id: 3, title: 'Final Logo Concepts', status: 'current' },
      { id: 4, title: 'Final Delivery', status: 'pending' },
    ] as Milestone[],
    recentFiles: [
      { name: 'Logo_Concepts_v3.fig', ext: 'fig' },
      { name: 'Brief.pdf', ext: 'pdf' },
      { name: 'Reference_board.pdf', ext: 'pdf' },
    ] as RecentFile[],
  }

  return (
    <div className="flex w-full flex-col gap-5 pb-16 font-manrope">
      {/* 1. BREADCRUMB / TOP TITLE */}
      <div className="flex items-center gap-2 text-[#08182B]">
        <Briefcase size={20} className="text-[#8E8376]" />
        <h1 className="font-manrope text-[18px] sm:text-[20px] font-bold text-[#08182B]">
          Project / Overview
        </h1>
      </div>

      {/* 2. TOP HERO WORKSPACE CARD */}
      <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left: Mascot Image Banner & Title Info */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Banner Artwork */}
            <div className="relative h-[200px] sm:h-[260px] w-full overflow-hidden rounded-[20px] bg-[#E8DDD0]">
              <img
                src={cardDeskMascot}
                alt={workspace.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Title & Status */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-manrope text-[24px] sm:text-[26px] font-extrabold text-[#08182B]">
                    {workspace.title}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F9EE] px-3 py-1 font-manrope text-[12px] font-bold text-[#1F874C]">
                    <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                    {workspace.status}
                  </span>
                </div>
                <p className="mt-1 font-manrope text-[14px] text-[#786D61]">
                  {workspace.clientName}
                </p>
              </div>

              {/* Price */}
              <div className="text-right">
                <span className="font-manrope text-[24px] sm:text-[26px] font-extrabold text-[#C06B3E]">
                  {workspace.price}
                </span>
                <span className="block text-[12px] font-medium text-[#8E8376]">
                  {workspace.priceType}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Progress Tracker & Project Tracking Action Button */}
          <div className="flex flex-col justify-between rounded-[20px] bg-[#FAF8F5] p-5 lg:col-span-4 lg:min-h-[320px]">
            <div className="flex flex-col gap-5">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between font-manrope text-[12px] font-bold text-[#8A7F73]">
                  <span>PROGRESS</span>
                  <span className="text-[#08182B]">{workspace.progress}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EADDCF]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D98F62] to-[#C06B3E]"
                    style={{ width: `${workspace.progress}%` }}
                  />
                </div>
              </div>

              {/* Current Milestone */}
              <div>
                <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#8A7F73]">
                  CURRENT MILESTONE
                </span>
                <span className="mt-1 block font-manrope text-[14px] font-bold text-[#08182B]">
                  {workspace.currentMilestone}
                </span>
              </div>

              {/* Deadline */}
              <div>
                <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#8A7F73]">
                  DEADLINE
                </span>
                <div className="mt-1 flex items-center gap-1.5 font-manrope text-[13px] font-semibold text-[#665B50]">
                  <Clock size={14} className="text-[#8E8376]" />
                  <span>{workspace.deadline}</span>
                </div>
              </div>
            </div>

            {/* Project Tracking CTA Button (Dark Navy) */}
            <button
              type="button"
              className="mt-6 flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#0A182B] font-manrope text-[14px] font-bold text-white shadow-md transition-all hover:bg-[#122844] active:scale-98"
            >
              <TrendingUp size={16} />
              <span>Project Tracking</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION: Overview / Files / Payments / Hustlers */}
      <div className="flex items-center gap-8 border-b border-[#EBEBEB] px-2 pt-2">
        {(['overview', 'files', 'payments', 'hustlers'] as TabType[]).map((tab) => {
          const tabLabels: Record<TabType, string> = {
            overview: 'Overview',
            files: 'Files',
            payments: 'Payments',
            hustlers: 'Hustlers',
          }
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 font-manrope text-[15px] font-semibold transition-colors ${
                isActive ? 'text-[#C06B3E]' : 'text-[#7A7065] hover:text-[#08182B]'
              }`}
            >
              {tabLabels[tab]}
              {isActive && (
                <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-[#C06B3E]" />
              )}
            </button>
          )
        })}
      </div>

      {/* 4. TAB CONTENT: 2-COLUMN LAYOUT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Project Description & Milestones list */}
          <div className="flex flex-col gap-5 lg:col-span-8">
            {/* Project Description Card */}
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                Project Description
              </h3>
              <p className="mt-2.5 font-manrope text-[14px] leading-relaxed text-[#594E42]">
                {workspace.description}
              </p>
            </div>

            {/* Milestones Card */}
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                Milestones
              </h3>

              <div className="mt-4 flex flex-col gap-3.5">
                {workspace.milestones.map((m) => {
                  let icon = (
                    <div className="h-5 w-5 rounded-full border-2 border-[#D8CDC2]" />
                  )
                  let textColor = 'text-[#8E8376]'
                  let badge = null

                  if (m.status === 'completed') {
                    icon = (
                      <CheckCircle2
                        size={20}
                        className="text-[#22C55E] fill-[#22C55E]/10"
                      />
                    )
                    textColor = 'text-[#2D241C]'
                  } else if (m.status === 'current') {
                    icon = (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#7C3AED]">
                        <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                      </div>
                    )
                    textColor = 'text-[#08182B] font-bold'
                    badge = (
                      <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#7C3AED]">
                        Current
                      </span>
                    )
                  }

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-3">
                        {icon}
                        <span className={`font-manrope text-[14px] ${textColor}`}>
                          {m.title}
                        </span>
                      </div>
                      {badge}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Client Info & Recent Files */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            {/* Client Card */}
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">
                Client
              </h3>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[16px] font-bold text-white shadow-xs">
                  {workspace.clientInitial}
                </div>
                <div>
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                    {workspace.clientName}
                  </h4>
                  <span className="text-[12px] text-[#8E8376]">Verified client</span>
                </div>
              </div>

              {/* Send Message Button */}
              <Link
                to="/freelancer/messages"
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#E5DACD] bg-white font-manrope text-[13px] font-bold text-[#2E251B] transition-colors hover:bg-[#FAF7F2]"
              >
                <Send size={14} />
                <span>Send Message</span>
              </Link>
            </div>

            {/* Recent Files Card */}
            <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">
                Recent Files
              </h3>

              <div className="mt-3.5 flex flex-col divide-y divide-[#F0F0F0]">
                {workspace.recentFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex cursor-pointer items-center gap-2.5 py-2.5 text-[13px] text-[#4A4136] transition-colors hover:text-[#C06B3E]"
                  >
                    <Paperclip size={15} className="text-[#8E8376]" />
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. FILES TAB */}
      {/* ========================================================= */}
      {activeTab === 'files' && (
        <div className="flex flex-col gap-3.5 pt-2">
          {/* File Item 1 */}
          <div className="flex items-center justify-between rounded-[16px] border border-[#EBEBEB] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/40">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F4F4F4] font-manrope text-[12px] font-bold text-[#6B7280]">
                PDF
              </div>
              <div>
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Acme_Brief.pdf
                </h4>
                <p className="mt-0.5 font-manrope text-[13px] text-[#8E8376]">
                  1.2 MB · Alex Chen · Aug 14
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 font-manrope text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
            >
              <span>Download</span>
              <ArrowDownCircle size={17} />
            </button>
          </div>

          {/* File Item 2 */}
          <div className="flex items-center justify-between rounded-[16px] border border-[#EBEBEB] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/40">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F4F4F4] font-manrope text-[12px] font-bold text-[#6B7280]">
                Figma
              </div>
              <div>
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Moodboard_v1.fig
                </h4>
                <p className="mt-0.5 font-manrope text-[13px] text-[#8E8376]">
                  4.8 MB · Arun Kumar · Aug 17
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 font-manrope text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
            >
              <span>Download</span>
              <ArrowDownCircle size={17} />
            </button>
          </div>

          {/* File Item 3 */}
          <div className="flex items-center justify-between rounded-[16px] border border-[#EBEBEB] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/40">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F4F4F4] font-manrope text-[12px] font-bold text-[#6B7280]">
                PDF
              </div>
              <div>
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Brand_Concepts_WIP.pdf
                </h4>
                <p className="mt-0.5 font-manrope text-[13px] text-[#8E8376]">
                  2.1 MB · Arun Kumar · Aug 19
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 font-manrope text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
            >
              <span>Download</span>
              <ArrowDownCircle size={17} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PAYMENTS TAB */}
      {/* ========================================================= */}
      {activeTab === 'payments' && (
        <div className="flex flex-col gap-4 pt-2">
          {/* Invoice Header */}
          <div className="flex items-center gap-2 text-[#08182B]">
            <Receipt size={18} className="text-[#08182B]" />
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">Invoice</h3>
          </div>

          {/* Invoice Item 1 */}
          <div className="flex items-center justify-between rounded-[16px] border border-[#EFEFEF] bg-[#FAF8F5] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/30">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  25% Upfront
                </h4>
                <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#16A34A]">
                  Paid
                </span>
              </div>
              <p className="mt-1 font-manrope text-[13px] text-[#8E8376]">Aug 14</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 font-manrope text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
            >
              <span>Download</span>
              <ArrowDownCircle size={17} />
            </button>
          </div>

          {/* Invoice Item 2 */}
          <div className="flex items-center justify-between rounded-[16px] border border-[#EFEFEF] bg-[#FAF8F5] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/30">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  50% Design
                </h4>
                <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#16A34A]">
                  Paid
                </span>
              </div>
              <p className="mt-1 font-manrope text-[13px] text-[#8E8376]">Aug 14</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-4 py-2 font-manrope text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-95"
            >
              <span>Download</span>
              <ArrowDownCircle size={17} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. HUSTLERS TAB */}
      {/* ========================================================= */}
      {activeTab === 'hustlers' && (
        <div className="flex flex-col gap-6 pt-2">
          {/* Card 1: Team Members */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                Team Members
              </h3>
              <button
                type="button"
                className="flex items-center gap-2 rounded-[12px] bg-[#0A182B] px-4 py-2 font-manrope text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#122844] active:scale-98"
              >
                <UserPlus size={15} />
                <span>Add Collaborator</span>
              </button>
            </div>

            {/* Current Member Banner */}
            <div className="flex items-center gap-3.5 rounded-[16px] bg-[#F7F7F7] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[16px] font-bold text-white shadow-xs">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                    Arun Kumar
                  </h4>
                  <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 font-manrope text-[11px] font-bold text-[#7C3AED]">
                    You
                  </span>
                </div>
                <p className="mt-0.5 font-manrope text-[12px] text-[#786D61]">
                  Lead Designer · Project Owner
                </p>
              </div>
            </div>

            <p className="mt-4 text-center font-manrope text-[13px] text-[#8E8376]">
              No collaborators yet. Invite a freelancer to build your team.
            </p>
          </div>

          {/* Card 2: Pending Invitations */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-6 shadow-xs">
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Pending Invitations
            </h3>

            <div className="mt-4 flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#DCD3C7] p-8 text-center">
              <div className="mb-2 text-[#C5B8A8]">
                <Search size={24} />
              </div>
              <p className="font-manrope text-[13px] text-[#8E8376]">
                No pending invitations.
              </p>
              <Link
                to="/freelancer/browse"
                className="mt-2.5 font-manrope text-[13px] font-bold text-[#5249DE] hover:underline"
              >
                Search for freelancers &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
