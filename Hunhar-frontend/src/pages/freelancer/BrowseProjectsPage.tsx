import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Clock,
  ChevronRight,
  LayoutGrid,
  Code,
  PenTool,
  Feather,
  Megaphone,
  Video,
  MoreHorizontal,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'
import leftBannerImage from '../../assets/BrowseProject_left_image.png'
import rightBannerImage from '../../assets/BrowseProject_Right_image.png'
import { projectsApi, type Project, type ProjectSearchParams } from '../../services/api'
import { CATEGORY_GROUPS, KNOWN_CLIENT_CATEGORIES, formatINR, splitList, timeAgo } from '../../services/format'

interface CategoryItem {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const categories: CategoryItem[] = [
  { id: 'all', name: 'All\nCategories', icon: LayoutGrid },
  { id: 'web', name: 'Web\nDevelopment', icon: Code },
  { id: 'design', name: 'Design &\nCreative', icon: PenTool },
  { id: 'writing', name: 'Writing &\nTranslation', icon: Feather },
  { id: 'marketing', name: 'Digital\nMarketing', icon: Megaphone },
  { id: 'video', name: 'Video &\nAnimation', icon: Video },
  { id: 'others', name: 'Others\n', icon: MoreHorizontal },
]

const budgetOptions: { label: string; min?: number; max?: number }[] = [
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹25,000', min: 10000, max: 25000 },
  { label: '₹25,000 +', min: 25000 },
]

const deadlineOptions: { label: string; maxDays: number }[] = [
  { label: 'Within 1 week', maxDays: 7 },
  { label: 'Within 2 weeks', maxDays: 14 },
  { label: 'Within 1 month', maxDays: 30 },
  { label: 'Within 2 months', maxDays: 60 },
]

const sortOptions: { label: string; value: NonNullable<ProjectSearchParams['sort']> }[] = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Highest budget', value: 'budget_desc' },
  { label: 'Lowest budget', value: 'budget_asc' },
  { label: 'Shortest timeline', value: 'deadline_asc' },
]

const PAGE_SIZE = 12

interface ProjectCardData {
  id: string
  category: string
  timeAgo: string
  title: string
  deadline: string
  client: string
  description: string
  budget: string
  tags: string[]
  extraTags: number
  status: string
  alreadyBid: boolean
}

const toCard = (p: Project): ProjectCardData => {
  const tags = splitList(p.skills)
  return {
    id: p.id,
    category: (p.category || 'General').toUpperCase(),
    timeAgo: timeAgo(p.createdAt),
    title: p.title,
    deadline: `${p.timelineDays} days`,
    client: p.clientName || 'Client',
    description: p.description,
    budget: formatINR(p.budget),
    tags: tags.slice(0, 3),
    extraTags: Math.max(0, tags.length - 3),
    status: `${p.bidCount} proposal${p.bidCount === 1 ? '' : 's'}`,
    alreadyBid: !!p.myBidStatus && p.myBidStatus !== 'WITHDRAWN',
  }
}

export default function BrowseProjectsPage(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '')
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchParams.get('q') || '')

  // Navbar search sends ?q=
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearchQuery(q)
    setDebouncedSearch(q)
  }, [searchParams])
  const [projectsList, setProjectsList] = useState<ProjectCardData[]>([])
  const [totalFound, setTotalFound] = useState<number>(0)
  const [page, setPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [reloadKey, setReloadKey] = useState<number>(0)

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<'budget' | 'deadline' | 'sort' | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<string>('')
  const [selectedDeadline, setSelectedDeadline] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<NonNullable<ProjectSearchParams['sort']>>('newest')
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Debounce typing so we don't hit the server on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Close dropdowns when clicking outside the toolbar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setActiveDropdown(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const buildParams = (pageNumber: number): ProjectSearchParams => {
    const budget = budgetOptions.find((b) => b.label === selectedBudget)
    const deadline = deadlineOptions.find((d) => d.label === selectedDeadline)
    return {
      categories: selectedCategory !== 'all' && selectedCategory !== 'others' ? CATEGORY_GROUPS[selectedCategory] : undefined,
      excludeCategories: selectedCategory === 'others' ? KNOWN_CLIENT_CATEGORIES : undefined,
      search: debouncedSearch || undefined,
      minBudget: budget?.min,
      maxBudget: budget?.max,
      maxDays: deadline?.maxDays,
      sort: selectedSort,
      page: pageNumber,
      size: PAGE_SIZE,
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    projectsApi
      .getProjects(buildParams(0))
      .then((res) => {
        if (cancelled) return
        setProjectsList(res.content.map(toCard))
        setTotalFound(res.totalElements)
        setPage(0)
        setHasMore(!res.last)
      })
      .catch((err) => {
        if (cancelled) return
        setProjectsList([])
        setTotalFound(0)
        setError(err.message || 'Could not load projects')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, debouncedSearch, selectedBudget, selectedDeadline, selectedSort, reloadKey])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const res = await projectsApi.getProjects(buildParams(page + 1))
      setProjectsList((prev) => [...prev, ...res.content.map(toCard)])
      setPage(page + 1)
      setHasMore(!res.last)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedBudget('')
    setSelectedDeadline('')
    setSelectedSort('newest')
  }
  const hasFilters = selectedCategory !== 'all' || !!debouncedSearch || !!selectedBudget || !!selectedDeadline

  const toggleDropdown = (name: 'budget' | 'deadline' | 'sort') => {
    setActiveDropdown((prev) => (prev === name ? null : name))
  }

  return (
    <div className="flex w-full flex-col gap-5 pb-12 font-manrope">
      {/* 1. TOP SECTION: White Rounded Card Container */}
      <section className="w-full rounded-[24px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs">
        {/* Page Title */}
        <div className="flex items-center gap-2 text-[#08182B]">
          <Search size={18} className="text-[#08182B]" />
          <h1 className="font-manrope text-[18px] sm:text-[20px] font-bold text-[#08182B]">
            Browse Project
          </h1>
        </div>

        {/* Hero Creative Banner matching uploaded design */}
        <div className="relative mt-4 flex min-h-[140px] sm:min-h-[160px] w-full items-center justify-between overflow-hidden rounded-[20px] border border-[#E9DFD3] bg-white px-2 py-2 sm:px-6">
          {/* Left Graphic Illustration */}
          <div className="relative hidden sm:flex h-[130px] sm:h-[150px] w-[200px] sm:w-[240px] items-center justify-start shrink-0">
            <img
              src={leftBannerImage}
              alt="Creative Left Illustration"
              className="h-full w-full object-contain object-left pointer-events-none select-none"
            />
          </div>

          {/* Center Text Header */}
          <div className="mx-auto flex flex-col items-center px-2 text-center">
            <h2 className="font-manrope text-[20px] sm:text-[24px] lg:text-[26px] font-extrabold tracking-tight text-[#08182B]">
              Find Projects
            </h2>
            <p className="mt-0.5 font-manrope text-[17px] sm:text-[21px] lg:text-[23px] font-extrabold text-[#08182B]">
              that match <span className="text-[#C06B3E]">your creativity.</span>
            </p>
            <p className="mt-2 font-manrope text-[13px] sm:text-[14px] font-medium text-[#7A7065]">
              Grow with hunhar
            </p>
          </div>

          {/* Right Graphic Illustration */}
          <div className="relative hidden sm:flex h-[130px] sm:h-[150px] w-[200px] sm:w-[240px] items-center justify-end shrink-0">
            <img
              src={rightBannerImage}
              alt="Creative Right Illustration"
              className="h-full w-full object-contain object-right pointer-events-none select-none"
            />
          </div>
        </div>

        {/* Category Filter Circles */}
        <div className="mt-6 flex flex-wrap items-start justify-center gap-5 sm:gap-8 lg:gap-11">
          {categories.map((cat) => {
            const IconComponent = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="group flex flex-col items-center gap-2 text-center transition-all outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none cursor-pointer"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                    isSelected
                      ? 'border-2 border-[#C06B3E] bg-[#F7EBE1] text-[#C06B3E] shadow-sm scale-105'
                      : 'border border-[#E5DACD] bg-[#FBF8F3] text-[#786E63] group-hover:border-[#C06B3E]/50 group-hover:text-[#C06B3E]'
                  }`}
                >
                  <IconComponent size={22} className="shrink-0" />
                </div>
                <span
                  className={`whitespace-pre-line text-[12px] font-semibold leading-tight ${
                    isSelected ? 'text-[#C06B3E]' : 'text-[#5C5348] group-hover:text-[#08182B]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. FILTER & SEARCH CONTROLS (White Pill Toolbar matching Figma UI) */}
      <section ref={toolbarRef} className="relative z-20 flex flex-col gap-3 rounded-[20px] border border-[#E5E5E5] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Project Search Input */}
          <div className="relative w-full max-w-[340px]">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8376]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, skill or keyword..."
              aria-label="Search projects"
              className="h-10 w-full rounded-full border border-[#E5DACD] bg-[#FDFBF7] pl-10 pr-4 font-manrope text-[13px] text-[#08182B] placeholder-[#9D9183] shadow-xs transition-all focus:border-[#C06B3E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
            />
          </div>

          {/* Filter Dropdowns with Figma Styled Popovers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Budget Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('budget')}
                className={`flex h-10 items-center gap-2 rounded-[12px] border px-4 font-manrope text-[13px] font-medium transition-all ${
                  activeDropdown === 'budget' || selectedBudget
                    ? 'border-[#C06B3E] bg-white text-[#C06B3E] shadow-xs'
                    : 'border-[#E0E0E0] bg-white text-[#2B2B2B] hover:border-[#C06B3E]/50'
                }`}
              >
                <span>{selectedBudget || 'Budget'}</span>
                <ChevronDown
                  size={15}
                  className={`text-[#666666] transition-transform duration-200 ${
                    activeDropdown === 'budget' ? 'rotate-180 text-[#C06B3E]' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'budget' && (
                <div className="absolute left-0 top-12 z-50 min-w-[170px] rounded-[16px] border border-[#EAEAEA] bg-white py-2 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                  {budgetOptions.map(({ label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setSelectedBudget(selectedBudget === label ? '' : label)
                        setActiveDropdown(null)
                      }}
                      className={`block w-full px-4 py-2 text-left font-manrope text-[13px] transition-colors ${
                        selectedBudget === label
                          ? 'bg-[#FBF4EE] font-bold text-[#C06B3E]'
                          : 'text-[#2B2B2B] hover:bg-[#F9F9F9] hover:text-[#C06B3E]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Deadline Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('deadline')}
                className={`flex h-10 items-center gap-2 rounded-[12px] border px-4 font-manrope text-[13px] font-medium transition-all ${
                  activeDropdown === 'deadline' || selectedDeadline
                    ? 'border-[#C06B3E] bg-white text-[#C06B3E] shadow-xs'
                    : 'border-[#E0E0E0] bg-white text-[#2B2B2B] hover:border-[#C06B3E]/50'
                }`}
              >
                <span>{selectedDeadline || 'Deadline'}</span>
                <ChevronDown
                  size={15}
                  className={`text-[#666666] transition-transform duration-200 ${
                    activeDropdown === 'deadline' ? 'rotate-180 text-[#C06B3E]' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'deadline' && (
                <div className="absolute left-0 top-12 z-50 min-w-[160px] rounded-[16px] border border-[#EAEAEA] bg-white py-2 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                  {deadlineOptions.map(({ label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setSelectedDeadline(selectedDeadline === label ? '' : label)
                        setActiveDropdown(null)
                      }}
                      className={`block w-full px-4 py-2 text-left font-manrope text-[13px] transition-colors ${
                        selectedDeadline === label
                          ? 'bg-[#FBF4EE] font-bold text-[#C06B3E]'
                          : 'text-[#2B2B2B] hover:bg-[#F9F9F9] hover:text-[#C06B3E]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('sort')}
                className={`flex h-10 items-center gap-2 rounded-[12px] border px-4 font-manrope text-[13px] font-medium transition-all ${
                  activeDropdown === 'sort' || selectedSort !== 'newest'
                    ? 'border-[#C06B3E] bg-white text-[#C06B3E] shadow-xs'
                    : 'border-[#E0E0E0] bg-white text-[#2B2B2B] hover:border-[#C06B3E]/50'
                }`}
              >
                <span>{sortOptions.find((o) => o.value === selectedSort)?.label}</span>
                <ChevronDown
                  size={15}
                  className={`text-[#666666] transition-transform duration-200 ${
                    activeDropdown === 'sort' ? 'rotate-180 text-[#C06B3E]' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'sort' && (
                <div className="absolute right-0 top-12 z-50 min-w-[170px] rounded-[16px] border border-[#EAEAEA] bg-white py-2 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedSort(opt.value)
                        setActiveDropdown(null)
                      }}
                      className={`block w-full px-4 py-2 text-left font-manrope text-[13px] transition-colors ${
                        selectedSort === opt.value
                          ? 'bg-[#FBF4EE] font-bold text-[#C06B3E]'
                          : 'text-[#2B2B2B] hover:bg-[#F9F9F9] hover:text-[#C06B3E]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Found Count */}
        <div className="pt-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-manrope text-[14px] font-extrabold text-[#08182B]">
              {loading ? 'Searching projects…' : `${totalFound.toString().padStart(2, '0')} Project${totalFound === 1 ? '' : 's'} Found`}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-manrope text-[12px] font-bold text-[#C06B3E] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. PROJECT CARDS GRID (3 Columns x Rows) */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-[20px] border border-[#E7DCCE] bg-white">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C06B3E] border-t-transparent" />
            <p className="font-manrope text-[14px] font-medium text-[#7A7065]">Loading projects…</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-[20px] border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-manrope text-[15px] font-bold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 rounded-full bg-[#08182B] px-4 py-1.5 font-manrope text-[12px] font-bold text-white"
          >
            Try again
          </button>
        </div>
      ) : projectsList.length === 0 ? (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-[20px] border border-[#E7DCCE] bg-white p-6 text-center">
          <p className="font-manrope text-[16px] font-bold text-[#08182B]">No projects found</p>
          <p className="mt-1 font-manrope text-[13px] text-[#7A7065]">
            {hasFilters ? 'Try other keywords or remove some filters.' : 'No open projects right now — new ones appear as soon as clients post them.'}
          </p>
        </div>
      ) : (
        <>
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projectsList.map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#E7DCCE] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-all hover:border-[#C06B3E]/50 hover:shadow-lg"
            >
              <div>
                {/* Header Tag + Time */}
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DACD] bg-[#FBF8F3] px-3 py-1 font-manrope text-[11px] font-bold tracking-wide text-[#9C5128]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C06B3E]" />
                    {project.category}
                  </span>
                  <span className="flex items-center gap-1 font-manrope text-[12px] font-medium text-[#9E9284]">
                    <Clock size={13} />
                    {project.timeAgo}
                  </span>
                </div>

                {/* Project Image Banner with Mascot Desk */}
                <div className="relative mb-3.5 h-[145px] w-full overflow-hidden rounded-[14px] bg-[#E8DDD0]">
                  <img
                    src={cardDeskMascot}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Title & Deadline */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                      {project.title}
                    </h4>
                    <p className="mt-0.5 text-[12px] text-[#918578]">{project.client}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-medium text-[#B8572A]">Timeline</span>
                    <span className="font-manrope text-[12px] font-bold text-[#863D1A]">
                      {project.deadline}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-2.5 line-clamp-2 font-manrope text-[12px] leading-relaxed text-[#73685C]">
                  {project.description}
                </p>

                {/* Budget */}
                <div className="mt-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A05C35]">
                    BUDGET{' '}
                  </span>
                  <span className="font-manrope text-[13px] font-extrabold text-[#08182B]">
                    {project.budget}
                  </span>
                </div>

                {/* Skill tags */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[8px] bg-[#F5ECE1] px-2.5 py-1 font-manrope text-[11px] font-medium text-[#6F6457]"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.extraTags > 0 && (
                    <span className="rounded-[8px] bg-[#F5ECE1] px-2 py-1 font-manrope text-[11px] font-bold text-[#6F6457]">
                      +{project.extraTags}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Bid Status & Action */}
              <div className="mt-4 flex items-center justify-between border-t border-[#F2E8DC] pt-3">
                <span className="inline-flex items-center gap-1.5 font-manrope text-[12px] font-bold text-[#1F874C]">
                  <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                  {project.alreadyBid ? 'You applied' : project.status}
                </span>

                <Link
                  to={`/freelancer/browse/${project.id}`}
                  className="flex items-center gap-1 font-manrope text-[12px] font-extrabold text-[#08182B] no-underline transition-colors hover:text-[#C06B3E]"
                >
                  {project.alreadyBid ? 'View' : 'View & Bid'}
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </section>
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full border border-[#DECFBE] bg-white px-6 py-2.5 font-manrope text-[13px] font-bold text-[#08182B] shadow-xs transition-colors hover:border-[#C06B3E] hover:text-[#C06B3E] disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load more projects'}
            </button>
          </div>
        )}
        </>
      )}
    </div>
  )
}
