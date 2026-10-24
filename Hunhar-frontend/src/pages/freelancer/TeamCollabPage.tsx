import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Star,
  X,
  ChevronDown,
  CheckCircle2,
  Users2,
  Send,
  MapPin,
  Clock,
} from 'lucide-react'

interface PortfolioItem {
  title: string
  tool: string
  bgGradient: string
}

interface Freelancer {
  id: string
  name: string
  role: string
  initials: string
  avatarBg: string
  avatarColor: string
  rating: number
  reviewCount: number
  status: 'Available' | 'Soon'
  skills: string[]
  extraSkillsCount?: number
  experience: string
  hourlyRate: string
  location?: string
  availability?: string
  about?: string
  projectsCompleted?: number
  portfolio?: PortfolioItem[]
}

const freelancersList: Freelancer[] = [
  {
    id: 'f1',
    name: 'Priya Menon',
    role: 'Motion Designer & Animator',
    initials: 'PM',
    avatarBg: 'bg-[#00966D]',
    avatarColor: 'text-white',
    rating: 4.9,
    reviewCount: 38,
    status: 'Available',
    skills: ['After Effects', 'Cinema 4D', 'Lottie', 'Motion Design'],
    extraSkillsCount: 1,
    experience: '6 years',
    hourlyRate: '₹1,200/hr',
    location: 'Bangalore, India',
    availability: 'Available now',
    projectsCompleted: 41,
    about:
      'Motion designer specialising in product animations, explainer videos, and UI micro-interactions for SaaS companies.',
    portfolio: [
      {
        title: 'Campaign Visuals',
        tool: 'After Effects',
        bgGradient: 'from-[#EEF2FF] to-[#E0E7FF]',
      },
      {
        title: 'Brand Refresh',
        tool: 'Cinema 4D',
        bgGradient: 'from-[#ECFDF5] to-[#D1FAE5]',
      },
      {
        title: 'Product Launch',
        tool: 'Lottie',
        bgGradient: 'from-[#FFFBEB] to-[#FEF3C7]',
      },
      {
        title: 'Social Kit',
        tool: 'After Effects',
        bgGradient: 'from-[#FFF1F2] to-[#FFE4E6]',
      },
    ],
  },
  {
    id: 'f2',
    name: 'Rohan Sharma',
    role: 'Full-Stack Developer',
    initials: 'RS',
    avatarBg: 'bg-[#2563EB]',
    avatarColor: 'text-white',
    rating: 4.8,
    reviewCount: 52,
    status: 'Soon',
    skills: ['React', 'Node.js', 'TypeScript'],
    extraSkillsCount: 1,
    experience: '5 years exp.',
    hourlyRate: '₹1,500/hr',
  },
  {
    id: 'f3',
    name: 'Aisha Nair',
    role: 'Copywriter & Brand Strategist',
    initials: 'AN',
    avatarBg: 'bg-[#EA580C]',
    avatarColor: 'text-white',
    rating: 4.7,
    reviewCount: 29,
    status: 'Available',
    skills: ['Copywriting', 'Brand Strategy', 'Content Design'],
    extraSkillsCount: 1,
    experience: '4 years exp.',
    hourlyRate: '₹900/hr',
  },
  {
    id: 'f4',
    name: 'Dev Krishnan',
    role: 'Product Designer',
    initials: 'DK',
    avatarBg: 'bg-[#7C3AED]',
    avatarColor: 'text-white',
    rating: 4.9,
    reviewCount: 44,
    status: 'Available',
    skills: ['Figma', 'Product Design', 'UX Research'],
    extraSkillsCount: 1,
    experience: '7 years exp.',
    hourlyRate: '₹1,800/hr',
  },
  {
    id: 'f5',
    name: 'Sara Iyer',
    role: 'Illustrator & Visual Artist',
    initials: 'SI',
    avatarBg: 'bg-[#DB2777]',
    avatarColor: 'text-white',
    rating: 4.8,
    reviewCount: 21,
    status: 'Soon',
    skills: ['Illustration', 'Character Design', 'Procreate'],
    extraSkillsCount: 1,
    experience: '3 years exp.',
    hourlyRate: '₹1,000/hr',
  },
  {
    id: 'f6',
    name: 'Karthik Bose',
    role: 'Video Editor & Cinematographer',
    initials: 'KB',
    avatarBg: 'bg-[#DC2626]',
    avatarColor: 'text-white',
    rating: 4.6,
    reviewCount: 17,
    status: 'Available',
    skills: ['Premiere Pro', 'DaVinci Resolve', 'Color Grading'],
    extraSkillsCount: 1,
    experience: '5 years exp.',
    hourlyRate: '₹1,400/hr',
  },
]

type ModalStep = 'invite-form' | 'invitation-sent' | 'team-view' | 'view-profile'

export default function TeamCollabPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modal Flow state
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null)
  const [modalStep, setModalStep] = useState<ModalStep | null>(null)

  // Form states
  const [selectedProject, setSelectedProject] = useState<string>(
    'Brand Identity — Acme Studio'
  )
  const [invitationMessage, setInvitationMessage] = useState<string>('')

  // Open view profile modal
  const handleOpenProfile = (freelancer: Freelancer) => {
    setSelectedFreelancer(freelancer)
    setModalStep('view-profile')
  }

  // Open invite modal
  const handleOpenInvite = (freelancer: Freelancer) => {
    setSelectedFreelancer(freelancer)
    setInvitationMessage(
      `Hi ${freelancer.name}, I'm working on a project that I think could be a great fit for your skills. Would you be interested in collaborating?`
    )
    setModalStep('invite-form')
  }

  // Close modal
  const handleCloseModal = () => {
    setModalStep(null)
    setSelectedFreelancer(null)
  }

  // Handle Send Invitation -> Step 2
  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault()
    setModalStep('invitation-sent')
  }

  // Handle View Team -> Step 3
  const handleViewTeam = () => {
    setModalStep('team-view')
  }

  // Filtered freelancers
  const filteredFreelancers = freelancersList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 lg:p-8 shadow-xs font-manrope">
      <div className="flex w-full flex-col gap-6">
        {/* 1. TOP HEADER & SUBTITLE */}
        <div>
          <h1 className="font-manrope text-[24px] font-bold text-[#C06B3E] sm:text-[26px]">
            Team Collaboration
          </h1>
          <p className="mt-0.5 font-manrope text-[14px] text-[#7A7065]">
            Find and invite talented freelancers to collaborate on your projects.
          </p>
        </div>

        {/* 2. SEARCH BAR */}
        <div className="relative w-full max-w-[420px]">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9284]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill, or title..."
            className="w-full rounded-[14px] border border-[#E5DACD] bg-[#FCFBF8] py-2.5 pl-10 pr-4 font-manrope text-[13.5px] text-[#08182B] placeholder-[#9E9284] outline-none transition-all focus:border-[#C06B3E] focus:bg-white focus:ring-1 focus:ring-[#C06B3E]/30"
          />
        </div>

        {/* 3. FREELANCER CARDS GRID (2 Columns matching Image 1) */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredFreelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="flex flex-col justify-between rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/40 hover:shadow-md"
            >
              <div>
                {/* Header: Avatar, Name, Role, Rating & Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Monogram Avatar */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-manrope text-[16px] font-bold shadow-xs ${freelancer.avatarBg} ${freelancer.avatarColor}`}
                    >
                      {freelancer.initials}
                    </div>

                    <div>
                      <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                        {freelancer.name}
                      </h3>
                      <p className="font-manrope text-[13px] text-[#7A7065]">
                        {freelancer.role}
                      </p>
                      <div className="mt-1 flex items-center gap-1 font-manrope text-[12px] font-semibold text-[#08182B]">
                        <Star size={13} className="fill-[#F59E0B] text-[#F59E0B]" />
                        <span>{freelancer.rating}</span>
                        <span className="text-[#8E8376]">({freelancer.reviewCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${
                      freelancer.status === 'Available'
                        ? 'bg-[#E9F9EE] text-[#1F874C]'
                        : 'bg-[#FEF3C7] text-[#D97706]'
                    }`}
                  >
                    {freelancer.status}
                  </span>
                </div>

                {/* Skills tags */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {freelancer.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="rounded-[8px] bg-[#F4F4F5] px-2.5 py-1 font-manrope text-[11px] font-medium text-[#52525B]"
                    >
                      {skill}
                    </span>
                  ))}
                  {freelancer.extraSkillsCount && (
                    <span className="rounded-[8px] bg-[#F4F4F5] px-2 py-1 font-manrope text-[11px] font-medium text-[#71717A]">
                      +{freelancer.extraSkillsCount}
                    </span>
                  )}
                </div>

                {/* Experience & Hourly Rate */}
                <div className="mt-4 flex items-center justify-between border-t border-[#F4F4F5] pt-3">
                  <span className="font-manrope text-[12px] font-medium text-[#8E8376]">
                    {freelancer.experience}
                  </span>
                  <span className="font-manrope text-[15px] font-extrabold text-[#08182B]">
                    {freelancer.hourlyRate}
                  </span>
                </div>
              </div>

              {/* Action Buttons: View Profile & Invite */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenProfile(freelancer)}
                  className="rounded-[12px] border border-[#E5DACD] bg-white py-2.5 font-manrope text-[13px] font-bold text-[#08182B] transition-colors hover:bg-[#FAF7F2] active:scale-98"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenInvite(freelancer)}
                  className="rounded-[12px] bg-[#1E293B] py-2.5 font-manrope text-[13px] font-bold text-white shadow-xs transition-all hover:bg-[#0F172A] active:scale-98"
                >
                  Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL MULTI-STEP FLOW                               */}
      {/* ========================================================= */}
      {modalStep && selectedFreelancer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] transition-opacity"
          onClick={handleCloseModal}
        >
          <div
            className={`relative flex w-full max-h-[92vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all ${
              modalStep === 'view-profile' ? 'max-w-[760px]' : 'max-w-[480px]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F4F4F5] px-7 py-5 shrink-0 bg-white">
              {modalStep === 'invite-form' && (
                <div>
                  <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                    Invite to Collaborate
                  </h3>
                  <p className="font-manrope text-[12px] text-[#71717A] mt-0.5">
                    Send a collaboration invitation to {selectedFreelancer.name}
                  </p>
                </div>
              )}
              {modalStep === 'view-profile' && (
                <div>
                  <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                    Freelancer Profile
                  </h3>
                </div>
              )}
              {(modalStep === 'invitation-sent' || modalStep === 'team-view') && (
                <div className="w-full">
                  {/* Clean header for sent/team status */}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F4F5] text-[#71717A] transition-colors hover:bg-[#E4E4E7] hover:text-[#18181B] active:scale-95 ml-auto"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-7 py-6 custom-modal-scrollbar">
              {/* =================================================== */}
              {/* STEP 0: VIEW PROFILE MODAL (Attached Image)         */}
              {/* =================================================== */}
              {modalStep === 'view-profile' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start font-manrope">
                  {/* Left Column: Avatar, Identity, Stats & CTA (4.5 Cols) */}
                  <div className="flex flex-col gap-5 md:col-span-5">
                    {/* Identity Card */}
                    <div className="flex flex-col items-center rounded-[20px] border border-[#EBEBEB] bg-white p-6 text-center shadow-xs">
                      {/* Large Monogram Avatar */}
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full font-manrope text-[24px] font-bold shadow-md ${selectedFreelancer.avatarBg} ${selectedFreelancer.avatarColor}`}
                      >
                        {selectedFreelancer.initials}
                      </div>

                      {/* Name & Role */}
                      <h4 className="mt-3.5 font-manrope text-[18px] font-extrabold text-[#08182B]">
                        {selectedFreelancer.name}
                      </h4>
                      <p className="font-manrope text-[13px] text-[#786D61] mt-0.5">
                        {selectedFreelancer.role}
                      </p>

                      {/* Star Rating */}
                      <div className="mt-2 flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B]">
                        <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
                        <span>{selectedFreelancer.rating}</span>
                        <span className="font-medium text-[#8E8376]">
                          ({selectedFreelancer.reviewCount} reviews)
                        </span>
                      </div>

                      {/* Location & Availability */}
                      <div className="mt-4 flex flex-col gap-1.5 text-[12px] font-medium text-[#71717A]">
                        <div className="flex items-center gap-1.5 justify-center">
                          <MapPin size={13} className="text-[#9E9284]" />
                          <span>{selectedFreelancer.location || 'Bangalore, India'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center text-[#1F874C] font-semibold">
                          <Clock size={13} />
                          <span>{selectedFreelancer.availability || 'Available now'}</span>
                        </div>
                      </div>

                      {/* Invite to Collaborate CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenInvite(selectedFreelancer)}
                        className="mt-5 w-full rounded-[14px] bg-[#1E293B] py-3 font-manrope text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-[#0F172A] active:scale-98"
                      >
                        Invite to Collaborate
                      </button>
                    </div>

                    {/* Stats Card */}
                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] pb-3">
                        STATS
                      </span>

                      <div className="space-y-3 font-manrope text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Projects Completed</span>
                          <span className="font-extrabold text-[#08182B]">
                            {selectedFreelancer.projectsCompleted || 41}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Experience</span>
                          <span className="font-extrabold text-[#08182B]">
                            {selectedFreelancer.experience}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Hourly Rate</span>
                          <span className="font-extrabold text-[#08182B]">
                            {selectedFreelancer.hourlyRate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Availability</span>
                          <span className="font-extrabold text-[#1F874C]">
                            {selectedFreelancer.availability || 'Available now'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: About, Skills, Portfolio (7.5 Cols) */}
                  <div className="flex flex-col gap-5 md:col-span-7">
                    {/* About Card */}
                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                        About
                      </h4>
                      <p className="mt-2.5 font-manrope text-[13px] leading-relaxed text-[#594E42]">
                        {selectedFreelancer.about ||
                          'Motion designer specialising in product animations, explainer videos, and UI micro-interactions for SaaS companies.'}
                      </p>
                    </div>

                    {/* Skills Card */}
                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                        Skills
                      </h4>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {selectedFreelancer.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-[10px] border border-[#E5E5E5] bg-[#FAF8F5] px-3 py-1.5 font-manrope text-[12px] font-medium text-[#4A4036]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio Card (4-Box Grid) */}
                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <h4 className="font-manrope text-[15px] font-bold text-[#08182B] pb-3">
                        Portfolio
                      </h4>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {(
                          selectedFreelancer.portfolio || [
                            {
                              title: 'Campaign Visuals',
                              tool: 'After Effects',
                              bgGradient: 'from-[#EEF2FF] to-[#E0E7FF]',
                            },
                            {
                              title: 'Brand Refresh',
                              tool: 'Cinema 4D',
                              bgGradient: 'from-[#ECFDF5] to-[#D1FAE5]',
                            },
                            {
                              title: 'Product Launch',
                              tool: 'Lottie',
                              bgGradient: 'from-[#FFFBEB] to-[#FEF3C7]',
                            },
                            {
                              title: 'Social Kit',
                              tool: 'After Effects',
                              bgGradient: 'from-[#FFF1F2] to-[#FFE4E6]',
                            },
                          ]
                        ).map((item, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex flex-col overflow-hidden rounded-[16px] border border-[#EFECE6] bg-white shadow-2xs transition-all hover:border-[#C06B3E]/40 hover:shadow-xs"
                          >
                            {/* Graphic Thumbnail Placeholder with Star/Diamond shape */}
                            <div
                              className={`flex h-24 w-full items-center justify-center bg-gradient-to-br ${item.bgGradient}`}
                            >
                              {/* 4-pointed sparkle star icon */}
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-6 w-6 text-[#1E293B]"
                              >
                                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                              </svg>
                            </div>

                            {/* Title & Tool */}
                            <div className="p-3">
                              <h5 className="font-manrope text-[13px] font-bold text-[#08182B]">
                                {item.title}
                              </h5>
                              <p className="font-manrope text-[11px] text-[#8E8376]">
                                {item.tool}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* =================================================== */}
              {/* STEP 1: INVITATION FORM (Image 2)                   */}
              {/* =================================================== */}
              {modalStep === 'invite-form' && (
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  {/* Freelancer Summary Pill */}
                  <div className="flex items-center gap-3.5 rounded-[16px] bg-[#FAF8F5] p-3.5 border border-[#F0ECE6]">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-manrope text-[15px] font-bold ${selectedFreelancer.avatarBg} ${selectedFreelancer.avatarColor}`}
                    >
                      {selectedFreelancer.initials}
                    </div>
                    <div>
                      <h4 className="font-manrope text-[14.5px] font-bold text-[#08182B]">
                        {selectedFreelancer.name}
                      </h4>
                      <p className="font-manrope text-[12px] text-[#786D61]">
                        {selectedFreelancer.role}
                      </p>
                    </div>
                  </div>

                  {/* Project Selector */}
                  <div>
                    <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                      Project
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full appearance-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 pr-8 font-manrope text-[13px] font-medium text-[#18181B] outline-none focus:border-[#C06B3E]"
                      >
                        <option value="Brand Identity — Acme Studio">
                          Brand Identity — Acme Studio
                        </option>
                        <option value="Website Redesign — TechCorp">
                          Website Redesign — TechCorp
                        </option>
                        <option value="Mobile App UI — FinTech">
                          Mobile App UI — FinTech
                        </option>
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                      />
                    </div>
                  </div>

                  {/* Invitation Message */}
                  <div>
                    <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                      Invitation Message
                    </label>
                    <textarea
                      rows={4}
                      value={invitationMessage}
                      onChange={(e) => setInvitationMessage(e.target.value)}
                      className="w-full resize-none rounded-[14px] border border-[#E4E4E7] bg-white p-3 font-manrope text-[13px] leading-relaxed text-[#18181B] outline-none focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </div>

                  {/* Action Buttons: Cancel vs Send Invitation */}
                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 rounded-[12px] border border-[#E4E4E7] bg-white py-3 font-manrope text-[13.5px] font-semibold text-[#52525B] transition-colors hover:bg-[#F4F4F5] active:scale-98"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-[#C06B3E] py-3 font-manrope text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-98"
                    >
                      <Send size={14} />
                      <span>Send Invitation</span>
                    </button>
                  </div>
                </form>
              )}

              {/* =================================================== */}
              {/* STEP 2: INVITATION SENT SUCCESS (Image 3)           */}
              {/* =================================================== */}
              {modalStep === 'invitation-sent' && (
                <div className="space-y-5">
                  {/* Green Success Banner with Centered Checkmark */}
                  <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#E9F9EE] p-6 text-center border border-[#BBF7D0]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-xs mb-3">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="font-manrope text-[20px] font-extrabold text-[#15803D]">
                      Invitation Sent!
                    </h3>
                    <p className="mt-1 font-manrope text-[13px] text-[#166534]">
                      Your invitation has been sent to {selectedFreelancer.name}.
                    </p>
                  </div>

                  {/* Pending Invitation Summary Card */}
                  <div className="rounded-[18px] border border-[#E5E5E5] bg-white p-4 shadow-2xs">
                    <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] pb-3">
                      PENDING INVITATION
                    </span>

                    <div className="flex items-center justify-between pb-3 border-b border-[#F4F4F5]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-manrope text-[14px] font-bold ${selectedFreelancer.avatarBg} ${selectedFreelancer.avatarColor}`}
                        >
                          {selectedFreelancer.initials}
                        </div>
                        <div>
                          <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">
                            {selectedFreelancer.name}
                          </h4>
                          <p className="font-manrope text-[12px] text-[#71717A]">
                            {selectedFreelancer.role}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#D97706]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                        Pending
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 font-manrope text-[12.5px] text-[#52525B]">
                      <span className="text-[#8E8376]">Project:</span>
                      <span className="font-bold text-[#08182B]">
                        {selectedProject}
                      </span>
                    </div>
                  </div>

                  {/* View Team Button */}
                  <button
                    type="button"
                    onClick={handleViewTeam}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-98"
                  >
                    <Users2 size={16} />
                    <span>View Team</span>
                  </button>
                </div>
              )}

              {/* =================================================== */}
              {/* STEP 3: CREATED TEAM VIEW (Image 4)                 */}
              {/* =================================================== */}
              {modalStep === 'team-view' && (
                <div className="space-y-4">
                  {/* Top Dark Navy Announcement Banner */}
                  <div className="flex items-center gap-3 rounded-[16px] bg-[#0A182B] p-4 text-white shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-white">
                      <Users2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-manrope text-[14px] font-bold text-white">
                        Your team has been created.
                      </h4>
                      <p className="font-manrope text-[12px] text-[#CBD5E1]">
                        Your team is ready for{' '}
                        <span className="text-[#FBBF24]">
                          Brand Identity — Acme Studio
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  {/* 2-Columns Details Card */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Team Details Card */}
                    <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-3.5 shadow-2xs">
                      <span className="block font-manrope text-[10.5px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                        TEAM DETAILS
                      </span>
                      <div className="mt-2">
                        <span className="block text-[11px] text-[#71717A]">
                          Team Name
                        </span>
                        <h5 className="font-manrope text-[13.5px] font-bold text-[#08182B]">
                          Brand Identity Team
                        </h5>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[11px] text-[#71717A]">
                          Project
                        </span>
                        <h5 className="font-manrope text-[12px] font-bold text-[#08182B] truncate">
                          Brand Identity — Acme Studio
                        </h5>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[11px] text-[#71717A]">
                          Status
                        </span>
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 font-manrope text-[10.5px] font-bold text-[#16A34A]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Team Members Card */}
                    <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-3.5 shadow-2xs">
                      <span className="block font-manrope text-[10.5px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                        TEAM MEMBERS · 2
                      </span>

                      <div className="mt-2.5 space-y-2">
                        {/* Member 1: Arun Kumar */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[12px] font-bold text-white">
                            A
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-manrope text-[12.5px] font-bold text-[#08182B]">
                                Arun Kumar
                              </span>
                              <span className="rounded-full bg-[#EDE9FE] px-1.5 py-0.2 font-manrope text-[9.5px] font-bold text-[#7C3AED]">
                                You
                              </span>
                            </div>
                            <span className="block text-[10.5px] text-[#71717A]">
                              Lead Designer
                            </span>
                          </div>
                        </div>

                        {/* Member 2: Priya Menon */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-manrope text-[12px] font-bold ${selectedFreelancer.avatarBg} ${selectedFreelancer.avatarColor}`}
                          >
                            {selectedFreelancer.initials}
                          </div>
                          <div>
                            <span className="font-manrope text-[12.5px] font-bold text-[#08182B]">
                              {selectedFreelancer.name}
                            </span>
                            <span className="block text-[10.5px] text-[#71717A] truncate">
                              {selectedFreelancer.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Timeline Card */}
                  <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-4 shadow-2xs">
                    <span className="block font-manrope text-[10.5px] font-bold uppercase tracking-wider text-[#A1A1AA] pb-3">
                      ACTIVITY
                    </span>

                    <div className="space-y-3 font-manrope text-[12.5px]">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#6366F1]" />
                        <div>
                          <p className="text-[#18181B] font-medium">
                            You invited {selectedFreelancer.name} to collaborate.
                          </p>
                          <span className="text-[11px] text-[#A1A1AA]">Just now</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#10B981]" />
                        <div>
                          <p className="text-[#18181B] font-medium">
                            Team created for "Brand Identity — Acme Studio".
                          </p>
                          <span className="text-[11px] text-[#A1A1AA]">Just now</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Go to Project Workspace CTA Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal()
                      navigate('/freelancer/projects/1')
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-[14px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] active:scale-98"
                  >
                    Go to Project Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
