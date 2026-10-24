import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  DollarSign,
  Briefcase,
  MessageSquare,
  Sparkles,
  Coins,
  Clock,
  Star,
  ShieldAlert,
  ArrowRight,
  Check,
  Trash2,
  Filter,
  ExternalLink,
} from 'lucide-react'

export type NotificationCategory = 'all' | 'bids' | 'payments' | 'projects' | 'system'

export interface FreelancerNotificationItem {
  id: string
  title: string
  description: string
  time: string
  category: 'bids' | 'payments' | 'projects' | 'system'
  read: boolean
  actionUrl?: string
  actionLabel?: string
  iconType: 'bid_accepted' | 'payment_received' | 'message' | 'invite' | 'credit_refill' | 'milestone' | 'review'
  amount?: string
  clientName?: string
}

export const mockNotifications: FreelancerNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Bid Accepted! 🎉',
    description: 'Orbit Studios accepted your bid of ₹14,500 for "Mobile App UI Design (Figma)". The workspace room is now ready.',
    time: '12 mins ago',
    category: 'bids',
    read: false,
    actionUrl: '/freelancer/projects/p-1',
    actionLabel: 'Open Workspace',
    iconType: 'bid_accepted',
    clientName: 'Alex Morgan (Orbit Studios)',
  },
  {
    id: 'notif-2',
    title: 'Milestone Payment Released to Wallet 💰',
    description: '₹8,500 has been released from escrow to your wallet for completing Milestone #1: Wireframes.',
    time: '2 hours ago',
    category: 'payments',
    read: false,
    actionUrl: '/freelancer/wallet',
    actionLabel: 'View Wallet',
    iconType: 'payment_received',
    amount: '₹8,500',
  },
  {
    id: 'notif-3',
    title: 'New Direct Project Invitation 🚀',
    description: 'FinPulse Labs sent you an exclusive invite to submit a proposal for "Fintech Landing Page & Dashboard UI".',
    time: '5 hours ago',
    category: 'projects',
    read: false,
    actionUrl: '/freelancer/browse',
    actionLabel: 'Review Invitation',
    iconType: 'invite',
    clientName: 'FinPulse Labs',
  },
  {
    id: 'notif-4',
    title: 'New Client Message 💬',
    description: 'Sarah from GreenTech sent you 2 messages in "Brand Guidelines & Asset Kit": "Hey Arun, can we test a darker terracotta tone?"',
    time: 'Yesterday at 4:30 PM',
    category: 'projects',
    read: true,
    actionUrl: '/freelancer/messages',
    actionLabel: 'Reply Message',
    iconType: 'message',
    clientName: 'Sarah Jenkins',
  },
  {
    id: 'notif-5',
    title: '5-Star Review Received ⭐',
    description: 'Apex Cloud left you a 5.0 rating & testimonial: "Arun delivered pixel-perfect Figma designs well before the deadline. Exceptional talent!"',
    time: 'Yesterday at 11:15 AM',
    category: 'projects',
    read: true,
    actionUrl: '/freelancer/profile',
    actionLabel: 'View on Profile',
    iconType: 'review',
  },
  {
    id: 'notif-6',
    title: 'Monthly Student Bid Credits Refilled ✨',
    description: 'Your account was credited with 50 free monthly bidding credits. Total available balance: 680 Credits.',
    time: '2 days ago',
    category: 'system',
    read: true,
    actionUrl: '/freelancer/credits',
    actionLabel: 'Check Credits',
    iconType: 'credit_refill',
  },
  {
    id: 'notif-7',
    title: 'Milestone Deadline Reminder ⏰',
    description: 'Milestone #2 "Final Interactive Prototype" is scheduled for client handover in 48 hours.',
    time: '3 days ago',
    category: 'projects',
    read: true,
    actionUrl: '/freelancer/projects/p-1',
    actionLabel: 'View Milestone',
    iconType: 'milestone',
  },
  {
    id: 'notif-8',
    title: 'Client Shortlisted Your Bid 🎯',
    description: 'Kova Retail shortlisted your proposal for "E-commerce Website Redesign". They may schedule a quick chat soon.',
    time: '4 days ago',
    category: 'bids',
    read: true,
    actionUrl: '/freelancer/bids',
    actionLabel: 'View Bid',
    iconType: 'bid_accepted',
  },
]

export default function FreelancerNotificationsPage(): React.JSX.Element {
  const [notifications, setNotifications] = useState<FreelancerNotificationItem[]>(mockNotifications)
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true
    return n.category === activeFilter
  })

  // Helper icon render matching Hunhar Design
  const renderNotificationIcon = (type: FreelancerNotificationItem['iconType']) => {
    switch (type) {
      case 'bid_accepted':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EBF7EE] text-[#16A34A] shadow-xs">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
        )
      case 'payment_received':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C06B3E] shadow-xs">
            <DollarSign size={22} strokeWidth={2.4} />
          </div>
        )
      case 'invite':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB] shadow-xs">
            <Briefcase size={20} strokeWidth={2.2} />
          </div>
        )
      case 'message':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#7C3AED] shadow-xs">
            <MessageSquare size={20} strokeWidth={2.2} />
          </div>
        )
      case 'review':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEFCE8] text-[#CA8A04] shadow-xs">
            <Star size={20} className="fill-[#CA8A04]" />
          </div>
        )
      case 'credit_refill':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF9F3] text-[#C06B3E] shadow-xs">
            <Coins size={20} strokeWidth={2.2} />
          </div>
        )
      case 'milestone':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F2] text-[#E11D48] shadow-xs">
            <Clock size={20} strokeWidth={2.2} />
          </div>
        )
      default:
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FAF8F5] text-[#64748B] shadow-xs">
            <Bell size={20} />
          </div>
        )
    }
  }

  return (
    <div className="w-full font-manrope">
      {/* Outer Card matching Hunhar Design System */}
      <div className="w-full min-h-[820px] rounded-[24px] bg-white p-6 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* Top Tag: Bell + Notifications */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-manrope text-[14px] font-semibold text-[#64748B]">
            <Bell size={17} className="text-[#C06B3E]" />
            <span>Activity & Alerts</span>
          </div>

          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-3 py-1 text-[12px] font-bold text-[#C06B3E]">
              <span className="h-2 w-2 rounded-full bg-[#C06B3E] animate-pulse" />
              {unreadCount} Unread Notifications
            </span>
          )}
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#08182B]">
              Notifications
            </h1>
            <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">
              Real-time updates on client bids, milestones, escrow payments, and workspace activity
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#FAF8F5] border border-[#E5DACD] px-3.5 py-2 text-[12.5px] font-bold text-[#08182B] transition-colors hover:bg-[#F3EFE6] cursor-pointer shadow-2xs"
              >
                <Check size={14} className="text-[#16A34A]" />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-transparent px-3 py-2 text-[12.5px] font-medium text-[#7A7065] transition-colors hover:text-[#EF4444] hover:bg-[#FFF1F2] cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-7 flex flex-wrap items-center gap-2 sm:gap-2.5 border-b border-[#F0ECE6] pb-4">
          {(
            [
              { key: 'all', label: 'All Notifications' },
              { key: 'bids', label: 'Bids & Proposals' },
              { key: 'payments', label: 'Payments & Wallet' },
              { key: 'projects', label: 'Projects & Messages' },
              { key: 'system', label: 'System & Credits' },
            ] as { key: NotificationCategory; label: string }[]
          ).map((filter) => {
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full px-4 py-1.5 font-manrope text-[12.5px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C06B3E] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#64748B] hover:bg-[#F0ECE6] hover:text-[#08182B]'
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {/* Notifications List */}
        <div className="mt-6 flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF8F5] text-[#C06B3E] mb-4">
                <Bell size={28} />
              </div>
              <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                No notifications in this category
              </h3>
              <p className="mt-1 text-[13px] text-[#7A7065] max-w-sm">
                When clients accept bids, release escrow funds, or invite you to projects, they will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F2EC]">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group relative flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5 rounded-[18px] transition-colors ${
                    notif.read
                      ? 'bg-white hover:bg-[#FAF8F5]'
                      : 'bg-[#FFFBF7] hover:bg-[#FFF7ED]/70'
                  }`}
                >
                  {/* Icon */}
                  {renderNotificationIcon(notif.iconType)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3
                        className={`font-manrope text-[14.5px] text-[#08182B] ${
                          notif.read ? 'font-semibold' : 'font-extrabold'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-[#C06B3E]" />
                      )}
                      <span className="text-[12px] font-medium text-[#94A3B8] ml-auto">
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#524B42] leading-relaxed">
                      {notif.description}
                    </p>

                    {/* Action Button & Client Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {notif.actionUrl && (
                        <Link
                          to={notif.actionUrl}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#08182B] px-3.5 py-1.5 text-[12px] font-bold text-white transition-all hover:bg-[#C06B3E] hover:shadow-xs active:scale-98"
                        >
                          <span>{notif.actionLabel || 'View Details'}</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}

                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[12px] font-semibold text-[#7A7065] hover:text-[#C06B3E] cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-[#94A3B8] hover:text-[#EF4444] p-1 cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info tip */}
        <div className="mt-8 rounded-[16px] border border-[#EFE8DF] bg-[#FAF8F5] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-[#C06B3E] shrink-0" />
            <span className="text-[12.5px] text-[#524B42]">
              Want instant push or email alerts for high-budget project bids? Configure in settings.
            </span>
          </div>
          <Link
            to="/freelancer/settings"
            className="text-[12.5px] font-bold text-[#C06B3E] hover:underline shrink-0"
          >
            Notification Preferences →
          </Link>
        </div>
      </div>
    </div>
  )
}
