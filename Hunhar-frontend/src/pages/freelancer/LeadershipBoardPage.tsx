import React, { useState } from 'react'
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Star,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import leadershipLuna from '../../assets/Leadership_luna.png'

interface LeaderboardUser {
  rank: number
  id: string
  name: string
  title: string
  category: string
  avatarText: string
  score: number
  bidsWon: number
  rating: number
  earnings: string
  badge: 'Gold' | 'Silver' | 'Bronze' | 'Top Rated' | 'Rising Star'
  isCurrentUser?: boolean
}

const mockLeaderboard: LeaderboardUser[] = [
  {
    rank: 1,
    id: 'u-1',
    name: 'Rajshankar.M',
    title: 'Senior UI/UX & Brand Strategist',
    category: 'Design & Creative',
    avatarText: 'RS',
    score: 9850,
    bidsWon: 42,
    rating: 4.98,
    earnings: '₹ 84,500',
    badge: 'Gold',
    isCurrentUser: true,
  },
  {
    rank: 2,
    id: 'u-2',
    name: 'Vikash Mehta',
    title: 'Full Stack React & Node Developer',
    category: 'Web Development',
    avatarText: 'VM',
    score: 9420,
    bidsWon: 38,
    rating: 4.95,
    earnings: '₹ 76,200',
    badge: 'Silver',
  },
  {
    rank: 3,
    id: 'u-3',
    name: 'Ananya Roy',
    title: 'Motion Designer & 3D Artist',
    category: 'Video & Animation',
    avatarText: 'AR',
    score: 8990,
    bidsWon: 35,
    rating: 4.92,
    earnings: '₹ 68,900',
    badge: 'Bronze',
  },
  {
    rank: 4,
    id: 'u-4',
    name: 'Arun Kumar',
    title: 'UI/UX Designer | Frontend Developer',
    category: 'Design & Creative',
    avatarText: 'A',
    score: 8450,
    bidsWon: 29,
    rating: 4.90,
    earnings: '₹ 18,240',
    badge: 'Top Rated',
  },
  {
    rank: 5,
    id: 'u-5',
    name: 'Rohan Verma',
    title: 'Illustrator & Character Designer',
    category: 'Design & Creative',
    avatarText: 'RV',
    score: 8120,
    bidsWon: 26,
    rating: 4.88,
    earnings: '₹ 45,600',
    badge: 'Top Rated',
  },
  {
    rank: 6,
    id: 'u-6',
    name: 'Kavita Das',
    title: 'Creative Copywriter & Content Strategist',
    category: 'Writing & Translation',
    avatarText: 'KD',
    score: 7850,
    bidsWon: 24,
    rating: 4.85,
    earnings: '₹ 38,400',
    badge: 'Rising Star',
  },
  {
    rank: 7,
    id: 'u-7',
    name: 'Aditya Sen',
    title: 'Brand Identity & Print Specialist',
    category: 'Design & Creative',
    avatarText: 'AS',
    score: 7540,
    bidsWon: 22,
    rating: 4.82,
    earnings: '₹ 34,000',
    badge: 'Rising Star',
  },
]

type TimeRange = 'week' | 'month' | 'all'
type CategoryFilter = 'all' | 'design' | 'web' | 'video'

export default function LeadershipBoardPage(): React.JSX.Element {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const top3 = mockLeaderboard.slice(0, 3)

  const filteredList = mockLeaderboard.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (categoryFilter === 'all') return matchesSearch
    if (categoryFilter === 'design')
      return matchesSearch && u.category.includes('Design')
    if (categoryFilter === 'web')
      return matchesSearch && u.category.includes('Web')
    if (categoryFilter === 'video')
      return matchesSearch && u.category.includes('Video')
    return matchesSearch
  })

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
              Recognizing the top performing freelancers and high-achieving creators on Hunhar.
            </p>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#EBE4DC] bg-[#FAF8F5] p-1">
            <button
              type="button"
              onClick={() => setTimeRange('week')}
              className={`rounded-full px-3.5 py-1 text-[12px] font-bold transition-all ${timeRange === 'week'
                ? 'bg-[#C06B3E] text-white shadow-xs'
                : 'text-[#7A7065] hover:text-[#08182B]'
                }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`rounded-full px-3.5 py-1 text-[12px] font-bold transition-all ${timeRange === 'month'
                ? 'bg-[#C06B3E] text-white shadow-xs'
                : 'text-[#7A7065] hover:text-[#08182B]'
                }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`rounded-full px-3.5 py-1 text-[12px] font-bold transition-all ${timeRange === 'all'
                ? 'bg-[#C06B3E] text-white shadow-xs'
                : 'text-[#7A7065] hover:text-[#08182B]'
                }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Hero Section: Top 3 Podium + Current User Standing Banner */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Your Current Standing Card (lg:col-span-4) */}
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
                  #1
                </span>
                <span className="font-manrope text-[14px] font-semibold text-[#16A34A]">
                  Top 1% Creator
                </span>
              </div>

              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-[#6E6458]">
                You are currently leading the platform as the <strong className="text-[#C06B3E]">#1 Top Creator</strong>!
              </p>
            </div>

            {/* Quick Metrics in Current Standing */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 rounded-[14px] border border-[#D9C8B5] bg-white/70 p-3 backdrop-blur-xs">
              <div className="flex flex-col text-center">
                <span className="text-[10px] font-bold text-[#8C9BA8] uppercase">SCORE</span>
                <span className="mt-0.5 text-[15px] font-bold text-[#08182B]">9,850</span>
              </div>
              <div className="flex flex-col border-x border-[#EFE5DB] text-center">
                <span className="text-[10px] font-bold text-[#8C9BA8] uppercase">WON BIDS</span>
                <span className="mt-0.5 text-[15px] font-bold text-[#C06B3E]">42</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-[10px] font-bold text-[#8C9BA8] uppercase">RATING</span>
                <span className="mt-0.5 flex items-center justify-center gap-0.5 text-[15px] font-bold text-[#08182B]">
                  4.98 <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
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
                    {top3[1].avatarText}
                  </div>
                  <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#94A3B8] text-[11px] font-bold text-white shadow-xs">
                    2
                  </div>
                </div>

                <h3 className="mt-3 font-manrope text-[14.5px] font-bold text-[#08182B]">
                  {top3[1].name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#8C9BA8]">
                  {top3[1].title}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                  <Medal size={12} className="text-[#94A3B8]" />
                  <span>{top3[1].score.toLocaleString()} pts</span>
                </div>
              </div>

              <div className="mt-4 w-full border-t border-[#EFECE6] pt-3 text-[12px] font-semibold text-[#16A34A]">
                {top3[1].bidsWon} Projects Done
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
                    {top3[0].avatarText}
                  </div>
                  <div className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F59E0B] text-[12px] font-bold text-white shadow-xs">
                    🥇
                  </div>
                </div>

                <h3 className="mt-3 font-manrope text-[15px] font-bold text-[#08182B]">
                  {top3[0].name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#8C9BA8]">
                  {top3[0].title}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FEF5E7] px-3 py-0.5 text-[11.5px] font-bold text-[#D97706]">
                  <Trophy size={13} className="text-[#F59E0B]" />
                  <span>{top3[0].score.toLocaleString()} pts</span>
                </div>
              </div>

              <div className="mt-4 w-full border-t border-[#F2EAE1] pt-3 text-[12.5px] font-bold text-[#C06B3E]">
                {top3[0].bidsWon} Projects Done
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="relative flex flex-col items-center justify-between rounded-[20px] border border-[#E2E8F0] bg-[#FAF8F5] p-5 text-center transition-all hover:border-[#CBD5E1] hover:shadow-sm">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F6ECE3] font-manrope text-[18px] font-bold text-[#A87146] ring-4 ring-[#E8D4C3]">
                    {top3[2].avatarText}
                  </div>
                  <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#B47444] text-[11px] font-bold text-white shadow-xs">
                    3
                  </div>
                </div>

                <h3 className="mt-3 font-manrope text-[14.5px] font-bold text-[#08182B]">
                  {top3[2].name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#8C9BA8]">
                  {top3[2].title}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FAF0E7] px-2.5 py-0.5 text-[11px] font-semibold text-[#A87146]">
                  <Award size={12} className="text-[#A87146]" />
                  <span>{top3[2].score.toLocaleString()} pts</span>
                </div>
              </div>

              <div className="mt-4 w-full border-t border-[#EFECE6] pt-3 text-[12px] font-semibold text-[#16A34A]">
                {top3[2].bidsWon} Projects Done
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
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all ${categoryFilter === 'all'
                ? 'bg-[#0A1629] text-white shadow-xs'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
                }`}
            >
              All Creators
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('design')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all ${categoryFilter === 'design'
                ? 'bg-[#0A1629] text-white shadow-xs'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
                }`}
            >
              Design & Creative
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('web')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all ${categoryFilter === 'web'
                ? 'bg-[#0A1629] text-white shadow-xs'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8F6F2]'
                }`}
            >
              Web Development
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('video')}
              className={`rounded-[10px] px-3.5 py-1.5 text-[12px] font-bold transition-all ${categoryFilter === 'video'
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
                  <th className="px-4 py-3.5 text-center">Bids Won</th>
                  <th className="px-4 py-3.5 text-center">Rating</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Badge</th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-[#F7F4F0] text-[13px]">
                {filteredList.map((user) => {
                  const isGold = user.rank === 1
                  const isSilver = user.rank === 2
                  const isBronze = user.rank === 3

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${user.isCurrentUser
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
                            className={`font-manrope text-[14px] ${user.isCurrentUser
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
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-xs ${user.isCurrentUser
                              ? 'bg-[#08182B] ring-2 ring-[#C06B3E]'
                              : 'bg-[#1E293B]'
                              }`}
                          >
                            {user.avatarText}
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
                              <CheckCircle2
                                size={13}
                                className="text-[#C06B3E]"
                              />
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

                      {/* Rating */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[#1A202C]">
                          {user.rating}{' '}
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
