import React, { useState, useRef } from 'react'
import {
  CheckCircle2,
  Edit3,
  MapPin,
  Globe,
  Star,
  Award,
  Plus,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Sparkles,
  Clock,
  Repeat,
  Check,
  Camera,
  Image as ImageIcon,
} from 'lucide-react'
import vikashImg from '../../assets/vikash.jpg'
import ImageCropModal from '../../components/common/ImageCropModal'

interface ProjectItem {
  id: string
  title: string
  category: string
  year: string
  bgColor: string
}

const portfolioProjects: ProjectItem[] = [
  {
    id: '1',
    title: 'Novu Brand Identity',
    category: 'Branding',
    year: '2026',
    bgColor: 'bg-[#EEF2FF]', // Soft lavender
  },
  {
    id: '2',
    title: 'Kova E-commerce UI',
    category: 'Web Design',
    year: '2025',
    bgColor: 'bg-[#ECFDF5]', // Soft mint
  },
  {
    id: '3',
    title: 'Lumos App Icons',
    category: 'Illustration',
    year: '2025',
    bgColor: 'bg-[#FFFBEB]', // Soft peach/amber
  },
  {
    id: '4',
    title: 'Aeris Motion Kit',
    category: 'Motion Design',
    year: '2024',
    bgColor: 'bg-[#FFF1F2]', // Soft rose
  },
]

const skillsList = [
  'Brand Identity',
  'UI/UX Design',
  'Figma',
  'Illustration',
  'Motion Design',
  'Typography',
  'Web Design',
  'After Effects',
]

export default function FreelancerProfilePage(): React.JSX.Element {
  const [portfolioUrl, setPortfolioUrl] = useState('https://Rajshankar/UIUXDesigner.com')
  const [isEditing, setIsEditing] = useState(false)
  const [profileBio, setProfileBio] = useState(
    `I'm a brand and UI designer with 5+ years of experience creating visual identities, digital products, and motion work for startups and growing companies. I care deeply about craft — clean type, purposeful colour, and design that actually communicates.\n\nPrevious clients include tech startups, creative agencies, and consumer brands across India, UAE, and the UK.`
  )
  const [profileName, setProfileName] = useState('Rajshankar.M')
  const [profileRole, setProfileRole] = useState('Brand & UI Designer')
  const [profileLocation, setProfileLocation] = useState('Chennai, India')

  // Cover & Avatar Upload States
  const [avatarImage, setAvatarImage] = useState<string>(vikashImg)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [tempCropImage, setTempCropImage] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTempCropImage(reader.result)
          setIsCropModalOpen(true)
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverImage(url)
    }
  }

  return (
    <div className="w-full font-manrope">
      {/* Hidden file inputs for uploads */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverChange}
        accept="image/*"
        className="hidden"
      />

      {/* Outer White Card Container matching Hunhar Design System */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* Main Grid: Left Column (Profile & Projects) + Right Column (Completion, Stats, Skills) */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          {/* ========================================================= */}
          {/* LEFT 8 COLUMNS: Cover, Avatar, Bio, Portfolio, Projects */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* 1. Hero Cover Banner & Floating Avatar */}
            <div className="relative group/cover">
              {/* Premium 3D Wavy Gradient Fluid Banner or Custom Uploaded Cover */}
              <div className="relative h-[160px] sm:h-[195px] w-full overflow-hidden rounded-[22px] bg-gradient-to-r from-[#94A3B8] via-[#FDBA74] to-[#F97316] shadow-inner">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover Banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    {/* Visual abstract overlay waves */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#64748B]/30 via-transparent to-white/20" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#EA580C]/25 blur-2xl" />
                    <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-[#FED7AA]/35 blur-3xl" />
                  </>
                )}

                {/* Edit / Change Cover Photo Button */}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1.5 font-manrope text-[11.5px] font-semibold text-white backdrop-blur-md transition-all hover:bg-black/80 hover:scale-102 active:scale-95 shadow-sm"
                  title="Change cover photo"
                >
                  <Camera size={13} className="text-white" />
                  <span>Change Cover</span>
                </button>
              </div>

              {/* Floating Avatar with Edit Badge */}
              <div className="absolute -bottom-10 left-6 sm:left-8 group/avatar">
                <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-[#EAB308] p-1 shadow-lg ring-4 ring-white overflow-hidden">
                  <img
                    src={avatarImage}
                    alt={profileName}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>

                {/* Camera Icon Overlay button to Upload/Edit Avatar */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-md ring-2 ring-white transition-all hover:bg-[#A95A30] hover:scale-110 active:scale-95"
                  title="Upload / Change profile picture"
                  aria-label="Upload profile picture"
                >
                  <Camera size={14} />
                </button>
              </div>
            </div>

            {/* 2. Freelancer Identity & Edit Button */}
            <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                {/* Name & Verified Badge */}
                {isEditing ? (
                  <div className="flex flex-col gap-2 max-w-sm">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your Full Name"
                      className="rounded-[10px] border border-[#CBD5E1] px-3 py-1.5 font-manrope text-[18px] font-bold text-[#08182B] focus:border-[#C06B3E] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={profileRole}
                      onChange={(e) => setProfileRole(e.target.value)}
                      placeholder="Your Professional Role / Headline"
                      className="rounded-[10px] border border-[#CBD5E1] px-3 py-1 text-[13px] text-[#64748B] focus:border-[#C06B3E] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      placeholder="Location (e.g. Chennai, India)"
                      className="rounded-[10px] border border-[#CBD5E1] px-3 py-1 text-[12px] text-[#64748B] focus:border-[#C06B3E] focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="font-manrope text-[24px] sm:text-[26px] font-bold text-[#08182B]">
                        {profileName}
                      </h1>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#86EFAC] bg-[#F0FDF4] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#16A34A]">
                        <CheckCircle2 size={13} className="text-[#16A34A]" />
                        Verified Profile
                      </span>
                    </div>

                    {/* Role / Headline */}
                    <p className="mt-1 font-manrope text-[15px] font-medium text-[#64748B]">
                      {profileRole}
                    </p>

                    {/* Location & Website */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[12.5px] text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#94A3B8]" />
                        <span>{profileLocation}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} className="text-[#94A3B8]" />
                        <a
                          href={`https://${portfolioUrl.replace('https://', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#64748B] hover:text-[#C06B3E] hover:underline"
                        >
                          {portfolioUrl.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Side of Header: Edit Profile Button & Rating */}
              <div className="flex flex-col sm:items-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CBD5E1] bg-white px-4 py-2 font-manrope text-[12.5px] font-semibold text-[#08182B] shadow-xs transition-all hover:bg-[#F8FAFC] active:scale-98"
                >
                  <Edit3 size={13} className="text-[#64748B]" />
                  <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
                </button>

                {/* Rating & Badge Pill */}
                <div className="flex flex-col sm:items-end gap-1.5">
                  <div className="flex items-center gap-1 text-[13px] font-bold text-[#08182B]">
                    <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
                    <span>4.9</span>
                    <span className="font-normal text-[#8C9BA8]">(23 reviews)</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF5E7] px-3 py-1 font-manrope text-[11px] font-bold text-[#D97706]">
                    <Award size={12} className="text-[#D97706]" />
                    <span>Skilled Freelancer · Rank #47</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. About Section */}
            <div className="mt-2 flex flex-col">
              <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                About
              </h2>

              {isEditing ? (
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={5}
                  className="mt-2.5 w-full rounded-[14px] border border-[#CBD5E1] p-3 font-manrope text-[13.5px] leading-relaxed text-[#4A5568] outline-none focus:border-[#C06B3E]"
                />
              ) : (
                <div className="mt-2.5 space-y-3 font-manrope text-[13.5px] leading-relaxed text-[#4A5568]">
                  {profileBio.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Portfolio Input Box (Matching design) */}
            <div className="mt-4 flex flex-col">
              <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                Portfolio
              </h2>
              <div className="mt-2.5">
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  disabled={!isEditing}
                  className={`h-11 w-full rounded-[12px] border border-[#E2E8F0] px-4 font-manrope text-[13px] text-[#4A5568] transition-all ${isEditing
                    ? 'bg-white focus:border-[#C06B3E] focus:outline-none'
                    : 'bg-[#FAF8F5]'
                    }`}
                />
              </div>
            </div>

            {/* 5. Projects Section (2x2 Grid) */}
            <div className="mt-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Projects
                </h2>
                <button
                  type="button"
                  onClick={() => alert('Add Project modal opened')}
                  className="font-manrope text-[12.5px] font-bold text-[#C06B3E] hover:underline"
                >
                  + Add Project
                </button>
              </div>

              {/* 2x2 Project Grid matching exact cards in image */}
              <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {portfolioProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex flex-col overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white transition-all duration-200 hover:border-[#D1D5DB] hover:shadow-sm"
                  >
                    {/* Top colored preview container with centered spark icon */}
                    <div
                      className={`flex h-[130px] w-full items-center justify-center ${project.bgColor} transition-transform group-hover:scale-[1.01]`}
                    >
                      {/* Diamond Star Shape icon matching design */}
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5 text-[#0F172A] opacity-90 transition-transform group-hover:scale-110"
                      >
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                      </svg>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="flex flex-col p-4">
                      <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">
                        {project.title}
                      </h3>
                      <p className="mt-0.5 font-manrope text-[12px] text-[#8C9BA8]">
                        {project.category} · {project.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT 4 COLUMNS: Profile Completion, Stats, Skills        */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* 1. Profile Completion Card */}
            <div className="flex flex-col rounded-[22px] border border-[#F2ECE6] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Profile Completion
                </span>
                <span className="font-manrope text-[15px] font-bold text-[#08182B]">
                  80%
                </span>
              </div>

              {/* Progress bar matching exact rounded style */}
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                <div
                  className="h-full rounded-full bg-[#C06B3E]"
                  style={{ width: '80%' }}
                />
              </div>

              <p className="mt-3 font-manrope text-[12px] text-[#8C9BA8]">
                Add portfolio and certifications to reach 100%.
              </p>

              {/* Complete Profile Button - exact full width pill */}
              <button
                type="button"
                onClick={() => alert('Opening profile verification...')}
                className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#C06B3E] font-manrope text-[13px] font-bold text-white shadow-xs transition-all hover:bg-[#A95A30] active:scale-98"
              >
                Complete Profile
              </button>
            </div>

            {/* 2. Stats Card */}
            <div className="flex flex-col rounded-[22px] border border-[#F2ECE6] bg-white p-5 sm:p-6">
              <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">
                Stats
              </h2>

              <div className="mt-4 flex flex-col space-y-3.5 font-manrope text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Projects Completed</span>
                  <span className="font-bold text-[#08182B]">23</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">On-time Delivery</span>
                  <span className="font-bold text-[#08182B]">96%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Repeat Clients</span>
                  <span className="font-bold text-[#08182B]">8</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Avg. Response</span>
                  <span className="font-bold text-[#08182B]">&lt; 2 hrs</span>
                </div>
              </div>
            </div>

            {/* 3. Skills Card */}
            <div className="flex flex-col rounded-[22px] border border-[#F2ECE6] bg-white p-5 sm:p-6">
              <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">
                Skills
              </h2>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {skillsList.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-[12px] border border-[#E2E8F0] bg-white px-3.5 py-1.5 font-manrope text-[12px] font-medium text-[#475569] transition-colors hover:border-[#C06B3E] hover:text-[#C06B3E]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn-style Profile Image Crop Modal */}
      {tempCropImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={tempCropImage}
          title="Adjust Profile Picture"
          aspectRatio="circle"
          onClose={() => {
            setIsCropModalOpen(false)
            setTempCropImage(null)
          }}
          onSave={(croppedUrl) => {
            setAvatarImage(croppedUrl)
          }}
        />
      )}
    </div>
  )
}
