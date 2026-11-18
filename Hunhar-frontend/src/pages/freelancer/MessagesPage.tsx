import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  Send,
  Paperclip,
  MessageSquare,
  ArrowLeft,
  Briefcase,
  FileText,
  X,
  Smile,
  Reply,
  Copy,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  Star,
  MapPin,
  Building2,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import messageDoodleBg from '../../assets/Message doodle 6.png'
import {
  fileUrl,
  filesApi,
  messagesApi,
  profileApi,
  tokenStorage,
  type ChatMessage,
  type Conversation,
  type StoredFile,
} from '../../services/api'
import { formatDate, formatTime, formatINR, initials, timeAgo } from '../../services/format'
import { useRoleBase } from '../../services/useRoleBase'
import { toRouteId, fromRouteId } from '../../services/routeIds'

type ConversationTab = 'Client' | 'Hustlers'

interface ViewProfileData {
  userId: string
  fullName: string
  avatarUrl?: string
  role?: string
  professionalTitle?: string
  location?: string
  bio?: string
  skills?: string[]
  hourlyRate?: number | null
  rating?: number
  completedProjects?: number
  kycStatus?: string
  portfolio?: Array<{ id?: string; title: string; imageUrl?: string; link?: string; category?: string; year?: string | number }>
  companyName?: string
  industry?: string
  companySize?: string
  website?: string
  companyDescription?: string
  memberSince?: string
}

import { getCharacterAvatar } from '../../services/characterAvatars'

const MESSAGE_POLL_MS = 5000
const LIST_POLL_MS = 15000

function Avatar({ name, url, id, size = 'h-10 w-10' }: { name?: string; url?: string; id: string; size?: string }) {
  const src = url ? fileUrl(url) : getCharacterAvatar(id || name)
  return <img src={src} alt={name || 'Avatar'} className={`${size} shrink-0 rounded-full object-cover ring-1 ring-[#DECFBE]/60`} />
}

export default function MessagesPage(): React.JSX.Element {
  const base = useRoleBase()
  const me = tokenStorage.getUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<ConversationTab>(base === '/client' ? 'Hustlers' : 'Client')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string>(fromRouteId(searchParams.get('c')))
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [attachment, setAttachment] = useState<StoredFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null)
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<ChatMessage | null>(null)
  const [viewingProfile, setViewingProfile] = useState<ViewProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, string[]>>({})
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleReaction = (msgId: string, emoji: string) => {
    setReactions((prev) => {
      const current = prev[msgId] || []
      const updated = current.includes(emoji)
        ? current.filter((e) => e !== emoji)
        : [...current, emoji]
      return { ...prev, [msgId]: updated }
    })
    setActiveReactionId(null)
  }

  const handleOpenProfile = async (
    userId: string,
    role?: string,
    fallbackName?: string,
    fallbackAvatarUrl?: string
  ) => {
    if (!userId) return
    setViewingProfile({
      userId,
      fullName: fallbackName || 'User',
      avatarUrl: fallbackAvatarUrl,
      role: role || 'FREELANCER',
    })
    setProfileLoading(true)

    try {
      const userSummary = await profileApi.getUserSummary(userId)
      if (userSummary) {
        const p = userSummary.profile || {}
        setViewingProfile({
          userId,
          fullName: userSummary.fullName || fallbackName || 'User',
          avatarUrl: userSummary.avatarUrl || fallbackAvatarUrl,
          role: userSummary.role || role || 'FREELANCER',
          kycStatus: userSummary.kycStatus || p.kycStatus,
          memberSince: userSummary.createdAt ? formatDate(userSummary.createdAt) : undefined,
          professionalTitle: p.professionalTitle,
          location: p.location,
          bio: p.bio,
          skills: p.skills || [],
          hourlyRate: p.hourlyRate,
          rating: p.rating,
          completedProjects: p.completedProjects,
          portfolio: p.portfolio || [],
          companyName: p.companyName,
          industry: p.industry,
          companySize: p.companySize,
          website: p.website,
          companyDescription: p.companyDescription,
        })
      }
    } catch {
      try {
        const fProfile = await profileApi.getPublic(userId)
        if (fProfile) {
          setViewingProfile((prev) => ({
            ...prev!,
            fullName: fProfile.fullName || prev?.fullName || 'User',
            avatarUrl: fProfile.avatarUrl || prev?.avatarUrl,
            role: 'FREELANCER',
            professionalTitle: fProfile.professionalTitle,
            location: fProfile.location,
            bio: fProfile.bio,
            skills: fProfile.skills || [],
            hourlyRate: fProfile.hourlyRate,
            rating: fProfile.rating,
            completedProjects: fProfile.completedProjects,
            kycStatus: fProfile.kycStatus,
            portfolio: fProfile.portfolio || [],
          }))
        }
      } catch {
        // Fallback profile details remain
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const loadConversations = useCallback(async () => {
    try {
      const list = await messagesApi.getConversations()
      setConversations(list)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Could not load conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
    const t = window.setInterval(loadConversations, LIST_POLL_MS)
    return () => window.clearInterval(t)
  }, [loadConversations])

  // Open the conversation from ?c= and switch to its tab
  useEffect(() => {
    const target = conversations.find((c) => c.id === selectedId)
    if (target) setActiveTab(target.otherPartyRole === 'FREELANCER' ? 'Hustlers' : 'Client')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length > 0])

  const loadMessages = useCallback(async () => {
    if (!selectedId) return
    try {
      const list = await messagesApi.getMessages(selectedId)
      setMessages((prev) => (prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id ? prev : list))
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)))
    } catch (err: any) {
      setError(err.message)
    }
  }, [selectedId])

  useEffect(() => {
    setMessages([])
    if (!selectedId) return
    loadMessages()
    const t = window.setInterval(loadMessages, MESSAGE_POLL_MS)
    return () => window.clearInterval(t)
  }, [selectedId, loadMessages])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages.length])

  const selectConversation = (id: string) => {
    setSelectedId(id)
    setSearchParams(id ? { c: id } : {}, { replace: true })
  }

  const tabConversations = conversations.filter((c) =>
    activeTab === 'Hustlers' ? c.otherPartyRole === 'FREELANCER' : c.otherPartyRole !== 'FREELANCER'
  )
  const filtered = tabConversations.filter((c) => {
    const q = searchQuery.toLowerCase()
    return !q || (c.otherPartyName || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
  })
  const unreadIn = (tab: ConversationTab) =>
    conversations
      .filter((c) => (tab === 'Hustlers' ? c.otherPartyRole === 'FREELANCER' : c.otherPartyRole !== 'FREELANCER'))
      .reduce((n, c) => n + (c.unreadCount || 0), 0)

  const active = conversations.find((c) => c.id === selectedId)

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      setAttachment(await filesApi.upload(file, active?.projectId || undefined))
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = inputText.trim()
    if ((!content && !attachment) || !selectedId || sending) return

    if (editingMsg) {
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMsg.id ? { ...m, content } : m))
      )
      setEditingMsg(null)
      setInputText('')
      return
    }

    setSending(true)
    try {
      const msg = await messagesApi.sendMessage(selectedId, content, attachment?.url)
      setMessages((prev) => [...prev, msg])
      setInputText('')
      setAttachment(null)
      setReplyingTo(null)
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, lastMessage: content || '📎 Attachment', lastMessageAt: msg.createdAt } : c))
      )
    } catch (err: any) {
      setError(err.message || 'Message not sent')
    } finally {
      setSending(false)
    }
  }

  // group messages by day
  let lastDay = ''

  return (
    <div className="w-full font-manrope">
      <div className="flex h-[calc(100vh-140px)] sm:h-[calc(100vh-140px)] lg:h-[calc(100vh-145px)] max-h-[calc(100dvh-140px)] sm:max-h-[calc(100dvh-140px)] lg:max-h-[calc(100dvh-145px)] w-full flex-col rounded-[24px] border border-[#E9EBEF]/60 bg-[#FFFFFF] p-2 shadow-xs sm:p-3 lg:p-4">
        <div className="flex flex-1 min-h-0 overflow-hidden rounded-[20px] border border-[#DECFBE]">
          {/* LEFT: conversations */}
          <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[#DECFBE] bg-[#FFFFFF] md:w-[300px] lg:w-[320px] min-h-0 h-full`}>
            <div className="shrink-0 p-4 pb-2">
              <h1 className="font-manrope text-[20px] font-bold text-[#08182B]">Messages</h1>
              <p className="mt-0.5 text-[12px] text-[#786D61]">Conversations with clients & collaborators</p>
            </div>

            <div className="shrink-0 px-4 py-2">
              <div className="flex rounded-full bg-[#E5D7CA] p-1" role="tablist">
                {(['Client', 'Hustlers'] as ConversationTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 font-manrope text-[12px] font-bold transition-all ${
                      activeTab === tab ? 'bg-[#C06B3E] text-white shadow-xs' : 'text-[#6E6357] hover:text-[#08182B]'
                    }`}
                  >
                    {tab === 'Client' ? 'Clients' : 'Freelancers'}
                    {unreadIn(tab) > 0 && (
                      <span className={`rounded-full px-1.5 text-[10px] ${activeTab === tab ? 'bg-white text-[#C06B3E]' : 'bg-[#C06B3E] text-white'}`}>
                        {unreadIn(tab)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="shrink-0 px-4 py-2">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8E80]" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  aria-label="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-full border border-[#DECFBE] bg-[#FDFBF7] pl-8 pr-3 text-[12px] text-[#08182B] placeholder:text-[#9A8E80] focus:border-[#C06B3E] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-[#F2E8DC] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-xs text-[#8E8376]">Loading conversations…</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-xs leading-relaxed text-[#8E8376]">
                  {searchQuery
                    ? 'No chats match your search.'
                    : base === '/client'
                    ? activeTab === 'Client'
                      ? 'No conversations here.'
                      : 'No freelancer conversations yet. A chat opens automatically when you hire someone, or use "Message" on a proposal.'
                    : activeTab === 'Client'
                    ? 'No client conversations yet. A chat opens automatically when a client hires you, or use "Send Message" in a project workspace.'
                    : 'No conversations with other freelancers yet. Team invites open chats here.'}
                </div>
              ) : (
                filtered.map((c) => {
                  const isSelected = c.id === selectedId
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectConversation(c.id)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors ${
                        isSelected ? 'border-l-4 border-l-[#C06B3E] bg-[#FAF4EE]' : 'hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <Avatar name={c.otherPartyName} url={c.otherPartyAvatarUrl} id={c.otherPartyId} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`truncate font-manrope text-[13.5px] text-[#08182B] ${c.unreadCount ? 'font-extrabold' : 'font-bold'}`}>
                            {c.otherPartyName || 'User'}
                          </h4>
                          <span className="shrink-0 text-[11px] text-[#9A8E80]">{timeAgo(c.lastMessageAt)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className={`line-clamp-1 font-manrope text-[12px] ${c.unreadCount ? 'font-semibold text-[#08182B]' : 'text-[#7A7065]'}`}>
                            {c.lastMessage || 'Say hello 👋'}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#C06B3E] px-1.5 text-[10px] font-bold text-white">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT: chat */}
          <div className={`${selectedId ? 'flex' : 'hidden md:flex'} relative min-w-0 flex-1 flex-col bg-[#FDFBF7] h-full min-h-0`}>
            <div
              className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.06]"
              style={{ backgroundImage: `url("${messageDoodleBg}")`, backgroundSize: '360px' }}
            />

            <div className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#DECFBE] bg-white px-3 shadow-2xs sm:px-6">
              {active ? (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => selectConversation('')}
                      aria-label="Back to conversations"
                      className="rounded-full p-1.5 text-[#7A7065] hover:bg-[#FAF4EE] md:hidden cursor-pointer"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenProfile(
                          active.otherPartyId,
                          active.otherPartyRole,
                          active.otherPartyName,
                          active.otherPartyAvatarUrl
                        )
                      }
                      title={`View ${active.otherPartyName || 'profile'}`}
                      className="group/profile flex min-w-0 items-center gap-3 rounded-[12px] p-1.5 -m-1.5 text-left transition-colors hover:bg-[#FAF4EE]/80 cursor-pointer"
                    >
                      <div className="relative">
                        <Avatar name={active.otherPartyName} url={active.otherPartyAvatarUrl} id={active.otherPartyId} />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-1 ring-[#DECFBE]">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-manrope text-[15px] font-bold text-[#08182B] group-hover/profile:text-[#C06B3E] transition-colors">
                          {active.otherPartyName || 'User'}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#8E8376] flex items-center gap-1.5">
                          {active.otherPartyRole === 'CLIENT' ? 'Client' : active.otherPartyRole === 'FREELANCER' ? 'Freelancer' : 'Hunhar'}
                          <span className="text-[10px] text-[#C06B3E] font-medium opacity-0 group-hover/profile:opacity-100 transition-opacity">
                            · View Profile
                          </span>
                        </span>
                      </div>
                    </button>
                  </div>
                  {active.projectId && (
                    <Link
                      to={`${base}/projects/${toRouteId(active.projectId)}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#DECFBE] px-3 py-1.5 text-[12px] font-bold text-[#08182B] no-underline hover:bg-[#FAF4EE]"
                    >
                      <Briefcase size={13} /> <span className="hidden sm:inline">Project</span>
                    </Link>
                  )}
                </>
              ) : (
                <h3 className="font-manrope text-[15px] font-bold text-[#08182B]">Select a conversation</h3>
              )}
            </div>

            {error && (
              <div className="relative z-10 shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-[12px] font-semibold text-red-700">{error}</div>
            )}

            <div ref={messagesContainerRef} className="relative z-10 flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto p-3 sm:p-6">
              {!active || messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF3EC] text-[#C06B3E]">
                    <MessageSquare size={26} />
                  </div>
                  <h4 className="font-manrope text-[16px] font-bold text-[#08182B]">{active ? 'No messages yet' : 'Your messages'}</h4>
                  <p className="mt-1 max-w-[340px] font-manrope text-[13px] text-[#8E8376]">
                    {active ? `Send a message to start the conversation with ${active.otherPartyName || 'them'}.` : 'Pick a conversation from the list.'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === me?.id || msg.senderId === me?.userId || (active ? msg.senderId !== active.otherPartyId : false)
                  const day = formatDate(msg.createdAt, true)
                  const showDay = day !== lastDay
                  lastDay = day
                  const msgReactions = reactions[msg.id] || []
                  return (
                    <React.Fragment key={msg.id}>
                      {showDay && (
                        <div className="my-1 self-center rounded-full bg-white/80 px-3 py-0.5 text-[11px] font-semibold text-[#8E8376] shadow-2xs">{day}</div>
                      )}
                      <div className={`group relative flex max-w-[85%] items-end gap-2 sm:max-w-[75%] ${isMe ? 'flex-row-reverse self-end' : 'self-start'}`}>
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenProfile(
                                active.otherPartyId,
                                active.otherPartyRole,
                                msg.senderName || active.otherPartyName,
                                active.otherPartyAvatarUrl
                              )
                            }
                            title={`View ${msg.senderName || active.otherPartyName || 'user'} profile`}
                            className="cursor-pointer transition-transform hover:scale-105 shrink-0"
                          >
                            <Avatar name={msg.senderName} url={active.otherPartyAvatarUrl} id={msg.senderId} size="h-8 w-8" />
                          </button>
                        )}
                        <div className="relative min-w-0">
                          {/* Hover Action Bar */}
                          <div
                            className={`absolute -top-3.5 z-20 hidden items-center gap-0.5 rounded-full border border-[#DECFBE] bg-white px-1.5 py-0.5 shadow-md group-hover:flex ${
                              isMe ? 'right-2' : 'left-2'
                            }`}
                          >
                            <button
                              type="button"
                              title="React"
                              onClick={() => setActiveReactionId(activeReactionId === msg.id ? null : msg.id)}
                              className="rounded-full p-1 text-[#7A7065] transition-colors hover:bg-[#FAF4EE] hover:text-[#C06B3E]"
                            >
                              <Smile size={13} />
                            </button>
                            <button
                              type="button"
                              title="Reply"
                              onClick={() => {
                                setReplyingTo(msg)
                                setEditingMsg(null)
                              }}
                              className="rounded-full p-1 text-[#7A7065] transition-colors hover:bg-[#FAF4EE] hover:text-[#C06B3E]"
                            >
                              <Reply size={13} />
                            </button>
                            <button
                              type="button"
                              title={copiedId === msg.id ? 'Copied!' : 'Copy'}
                              onClick={() => {
                                navigator.clipboard?.writeText(msg.content)
                                setCopiedId(msg.id)
                                setTimeout(() => setCopiedId(null), 2000)
                              }}
                              className="rounded-full p-1 text-[#7A7065] transition-colors hover:bg-[#FAF4EE] hover:text-[#C06B3E]"
                            >
                              {copiedId === msg.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                            </button>
                            {isMe && (
                              <>
                                <button
                                  type="button"
                                  title="Edit"
                                  onClick={() => {
                                    setEditingMsg(msg)
                                    setReplyingTo(null)
                                    setInputText(msg.content)
                                  }}
                                  className="rounded-full p-1 text-[#7A7065] transition-colors hover:bg-[#FAF4EE] hover:text-[#C06B3E]"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => {
                                    setDeleteConfirmMsg(msg)
                                  }}
                                  className="rounded-full p-1 text-[#7A7065] transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Quick Reaction Popup */}
                          {activeReactionId === msg.id && (
                            <div
                              className={`absolute -top-11 z-30 flex items-center gap-1 rounded-full border border-[#DECFBE] bg-white px-2 py-1 shadow-lg ${
                                isMe ? 'right-2' : 'left-2'
                              }`}
                            >
                              {['👍', '❤️', '😂', '😮', '🙏', '🔥'].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className="transform text-base transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Message Bubble with cursor-pointer */}
                          <div
                            className={`cursor-pointer whitespace-pre-wrap break-words rounded-[16px] p-3 font-manrope text-[13px] leading-relaxed shadow-2xs transition-all hover:brightness-[0.98] ${
                              isMe ? 'rounded-br-none bg-[#C06B3E] text-white' : 'rounded-bl-none border border-[#DECFBE] bg-white text-[#08182B]'
                            }`}
                          >
                            {msg.content}
                            {msg.attachmentUrl && (
                              <a
                                href={fileUrl(msg.attachmentUrl) + '?download=true'}
                                className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-bold underline ${isMe ? 'text-white' : 'text-[#C06B3E]'}`}
                              >
                                <FileText size={13} /> Attachment
                              </a>
                            )}
                          </div>

                          {/* Reactions Badge */}
                          {msgReactions.length > 0 && (
                            <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              {msgReactions.map((emoji) => (
                                <span
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className="inline-flex cursor-pointer items-center rounded-full border border-[#DECFBE] bg-white px-1.5 py-0.5 text-[11px] shadow-2xs hover:bg-[#FAF4EE]"
                                >
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          )}

                          <span className={`mt-1 block text-[10px] text-[#9A8E80] ${isMe ? 'text-right' : 'text-left'}`}>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {active && (
              <div className="relative z-10 shrink-0 border-t border-[#DECFBE] bg-white p-2.5 sm:p-4">
                {editingMsg && (
                  <div className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-l-[#C06B3E] bg-[#FAF4EE] px-3 py-1.5 text-[12px] font-medium text-[#08182B]">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[#C06B3E]">Editing message</span>
                      <p className="line-clamp-1 text-[11px] text-[#7A7065]">{editingMsg.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMsg(null)
                        setInputText('')
                      }}
                      className="p-1 text-[#8E8376] hover:text-[#08182B]"
                      title="Cancel edit"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-l-[#C06B3E] bg-[#FAF4EE] px-3 py-1.5 text-[12px] font-medium text-[#08182B]">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[#C06B3E]">Replying to {replyingTo.senderName || 'user'}</span>
                      <p className="line-clamp-1 text-[11px] text-[#7A7065]">{replyingTo.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 text-[#8E8376] hover:text-[#08182B]"
                      title="Cancel reply"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {attachment && (
                  <div className="mb-2 flex items-center gap-2 rounded-full bg-[#FAF4EE] px-3 py-1 text-[12px] font-semibold text-[#08182B]">
                    <FileText size={13} /> <span className="truncate">{attachment.originalName}</span>
                    <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)} className="ml-auto text-[#8E8376]">
                      <X size={13} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input ref={fileRef} type="file" className="hidden" onChange={handleAttach} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#9A8E80] hover:bg-[#FAF4EE] hover:text-[#C06B3E] disabled:opacity-50"
                    title="Attach file"
                    aria-label="Attach file"
                  >
                    <Paperclip size={18} className={uploading ? 'animate-pulse' : ''} />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    maxLength={5000}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    aria-label="Message"
                    className="h-10 min-w-0 flex-1 rounded-full border border-[#DECFBE] bg-[#FDFBF7] px-4 font-manrope text-[13px] text-[#08182B] placeholder:text-[#9A8E80] focus:border-[#C06B3E] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !attachment) || sending}
                    aria-label="Send"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-xs transition-all hover:bg-[#AA572D] disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Message Confirmation Modal (UX Law / Destructive Action Safeguard) */}
      {deleteConfirmMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-manrope backdrop-blur-xs animate-fade-in"
          onClick={() => setDeleteConfirmMsg(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="relative w-full max-w-sm rounded-[24px] border border-[#E5DACD] bg-white p-6 shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDeleteConfirmMsg(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#94A3B8] transition-colors hover:bg-[#FAF8F5] hover:text-[#08182B] cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header Icon */}
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-xs">
              <Trash2 size={26} strokeWidth={2.2} />
            </div>

            {/* Title & Description */}
            <h3 id="delete-modal-title" className="text-center text-[19px] font-extrabold text-[#08182B]">
              Delete Message?
            </h3>
            <p className="mt-2 text-center text-[12.5px] leading-relaxed text-[#64748B]">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>

            {/* Message Preview Box */}
            <div className="my-4 rounded-[14px] border border-[#F0ECE6] bg-[#FAF8F5] p-3 text-[12.5px] text-[#7A7065]">
              <p className="line-clamp-2 italic break-words">
                {deleteConfirmMsg.content ? `“${deleteConfirmMsg.content}”` : '📎 Attached file'}
              </p>
            </div>

            {/* Action Buttons: Yes and No CTA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmMsg(null)}
                className="flex-1 cursor-pointer rounded-[12px] border border-[#E5DACD] bg-white py-2.5 text-[13px] font-bold text-[#64748B] transition-colors hover:bg-[#FAF8F5] hover:text-[#08182B]"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = deleteConfirmMsg.id
                  setMessages((prev) => prev.filter((m) => m.id !== targetId))
                  if (editingMsg?.id === targetId) {
                    setEditingMsg(null)
                    setInputText('')
                  }
                  if (replyingTo?.id === targetId) {
                    setReplyingTo(null)
                  }
                  setDeleteConfirmMsg(null)
                }}
                className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[12px] bg-red-600 py-2.5 text-[13px] font-extrabold text-white shadow-sm transition-all hover:bg-red-700 active:scale-98"
              >
                <Trash2 size={15} />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Opposite User Profile Modal */}
      {viewingProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-manrope backdrop-blur-xs animate-fade-in"
          onClick={() => setViewingProfile(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="relative flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-[24px] border border-[#E5DACD] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4 bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <h3 id="profile-modal-title" className="text-[16px] font-extrabold text-[#08182B]">
                  Profile Details
                </h3>
                <span className="rounded-full bg-[#EFECE6] px-2 py-0.5 text-[11px] font-semibold text-[#7A7065]">
                  View only
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingProfile(null)}
                aria-label="Close"
                className="rounded-full p-1.5 text-[#94A3B8] transition-colors hover:bg-white hover:text-[#08182B] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-[#F0ECE6]">
                <Avatar
                  name={viewingProfile.fullName}
                  url={viewingProfile.avatarUrl}
                  id={viewingProfile.userId}
                  size="h-20 w-20"
                />
                <div className="text-center sm:text-left min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-[20px] font-extrabold text-[#08182B]">
                      {viewingProfile.fullName}
                    </h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        viewingProfile.role === 'CLIENT'
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : 'bg-[#FAF3EC] text-[#C06B3E]'
                      }`}
                    >
                      {viewingProfile.role === 'CLIENT' ? 'Client' : 'Freelancer'}
                    </span>
                    {viewingProfile.kycStatus === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck size={12} />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[13.5px] font-medium text-[#7A7065]">
                    {viewingProfile.professionalTitle ||
                      (viewingProfile.role === 'CLIENT'
                        ? viewingProfile.companyName || 'Project Client'
                        : 'Independent Freelancer')}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[12px] text-[#8C9BA8]">
                    {viewingProfile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {viewingProfile.location}
                      </span>
                    )}
                    {viewingProfile.memberSince && (
                      <span>Joined {viewingProfile.memberSince}</span>
                    )}
                  </div>
                </div>
              </div>

              {profileLoading ? (
                <div className="py-8 text-center text-[13px] text-[#8C9BA8] animate-pulse">
                  Loading profile details...
                </div>
              ) : (
                <>
                  {/* Freelancer Specifics: Stats row */}
                  {viewingProfile.role !== 'CLIENT' && (
                    <div className="grid grid-cols-3 gap-2.5 rounded-[16px] border border-[#F0ECE6] bg-[#FAF8F5] p-3 text-center">
                      <div>
                        <span className="block text-[11px] font-bold text-[#8C9BA8] uppercase tracking-wider">Rating</span>
                        <span className="mt-0.5 flex items-center justify-center gap-1 text-[15px] font-extrabold text-[#08182B]">
                          <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
                          {viewingProfile.rating ? viewingProfile.rating.toFixed(1) : '5.0'}
                        </span>
                      </div>
                      <div className="border-x border-[#E5DACD]/50">
                        <span className="block text-[11px] font-bold text-[#8C9BA8] uppercase tracking-wider">Projects</span>
                        <span className="mt-0.5 block text-[15px] font-extrabold text-[#08182B]">
                          {viewingProfile.completedProjects ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-[#8C9BA8] uppercase tracking-wider">Hourly Rate</span>
                        <span className="mt-0.5 block text-[15px] font-extrabold text-[#C06B3E]">
                          {viewingProfile.hourlyRate != null ? formatINR(viewingProfile.hourlyRate) + '/hr' : 'Flexible'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Client Specifics: Company Details */}
                  {viewingProfile.role === 'CLIENT' && (
                    <div className="space-y-2 rounded-[16px] border border-[#F0ECE6] bg-[#FAF8F5] p-4 text-[13px]">
                      {viewingProfile.companyName && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7065] flex items-center gap-1.5">
                            <Building2 size={13} /> Company
                          </span>
                          <span className="font-bold text-[#08182B]">{viewingProfile.companyName}</span>
                        </div>
                      )}
                      {viewingProfile.industry && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7065]">Industry</span>
                          <span className="font-semibold text-[#08182B]">{viewingProfile.industry}</span>
                        </div>
                      )}
                      {viewingProfile.companySize && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7065]">Company Size</span>
                          <span className="font-semibold text-[#08182B]">{viewingProfile.companySize}</span>
                        </div>
                      )}
                      {viewingProfile.website && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7065] flex items-center gap-1.5">
                            <Globe size={13} /> Website
                          </span>
                          <a
                            href={viewingProfile.website.startsWith('http') ? viewingProfile.website : `https://${viewingProfile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#C06B3E] hover:underline"
                          >
                            <span>Visit</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* About / Bio */}
                  <div>
                    <h5 className="text-[13px] font-extrabold uppercase tracking-wider text-[#8C9BA8]">
                      {viewingProfile.role === 'CLIENT' ? 'About the Company' : 'About'}
                    </h5>
                    <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-[#4A5568]">
                      {(viewingProfile.role === 'CLIENT'
                        ? viewingProfile.companyDescription
                        : viewingProfile.bio) ||
                        'No detailed description available yet.'}
                    </p>
                  </div>

                  {/* Skills (if freelancer) */}
                  {viewingProfile.role !== 'CLIENT' && viewingProfile.skills && viewingProfile.skills.length > 0 && (
                    <div>
                      <h5 className="text-[13px] font-extrabold uppercase tracking-wider text-[#8C9BA8]">
                        Skills & Expertise
                      </h5>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {viewingProfile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-[#E5DACD] bg-[#FAF8F5] px-3 py-1 text-[12px] font-medium text-[#08182B]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio (if freelancer) */}
                  {viewingProfile.role !== 'CLIENT' && viewingProfile.portfolio && viewingProfile.portfolio.length > 0 && (
                    <div>
                      <h5 className="text-[13px] font-extrabold uppercase tracking-wider text-[#8C9BA8]">
                        Portfolio
                      </h5>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {viewingProfile.portfolio.slice(0, 4).map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="overflow-hidden rounded-[14px] border border-[#EFECE6] bg-[#FAF8F5]"
                          >
                            {p.imageUrl ? (
                              <img src={fileUrl(p.imageUrl)} alt={p.title} className="h-24 w-full object-cover" />
                            ) : (
                              <div className="h-24 bg-[#F5ECE1] flex items-center justify-center text-[#8C9BA8] text-[11px]">
                                No preview
                              </div>
                            )}
                            <div className="p-2.5">
                              <span className="block truncate text-[12px] font-bold text-[#08182B]">{p.title}</span>
                              {p.link && (
                                <a
                                  href={p.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#C06B3E] hover:underline"
                                >
                                  View Project <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer (Read-only Close) */}
            <div className="border-t border-[#F0ECE6] bg-[#FAF8F5] px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProfile(null)}
                className="cursor-pointer rounded-[12px] border border-[#E5DACD] bg-white px-5 py-2 text-[13px] font-bold text-[#64748B] hover:bg-[#FAF8F5] hover:text-[#08182B] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
