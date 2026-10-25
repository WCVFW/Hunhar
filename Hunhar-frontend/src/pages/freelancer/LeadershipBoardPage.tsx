import React, { useState, useEffect } from 'react'
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Star,
  TrendingUp,
  Search,
  Sparkles,
} from 'lucide-react'
import leadershipLuna from '../../assets/Leadership_luna.png'
import { fileUrl, leaderboardApi, tokenStorage, type LeaderboardEntry } from '../../services/api'
import { formatINR, initials } from '../../services/format'

interface LeaderboardUser {
  rank: number
  id: string
  name: string
  title: string
  category: string
  avatarText: string
  avatarUrl?: string
  score: number
  bidsWon: number
  rating: number
  earnings: string
  badge: 'Gold' | 'Silver' | 'Bronze' | 'Top Rated' | 'Rising Star'
  skills: string[]
  isCurrentUser?: boolean
}

type CategoryFilter = 'all' | 'design' | 'web' | 'video'

const CATEGORY_KEYWORDS: Record<Exclude<CategoryFilter, 'all'>, string[]> = {
  design: ['design', 'ui', 'ux', 'figma', 'brand', 'illustrat', 'logo', 'graphic', 'photo'],
  web: ['web', 'react', 'develop', 'javascript', 'typescript', 'node', 'java', 'python', 'frontend', 'backend', 'full stack', 'it'],
  video: ['video', 'motion', 'animation', 'after effects', 'edit', 'premiere'],
}

const categoryOf = (skills: string[]): string => {
  const s = skills.join(' ').toLowerCase()
  if (CATEGORY_KEYWORDS.design.some((k) => s.includes(k))) return 'Design & Creative'
  if (CATEGORY_KEYWORDS.web.some((k) => s.includes(k))) return 'Web Development'
  if (CATEGORY_KEYWORDS.video.some((k) => s.includes(k))) return 'Video & Motion'
  return skills[0] || '—'
}

const toUser = (entry: LeaderboardEntry, myId?: string): LeaderboardUser => {
  const rank = entry.rank
  return {
    rank,
    id: entry.userId,
    name: entry.fullName,
    title: entry.professionalTitle || (entry.skills.length ? entry.skills.slice(0, 2).join(' · ') : 'Freelancer'),
    category: categoryOf(entry.skills),
    avatarText: initials(entry.fullName),
    avatarUrl: entry.avatarUrl,
    score: Math.round(entry.leaderboardScore),
    bidsWon: entry.completedProjects,
    rating: entry.rating,
    earnings: formatINR(entry.revenueGenerated),
    badge: rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : rank === 3 ? 'Bronze' : entry.completedProjects >= 5 ? 'Top Rated' : 'Rising Star',
    skills: entry.skills,
    isCurrentUser: entry.userId === myId,
  }
}

export default function LeadershipBoardPage(): React.JSX.Element {
  const myId: string | undefined = tokenStorage.getUser()?.id
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [me, setMe] = useState<LeaderboardUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.allSettled([leaderboardApi.getLeaderboard(100), leaderboardApi.getMyStanding()]).then(([list, mine]) => {
      if (list.status === 'fulfilled') setUsers(list.value.map((e) => toUser(e, myId)))
      else setError(list.reason?.message || 'Could not load the leaderboard')
      if (mine.status === 'fulfilled') setMe(toUser(mine.value, myId))
      setLoading(false)
    })
  }, [myId])

  const rank1 = users.find((u) => u.rank === 1) || null
  const rank2 = users.find((u) => u.rank === 2) || null
  const rank3 = users.find((u) => u.rank === 3) || null
  const currentUserStanding = me

  const filteredList = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q || u.name.toLowerCase().includes(q) || u.title.toLowerCase().includes(q) || u.skills.some((s) => s.toLowerCase().includes(q))
    if (categoryFilter === 'all') return matchesSearch
    const hay = u.skills.join(' ').toLowerCase()
    return matchesSearch && CATEGORY_KEYWORDS[categoryFilter].some((k) => hay.includes(k))
  })

  const ratingText = (u: LeaderboardUser | null) => (u && u.bidsWon > 0 && u.rating > 0 ? u.rating.toFixed(1) : '—')

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching Hunhar Design System */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* Title Header Row */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#F0ECE6] pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-[#C06B3E]" />
              <h1 className="font-manrope text-[22px] font-bold text-[#C06B3E]">
                Leadership Board
              </h1>
            </div>
            <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">
              Recognizing the top performing freelancers and high-achieving creators on Hunhar.in.
            </p>
          </div>

          <span className="rounded-full border border-[#EBE4DC] bg-[#FAF8F5] px-3.5 py-1.5 text-[12px] font-bold text-[#7A7065]">
            {users.length} ranked freelancer{users.length === 1 ? '' : 's'} · all time
          </span>
        </div>

        {/* Hero Section: Top 3 Podium + Current User Standing Banner */}
        {error && <div className="mt-6 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>}

        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Your Current Standing Card (lg:col-span-5) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#DECFBE] bg-[#EFE5DB] p-6 lg:col-span-5 shadow-xs">
            {/* Background Luna Accent */}
            <div className="pointer-events-none absolute -bottom-6 right-2 h-44 w-44 rounded-full bg-[#D7A97E]/30" />
            <img
              src={leadershipLuna}
              alt="Hunhar Mascot Luna"
              className="pointer-events-none absolute -bottom-2 right-2 h-36 w-36 object-contain opacity-85 select-none"
            />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C06B3E]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#C06B3E]">
                <Flame size={13} className="text-[#C06B3E]" />
                Your Rank Standing
              </span>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-manrope text-[40px] font-extrabold leading-none text-[#08182B]">
                  {currentUserStanding ? `#${currentUserStanding.rank}` : '—'}
                </span>
                <span className="font-manrope text-[14px] font-semibold text-[#16A34A]">
                  {currentUserStanding ? `of ${Math.max(users.length, currentUserStanding.rank)}` : ''}
                </span>
              </div>

              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-[#6E6458]">
                {currentUserStanding ? (
                  <span>
                    Complete projects and earn great reviews to climb, <strong className="text-[#C06B3E]">{currentUserStanding.name.split(' ')[0]}</strong>.
                  </span>
                ) : (
                  <span>{loading ? 'Loading your standing…' : 'Your rank appears once your freelancer profile is set up.'}</span>
                )}
              </p>
            </div>

            {/* Quick Metrics in Current Standing */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 rounded-[14px] border border-[#D9C8B5] bg-white/70 p-3 backdrop-blur-xs">
              <div className="flex flex-col text-center">
                <span className="text-[10px] font-bold text-[#8C9BA8] uppercase">SCORE</span>
                <span className="mt-0.5 text-[15px] font-bold text-[#08182B]">
                  {currentUserStanding ? currentUserStanding.score.toLocaleString('en-IN') : '—'}
                </span>
              </div>
              <div className="flex flex-col border-x border-[#EFE5DB] text-center">
                <span className="text-[10px] font-bold text-[#8C9BA8] uppercase">PROJECTS</span>
                <span className="mt-0.5 text-[15px] font-bold text-[#C06B3E]">
                  {currentUserStanding?.bidsWon ?? '—'}
                </span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[10px] font-bold text-[#8C9BA8] uppercase">RATING</span>
                <span className="mt-0.5 flex items-center justify-center gap-0.5 text-[15px] font-bold text-[#08182B]">
                  {ratingText(currentUserStanding)} <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                </span>
              </div>
            </div>
          </div>

          {/* Right: Top 3 Creators Spotlight (lg:col-span-7) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
            {/* Rank 2 (Silver) */}
            <div className="relative flex flex-col items-center justify-between rounded-[20px] border border-[#E2E8F0] bg-[#FAF8F5] p-5 text-center transition-all hover:border-[#CBD5E1] hover:shadow-sm">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E2E8F0] font-manrope text-[18px] font-bold text-[#475569] ring-4 ring-[#CBD5E1]">
                    {rank2?.avatarUrl ? <img src={fileUrl(rank2.avatarUrl)} alt="" className="h-full w-full rounded-full object-cover" /> : rank2 ? rank2.avatarText : '2'}
                  </div>
                  <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#94A3B8] text-[11px] font-bold text-white shadow-xs">
                    2
                  </div>
                </div>

                <h3 className="mt-3 font-manrope text-[14.5px] font-bold text-[#08182B] truncate max-w-[140px]">
                  {rank2 ? rank2.name : 'Spot Open'}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#8C9BA8]">
                  {rank2 ? rank2.title : 'Compete to rank #2'}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                  <Medal size={12} className="text-[#94A3B8]" />
                  <span>{rank2 ? `${rank2.score.toLocaleString()} pts` : '—'}</span>
                </div>
              </div>

              <div className="mt-4 w-full border-t border-[#EFECE6] pt-3 text-[12px] font-semibold text-[#16A34A]">
                {rank2 ? `${rank2.bidsWon} Projects Done` : 'Open Position'}
              </div>
            </div>

            {/* Rank 1 (Gold - Elevated Card) */}
            <div className="relative flex flex-col items-center justify-between rounded-[20px] border-2 border-[#DEBBA5] bg-[#FFFBF7] p-5 text-center shadow-md">
              {/* Crown / Top Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-[#C06B3E] px-3 py-0.5 font-manrope text-[10.5px] font-bold text-white shadow-xs uppercase tracking-wider">
                  <Sparkles size={11} />
                  Rank #1
                </span>
              </div>

              <div className="mt-2 flex flex-col items-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#08182B] font-manrope text-[20px] font-bold text-[#FFD700] ring-4 ring-[#E8B896]">
                    {rank1?.avatarUrl ? <img src={fileUrl(rank1.avatarUrl)} alt="" className="h-full w-full rounded-full object-cover" /> : rank1 ? rank1.avatarText : '1'}
                  </div>
                  <div className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F59E0B] text-[12px] font-bold text-white shadow-xs">
                    🥇
                  </div>
                </div>

                <h3 className="mt-3 font-manrope text-[15px] font-bold text-[#08182B] truncate max-w-[150px]">
                  {rank1 ? rank1.name : 'Spot Open'}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#8C9BA8]">
                  {rank1 ? rank1.title : 'Be the first to rank #1'}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FEF5E7] px-3 py-0.5 text-[11.5px] font-bold text-[#D97706]">
                  <Trophy size={13} className="text-[#F59E0B]" />
                  <span>{rank1 ? `${rank1.score.toLocaleString()} pts` : '—'}</span>
                </div>
              </div>

              <div className="mt-4 w-full border-t border-[#F2EAE1] pt-3 text-[12.5px] font-bold text-[#C06B3E]">
                {rank1 ? `${rank1.bidsWon} Projects Done` : 'Leaderboard Peak'}
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="relative flex flex-col items-center justify-between rounded-[20px] border border-[#E2E8F0] bg-[#FAF8F5] p-5 text-center transition-all hover:border-[#CBD5E1] hover:shadow-sm">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F6ECE3] font-manrope text-[18px] font-bold text-[#A87146] ring-4 ring-[#E8D4C3]">
                    {rank3?.avatarUrl ? <img src={fileUrl(rank3.avatarUrl)} alt="" className="h-full w-full rounded-full object-cover" /> : rank3 ? rank3.avatarText : '3'}
                  </div>
                  <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#B47444] text-[11px] font-bold text-white shadow-xs">
                    3
                  </div>
                </div>

                <h3 className="mt-3 font-manrope text-[14.5px] font-bold text-[#08182B] truncate max-w-[140px]">
                  {rank3 ? rank3.name : 'Spot Open'}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#8C9BA8]">
                  {rank3 ? rank3.title : 'Compete to rank #3'}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FAF0E7] px-2.5 py-0.5 text-[11px] font-semibold text-[#A87146]">
                  <Award size={12} className="text-[#A87146]" />
                  <span>{rank3 ? `${rank3.score.toLocaleString()} pts` : '—'}</span>
                </div>
              </div>

              <div className="mt-4 w-full border-t border-[#EFECE6] pt-3 text-[12px] font-semibold text-[#16A34A]">
                {rank3 ? `${rank3.bidsWon} Projects Done` : 'Open Position'}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#0A1629] text-white shadow-xs'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
              }`}
            >
              All Creators
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('design')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                categoryFilter === 'design'
                  ? 'bg-[#0A1629] text-white shadow-xs'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
              }`}
            >
              Design & Creative
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('web')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                categoryFilter === 'web'
                  ? 'bg-[#0A1629] text-white shadow-xs'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
              }`}
            >
              Web Development
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('video')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                categoryFilter === 'video'
                  ? 'bg-[#0A1629] text-white shadow-xs'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
              }`}
            >
              Video & Motion
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              placeholder="Search creator name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-[10px] border border-[#E2E8F0] bg-white pl-9 pr-3 text-[12.5px] outline-none transition-all focus:border-[#C06B3E]"
            />
          </div>
        </div>

        {/* Full Leaderboard Table Card */}
        <div className="mt-4 overflow-hidden rounded-[20px] border border-[#F0ECE6] bg-[#FFFFFF]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-manrope">
              {/* Header */}
              <thead>
                <tr className="border-b border-[#F0ECE6] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#8C9BA8]">
                  <th className="py-3.5 pl-6 pr-3">Rank</th>
                  <th className="px-4 py-3.5">Freelancer</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Score</th>
                  <th className="px-4 py-3.5 text-center">Projects</th>
                  <th className="px-4 py-3.5 text-right">Earned</th>
                  <th className="px-4 py-3.5 text-center">Rating</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Badge</th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-[#F7F4F0] text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[13.5px] text-[#8C9BA8]">
                      Loading leaderboard…
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[13.5px] text-[#8C9BA8]">
                      {users.length ? 'No freelancers match your search.' : 'No freelancers ranked yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredList.map((user) => {
                    const isGold = user.rank === 1
                    const isSilver = user.rank === 2
                    const isBronze = user.rank === 3

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${
                          user.isCurrentUser
                            ? 'bg-[#FEF8F3] hover:bg-[#FDF4EB]'
                            : 'hover:bg-[#FCFBF9]'
                        }`}
                      >
                        {/* Rank Number */}
                        <td className="py-4 pl-6 pr-3 font-extrabold">
                          {isGold && <span className="text-[17px]">🥇</span>}
                          {isSilver && <span className="text-[17px]">🥈</span>}
                          {isBronze && <span className="text-[17px]">🥉</span>}
                          {!isGold && !isSilver && !isBronze && (
                            <span
                              className={`font-manrope text-[14px] ${
                                user.isCurrentUser
                                  ? 'text-[#C06B3E] font-bold'
                                  : 'text-[#8C9BA8]'
                              }`}
                            >
                              #{user.rank}
                            </span>
                          )}
                        </td>

                        {/* Freelancer Profile Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-xs ${
                                user.isCurrentUser
                                  ? 'bg-[#08182B] ring-2 ring-[#C06B3E]'
                                  : 'bg-[#1E293B]'
                              }`}
                            >
                              {user.avatarUrl ? (
                                <img src={fileUrl(user.avatarUrl)} alt="" className="h-full w-full rounded-full object-cover" />
                              ) : (
                                user.avatarText
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#08182B]">
                                  {user.name}
                                </span>
                                {user.isCurrentUser && (
                                  <span className="rounded-full bg-[#C06B3E] px-2 py-0.2 text-[10px] font-bold text-white">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11.5px] text-[#8C9BA8]">
                                {user.title}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 text-[12.5px] text-[#64748B]">
                          {user.category}
                        </td>

                        {/* Points / Score */}
                        <td className="px-4 py-4 text-center font-bold text-[#08182B]">
                          {user.score.toLocaleString()}
                        </td>

                        {/* Projects / Bids Won */}
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-[#C06B3E]">
                            <TrendingUp size={13} />
                            {user.bidsWon}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right font-semibold text-[#08182B]">{user.earnings}</td>

                        {/* Rating */}
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-[#1A202C]">
                            {ratingText(user)}{' '}
                            <Star
                              size={11}
                              className="fill-[#F59E0B] text-[#F59E0B]"
                            />
                          </span>
                        </td>

                        {/* Badge / Standing Status */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          {user.badge === 'Gold' && (
                            <span className="inline-flex rounded-full bg-[#FEF5E7] px-2.5 py-0.5 text-[11px] font-bold text-[#D97706]">
                              Gold Elite
                            </span>
                          )}
                          {user.badge === 'Silver' && (
                            <span className="inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-bold text-[#475569]">
                              Silver Pro
                            </span>
                          )}
                          {user.badge === 'Bronze' && (
                            <span className="inline-flex rounded-full bg-[#FAF0E7] px-2.5 py-0.5 text-[11px] font-bold text-[#B47444]">
                              Bronze Star
                            </span>
                          )}
                          {user.badge === 'Top Rated' && (
                            <span className="inline-flex rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                              Top Rated
                            </span>
                          )}
                          {user.badge === 'Rising Star' && (
                            <span className="inline-flex rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                              Rising Star
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
