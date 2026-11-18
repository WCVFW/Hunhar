import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Send, Paperclip, MessageSquare, ArrowLeft, Briefcase, FileText, X, Pencil, Trash2, Download } from 'lucide-react'
import messageDoodleBg from '../../assets/Message doodle 6.png'
import {
  fileUrl,
  filesApi,
  messagesApi,
  tokenStorage,
  type ChatMessage,
  type Conversation,
  type StoredFile,
} from '../../services/api'
import { formatDate, formatTime, initials, timeAgo } from '../../services/format'
import { useRoleBase } from '../../services/useRoleBase'
import { toRouteId, fromRouteId } from '../../services/routeIds'

type ConversationTab = 'Client' | 'Hustlers'

const AVATAR_COLORS = [
  'bg-[#FFD7D0] text-[#E04B35]',
  'bg-[#CFF3F9] text-[#0284C7]',
  'bg-[#DCD8FE] text-[#6366F1]',
  'bg-[#E0F2CE] text-[#65A30D]',
]

const colorFor = (id: string) => AVATAR_COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]

const MESSAGE_POLL_MS = 5000
const LIST_POLL_MS = 15000
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
// Same list the server refuses (programs and scripts); everything else can be sent
const BLOCKED_EXT = new Set(['exe', 'msi', 'msp', 'bat', 'cmd', 'com', 'scr', 'pif', 'cpl', 'dll', 'sys', 'drv', 'ps1', 'psm1', 'vbs', 'vbe', 'jse', 'wsf', 'wsh', 'hta', 'lnk', 'reg', 'inf', 'scf', 'msc', 'jar', 'app', 'dmg', 'pkg', 'deb', 'rpm', 'run', 'sh', 'bash', 'command', 'gadget', 'appx', 'msix'])

const formatBytes = (n?: number | null) =>
  !n ? '' : n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`

// Changes when any message is added, edited or deleted, so polling picks those up too
const signature = (list: ChatMessage[]) => list.map((m) => `${m.id}:${m.editedAt ?? ''}:${m.deletedAt ?? ''}`).join('|')

function Avatar({ name, url, id, size = 'h-10 w-10' }: { name?: string; url?: string; id: string; size?: string }) {
  if (url) return <img src={fileUrl(url)} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full font-manrope text-[14px] font-bold ${colorFor(id)}`}>
      {initials(name)}
    </div>
  )
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
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [busyId, setBusyId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
      setMessages((prev) => (signature(prev) === signature(list) ? prev : list))
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)))
    } catch (err: any) {
      setError(err.message)
    }
  }, [selectedId])

  useEffect(() => {
    setMessages([])
    setEditing(null)
    if (!selectedId) return
    loadMessages()
    const t = window.setInterval(loadMessages, MESSAGE_POLL_MS)
    return () => window.clearInterval(t)
  }, [selectedId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
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
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    if (BLOCKED_EXT.has(ext)) {
      setError(`Program and script files (.${ext}) cannot be sent. Put them in a .zip if you need to share them.`)
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`"${file.name}" is ${formatBytes(file.size)}. The maximum file size is 20 MB.`)
      return
    }
    setError('')
    setUploading(true)
    try {
      setAttachment(await filesApi.upload(file, active?.projectId || undefined))
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (msg: ChatMessage) => {
    setEditing(msg)
    setAttachment(null)
    setInputText(msg.content)
    setError('')
  }

  const cancelEdit = () => {
    setEditing(null)
    setInputText('')
  }

  const handleDelete = async (msg: ChatMessage) => {
    if (!selectedId || busyId) return
    if (!window.confirm('Delete this message for everyone?')) return
    setBusyId(msg.id)
    try {
      const updated = await messagesApi.deleteMessage(selectedId, msg.id)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)))
      if (editing?.id === msg.id) cancelEdit()
      loadConversations()
    } catch (err: any) {
      setError(err.message || 'Message not deleted')
    } finally {
      setBusyId('')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = inputText.trim()
    if (!selectedId || sending) return
    if (editing) {
      if (!content && !editing.attachmentUrl) return
      setSending(true)
      try {
        const updated = await messagesApi.editMessage(selectedId, editing.id, content)
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
        setEditing(null)
        setInputText('')
        loadConversations()
      } catch (err: any) {
        setError(err.message || 'Message not updated')
      } finally {
        setSending(false)
      }
      return
    }
    if (!content && !attachment) return
    setSending(true)
    try {
      const msg = await messagesApi.sendMessage(selectedId, content, attachment)
      setMessages((prev) => [...prev, msg])
      setInputText('')
      setAttachment(null)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, lastMessage: content || `📎 ${attachment?.originalName || 'Attachment'}`, lastMessageAt: msg.createdAt }
            : c
        )
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
      <div className="w-full rounded-[24px] border border-[#E9EBEF]/60 bg-[#FFFFFF] p-2 shadow-xs sm:p-6 lg:p-7">
        <div className="flex h-[calc(100vh-170px)] min-h-[520px] overflow-hidden rounded-[20px] border border-[#DECFBE] lg:h-[750px]">
          {/* LEFT: conversations */}
          <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[#DECFBE] bg-[#FFFFFF] md:w-[300px] lg:w-[320px]`}>
            <div className="p-4 pb-2">
              <h1 className="font-manrope text-[20px] font-bold text-[#08182B]">Messages</h1>
              <p className="mt-0.5 text-[12px] text-[#786D61]">Conversations with clients & collaborators</p>
            </div>

            <div className="px-4 py-2">
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

            <div className="px-4 py-2">
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

            <div className="flex-1 divide-y divide-[#F2E8DC] overflow-y-auto">
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
          <div className={`${selectedId ? 'flex' : 'hidden md:flex'} relative min-w-0 flex-1 flex-col bg-[#FDFBF7]`}>
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
                      className="rounded-full p-1.5 text-[#7A7065] hover:bg-[#FAF4EE] md:hidden"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <Avatar name={active.otherPartyName} url={active.otherPartyAvatarUrl} id={active.otherPartyId} />
                    <div className="min-w-0">
                      <h3 className="truncate font-manrope text-[15px] font-bold text-[#08182B]">{active.otherPartyName || 'User'}</h3>
                      <span className="text-[11px] font-semibold text-[#8E8376]">
                        {active.otherPartyRole === 'CLIENT' ? 'Client' : active.otherPartyRole === 'FREELANCER' ? 'Freelancer' : 'Hunhar'}
                      </span>
                    </div>
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
              <div className="relative z-10 border-b border-red-200 bg-red-50 px-4 py-2 text-[12px] font-semibold text-red-700">{error}</div>
            )}

            <div className="relative z-10 flex flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-6">
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
                  const isMe = msg.senderId === me?.id
                  const deleted = !!msg.deletedAt
                  const isImage = !!msg.attachmentUrl && (msg.attachmentType || '').startsWith('image/') && !(msg.attachmentType || '').includes('svg')
                  const day = formatDate(msg.createdAt, true)
                  const showDay = day !== lastDay
                  lastDay = day
                  return (
                    <React.Fragment key={msg.id}>
                      {showDay && (
                        <div className="my-1 self-center rounded-full bg-white/80 px-3 py-0.5 text-[11px] font-semibold text-[#8E8376] shadow-2xs">{day}</div>
                      )}
                      <div className={`flex max-w-[85%] items-end gap-2 sm:max-w-[75%] ${isMe ? 'flex-row-reverse self-end' : 'self-start'}`}>
                        {!isMe && <Avatar name={msg.senderName} url={active.otherPartyAvatarUrl} id={msg.senderId} size="h-8 w-8" />}
                        <div className="group min-w-0">
                          <div
                            className={`whitespace-pre-wrap break-words rounded-[16px] p-3 font-manrope text-[13px] leading-relaxed shadow-2xs ${
                              isMe ? 'rounded-br-none bg-[#C06B3E] text-white' : 'rounded-bl-none border border-[#DECFBE] bg-white text-[#08182B]'
                            } ${editing?.id === msg.id ? 'ring-2 ring-[#08182B]/30' : ''}`}
                          >
                            {deleted ? (
                              <span className="italic opacity-75">This message was deleted</span>
                            ) : (
                              <>
                                {msg.content}
                                {isImage && (
                                  <a href={fileUrl(msg.attachmentUrl!)} target="_blank" rel="noreferrer" className="mt-1.5 block">
                                    <img
                                      src={fileUrl(msg.attachmentUrl!)}
                                      alt={msg.attachmentName || 'Image'}
                                      className="max-h-60 max-w-full rounded-[10px] object-contain"
                                      loading="lazy"
                                    />
                                  </a>
                                )}
                                {msg.attachmentUrl && (
                                  <a
                                    href={fileUrl(msg.attachmentUrl) + '?download=true'}
                                    className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-bold underline ${isMe ? 'text-white' : 'text-[#C06B3E]'}`}
                                  >
                                    {isImage ? <Download size={13} /> : <FileText size={13} />}
                                    <span className="truncate">{msg.attachmentName || 'Attachment'}</span>
                                    {msg.attachmentSize ? <span className="shrink-0 font-semibold no-underline opacity-80">· {formatBytes(msg.attachmentSize)}</span> : null}
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                          <div className={`mt-1 flex items-center gap-2 text-[10px] text-[#9A8E80] ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {isMe && !deleted && (
                              <span className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => startEdit(msg)}
                                  disabled={!!busyId}
                                  aria-label="Edit message"
                                  title="Edit"
                                  className="rounded-full p-1 hover:bg-[#FAF4EE] hover:text-[#C06B3E]"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(msg)}
                                  disabled={!!busyId}
                                  aria-label="Delete message"
                                  title="Delete"
                                  className="rounded-full p-1 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </span>
                            )}
                            <span>
                              {formatTime(msg.createdAt)}
                              {msg.editedAt && !deleted ? ' · edited' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {active && (
              <div className="relative z-10 border-t border-[#DECFBE] bg-white p-2.5 sm:p-4">
                {editing && (
                  <div className="mb-2 flex items-center gap-2 rounded-full bg-[#FAF4EE] px-3 py-1 text-[12px] font-semibold text-[#08182B]">
                    <Pencil size={13} /> <span className="truncate">Editing message</span>
                    <button type="button" aria-label="Cancel editing" onClick={cancelEdit} className="ml-auto text-[#8E8376]">
                      <X size={13} />
                    </button>
                  </div>
                )}
                {attachment && (
                  <div className="mb-2 flex items-center gap-2 rounded-full bg-[#FAF4EE] px-3 py-1 text-[12px] font-semibold text-[#08182B]">
                    <FileText size={13} /> <span className="truncate">{attachment.originalName}</span>
                    <span className="shrink-0 text-[11px] font-medium text-[#8E8376]">{formatBytes(attachment.sizeBytes)}</span>
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
                    disabled={uploading || !!editing}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && editing) cancelEdit()
                    }}
                    placeholder={editing ? 'Edit your message...' : 'Type a message...'}
                    aria-label="Message"
                    className="h-10 min-w-0 flex-1 rounded-full border border-[#DECFBE] bg-[#FDFBF7] px-4 font-manrope text-[13px] text-[#08182B] placeholder:text-[#9A8E80] focus:border-[#C06B3E] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={(editing ? !inputText.trim() && !editing.attachmentUrl : !inputText.trim() && !attachment) || sending}
                    aria-label={editing ? 'Save edit' : 'Send'}
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
    </div>
  )
}
