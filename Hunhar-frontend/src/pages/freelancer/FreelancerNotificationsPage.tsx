import React, { useState, useEffect } from 'react'
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
  ArrowRight,
  Check,
  Trash2,
} from 'lucide-react'
import { notificationsApi, type AppNotification } from '../../services/api'
import { timeAgo } from '../../services/format'
import { useRoleBase } from '../../services/useRoleBase'
import { hideIdsInPath } from '../../services/routeIds'

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
  iconType: 'bid_accepted' | 'payment_received' | 'message' | 'invite' | 'credit_refill' | 'milestone' | 'review' | 'default'
}

/** Maps backend notification types to the page's filter tabs, icons and buttons. */
const describe = (type: string, base: string): Pick<FreelancerNotificationItem, 'category' | 'iconType' | 'actionLabel'> & { fallbackUrl: string } => {
  switch (type) {
    case 'PROJECT_AWARDED':
      return { category: 'bids', iconType: 'bid_accepted', actionLabel: 'Open workspace', fallbackUrl: base + '/projects' }
    case 'BID_RECEIVED':
      return { category: 'bids', iconType: 'invite', actionLabel: 'Review proposals', fallbackUrl: base + '/projects' }
    case 'BID_SHORTLISTED':
    case 'BID_REJECTED':
      return { category: 'bids', iconType: type === 'BID_SHORTLISTED' ? 'review' : 'default', actionLabel: 'View my bids', fallbackUrl: base + '/bids' }
    case 'MILESTONE_FUNDED':
    case 'DISPUTE_RAISED':
    case 'DISPUTE_RESOLVED':
    case 'DISPUTE_DISMISSED':
    case 'DELIVERABLE_SUBMITTED':
      return { category: 'projects', iconType: type === 'MILESTONE_FUNDED' ? 'payment_received' : 'milestone', actionLabel: 'Open project', fallbackUrl: base + '/projects' }
    case 'KYC_APPROVED':
    case 'KYC_REJECTED':
      return { category: 'system', iconType: type === 'KYC_APPROVED' ? 'bid_accepted' : 'default', actionLabel: 'Open settings', fallbackUrl: base + '/settings' }
    case 'PAYMENT_RECEIVED':
    case 'PAYOUT_COMPLETED':
    case 'PAYOUT_REJECTED':
      return { category: 'payments', iconType: 'payment_received', actionLabel: 'Open wallet', fallbackUrl: base + '/wallet' }
    case 'TEAM_INVITE':
    case 'TEAM_INVITE_ACCEPTED':
    case 'TEAM_INVITE_DECLINED':
      return { category: 'projects', iconType: 'invite', actionLabel: type === 'TEAM_INVITE' ? 'View invitation' : 'View project', fallbackUrl: base + '/team' }
    case 'MILESTONE_ADDED':
    case 'DELIVERABLE_APPROVED':
    case 'DELIVERABLE_CHANGES':
    case 'PROJECT_COMPLETED':
      return { category: 'projects', iconType: 'milestone', actionLabel: 'Open project', fallbackUrl: base + '/projects' }
    case 'DEADLINE_REMINDER':
      return { category: 'projects', iconType: 'milestone', actionLabel: 'Open calendar', fallbackUrl: base + '/calendar' }
    case 'NEW_MESSAGE':
      return { category: 'projects', iconType: 'message', actionLabel: 'Open messages', fallbackUrl: base + '/messages' }
    case 'CREDITS_PURCHASED':
      return { category: 'system', iconType: 'credit_refill', actionLabel: 'View credits', fallbackUrl: base + '/credits' }
    default:
      return { category: 'system', iconType: 'default', actionLabel: 'View details', fallbackUrl: base + '/dashboard' }
  }
}

const toItem = (n: AppNotification, base: string): FreelancerNotificationItem => {
  const meta = describe(n.type, base)
  return {
    id: n.id,
    title: n.title,
    description: n.message,
    time: timeAgo(n.createdAt),
    category: meta.category,
    read: n.read,
    // Links are produced by the server for the recipient's role; only follow pages of this dashboard
    actionUrl: n.link && n.link.startsWith(base + '/') ? hideIdsInPath(n.link) : meta.fallbackUrl,
    actionLabel: meta.actionLabel,
    iconType: meta.iconType,
  }
}

export default function FreelancerNotificationsPage(): React.JSX.Element {
  const base = useRoleBase()
  const [notifications, setNotifications] = useState<FreelancerNotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all')

  useEffect(() => {
    notificationsApi
      .getNotifications()
      .then((res) => setNotifications(res.map((x) => toItem(x, base))))
      .catch((err) => setError(err.message || 'Could not load notifications'))
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const notifyNavbar = () => window.dispatchEvent(new Event('hunhar:notifications-changed'))

  const run = async (action: () => Promise<unknown>, rollback: FreelancerNotificationItem[]) => {
    try {
      await action()
      notifyNavbar()
    } catch (err: any) {
      setNotifications(rollback)
      setError(err.message || 'Action failed')
    }
  }

  const handleMarkAsRead = (id: string) => {
    const before = notifications
    if (!before.find((n) => n.id === id && !n.read)) return
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    run(() => notificationsApi.markAsRead(id), before)
  }

  const handleMarkAllAsRead = () => {
    const before = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    run(() => notificationsApi.markAllAsRead(), before)
  }

  const handleDeleteNotification = (id: string) => {
    const before = notifications
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    run(() => notificationsApi.remove(id), before)
  }

  const handleClearAll = () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return
    const before = notifications
    setNotifications([])
    run(() => notificationsApi.clearAll(), before)
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
      <div className="w-full min-h-[700px] rounded-[24px] bg-white p-5 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* Top Tag: Bell + Notifications */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-manrope text-[14px] font-semibold text-[#64748B]">
            <Bell size={17} className="text-[#C06B3E]" />
            <span>Activity & Alerts</span>
          </div>

          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-3 py-1 text-[12px] font-bold text-[#C06B3E]">
              <span className="h-2 w-2 rounded-full bg-[#C06B3E] animate-pulse" />
              {unreadCount} unread
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
              Updates on your proposals, projects, payments and team invites
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#DECFBE] bg-[#FAF8F5] px-3.5 py-1.5 text-[12px] font-bold text-[#574C40] transition-colors hover:bg-white hover:text-[#C06B3E] cursor-pointer"
              >
                <Check size={14} />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-[12px] font-semibold text-[#94A3B8] transition-colors hover:text-[#EF4444] cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[#F0ECE6] pb-4">
          {(
            [
              { key: 'all', label: 'All Updates' },
              { key: 'bids', label: 'Bids & Proposals' },
              { key: 'payments', label: 'Payments & Escrow' },
              { key: 'projects', label: 'Projects & Workspaces' },
              { key: 'system', label: 'System & Credits' },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`rounded-full px-4 py-1.5 font-manrope text-[12.5px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#08182B] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#64748B] hover:bg-[#F0ECE6] hover:text-[#08182B]'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>
        )}

        {/* Notifications List Body */}
        <div className="mt-6 flex-1">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center p-8">
              <span className="font-manrope text-[14px] font-medium text-[#8E8376]">Loading notifications…</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FAF8F5] text-[#94A3B8] mb-3">
                <Bell size={28} />
              </div>
              <h3 className="font-manrope text-[17px] font-bold text-[#08182B]">
                You're all caught up!
              </h3>
              <p className="mt-1 font-manrope text-[13px] text-[#7A7065] max-w-[320px]">
                {notifications.length ? 'Nothing in this category.' : 'No notifications yet. Updates about your proposals, projects and payments will appear here.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group relative flex items-start gap-4 rounded-[20px] border p-4 sm:p-5 transition-all duration-150 ${
                    !notif.read
                      ? 'border-[#FED7AA] bg-[#FFFBF7] shadow-xs'
                      : 'border-[#F0ECE6] bg-white hover:border-[#DECFBE] hover:bg-[#FAF8F5]/50'
                  }`}
                >
                  {renderNotificationIcon(notif.iconType)}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-manrope text-[14.5px] font-bold text-[#08182B]">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-[#C06B3E] shrink-0" />
                        )}
                      </div>

                      <span className="text-[11.5px] font-medium text-[#94A3B8]">
                        {notif.time}
                      </span>
                    </div>

                    <p className="mt-1 font-manrope text-[13px] leading-relaxed text-[#524B42]">
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
                        className="ml-auto p-1 text-[#94A3B8] transition-opacity hover:text-[#EF4444] focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete notification"
                        aria-label="Delete notification"
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
              Choose which updates you want to receive.
            </span>
          </div>
          <Link
            to={`${base}/settings`}
            className="text-[12.5px] font-bold text-[#C06B3E] hover:underline shrink-0"
          >
            Notification Preferences →
          </Link>
        </div>
      </div>
    </div>
  )
}
