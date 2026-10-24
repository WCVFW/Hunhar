import React, { useState } from 'react'
import {
  Search,
  Paperclip,
  Send,
} from 'lucide-react'
import messageDoodleBg from '../../assets/Message doodle 6.png'

type ConversationTab = 'Client' | 'Hustlers'

interface ChatContact {
  id: string
  name: string
  initial: string
  avatarBg: string
  avatarText: string
  lastMessage: string
  timeAgo?: string
  unread?: boolean
}

interface MessageItem {
  id: string
  sender: 'other' | 'me'
  senderName: string
  senderInitial: string
  avatarBg: string
  timestamp: string
  text: string
}

const clientContacts: ChatContact[] = [
  {
    id: '1',
    name: 'Praveen',
    initial: 'P',
    avatarBg: 'bg-[#FFD7D0]',
    avatarText: 'text-[#E04B35]',
    lastMessage: 'Lorem Ipsum has been the industry\'s standard dummy text ever since 1966',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    name: 'Ashok',
    initial: 'A',
    avatarBg: 'bg-[#CFF3F9]',
    avatarText: 'text-[#0284C7]',
    lastMessage: 'Lorem Ipsum has been the industry\'s standard dummy text ever since 1966',
    timeAgo: 'Yesterday',
  },
  {
    id: '3',
    name: 'Raj',
    initial: 'R',
    avatarBg: 'bg-[#DCD8FE]',
    avatarText: 'text-[#6366F1]',
    lastMessage: 'Lorem Ipsum has been the industry\'s standard dummy text ever since 1966',
    timeAgo: '3d ago',
  },
  {
    id: '4',
    name: 'Aswin',
    initial: 'A',
    avatarBg: 'bg-[#E0F2CE]',
    avatarText: 'text-[#65A30D]',
    lastMessage: 'Lorem Ipsum has been the industry\'s standard dummy text ever since 1966',
    timeAgo: '1w ago',
  },
  {
    id: '5',
    name: 'Sai',
    initial: 'S',
    avatarBg: 'bg-[#FDF0CE]',
    avatarText: 'text-[#CA8A04]',
    lastMessage: 'Lorem Ipsum has been the industry\'s standard dummy text ever since 1966',
    timeAgo: '2w ago',
  },
  {
    id: '6',
    name: 'Om',
    initial: 'O',
    avatarBg: 'bg-[#D0F5F7]',
    avatarText: 'text-[#0D9488]',
    lastMessage: 'Lorem Ipsum has been the industry\'s standard dummy text ever since 1966',
    timeAgo: '3w ago',
  },
]

const hustlerContacts: ChatContact[] = [
  {
    id: 'h1',
    name: 'Kavitha Devi',
    initial: 'K',
    avatarBg: 'bg-[#FCE7F3]',
    avatarText: 'text-[#DB2777]',
    lastMessage: 'Uploaded the brand guidelines Figma frame for your review',
    timeAgo: '1h ago',
  },
  {
    id: 'h2',
    name: 'Vikram Joshi',
    initial: 'V',
    avatarBg: 'bg-[#E0E7FF]',
    avatarText: 'text-[#4F46E5]',
    lastMessage: 'I can take up the motion graphics component if needed',
    timeAgo: '4h ago',
  },
]

const initialMessages: MessageItem[] = [
  {
    id: 'm1',
    sender: 'other',
    senderName: 'ALEX',
    senderInitial: 'A',
    avatarBg: 'bg-[#4338CA]',
    timestamp: '10:24 AM',
    text: 'Hi Alex! I have started working on the initial logo concepts. Will share 3 drafts by end of week.',
  },
  {
    id: 'm2',
    sender: 'me',
    senderName: 'You',
    senderInitial: 'C',
    avatarBg: 'bg-[#C06B3E]',
    timestamp: '10:31 AM',
    text: 'Great! Looking forward to seeing the directions. Please keep the aesthetic minimal and modern.',
  },
  {
    id: 'm3',
    sender: 'other',
    senderName: 'ALEX',
    senderInitial: 'A',
    avatarBg: 'bg-[#4338CA]',
    timestamp: '10:45 AM',
    text: 'Absolutely — minimal and modern is the plan. I will also attach some moodboard references before sharing concepts.',
  },
]

export default function MessagesPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ConversationTab>('Client')
  const [selectedContactId, setSelectedContactId] = useState<string>('1')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [inputText, setInputText] = useState<string>('')

  const contactsList = activeTab === 'Client' ? clientContacts : hustlerContacts
  const filteredContacts = contactsList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeContact =
    contactsList.find((c) => c.id === selectedContactId) || contactsList[0]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${ampm}`

    const newMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'me',
      senderName: 'You',
      senderInitial: 'C',
      avatarBg: 'bg-[#C06B3E]',
      timestamp: formattedTime,
      text: inputText.trim(),
    }

    setMessages((prev) => [...prev, newMsg])
    setInputText('')
  }

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[620px] w-full gap-5 font-manrope">
      {/* ========================================================= */}
      {/* LEFT COLUMN: CONTACTS LIST (Client / Hustlers + Search) */}
      {/* ========================================================= */}
      <div className="flex w-full flex-col rounded-[24px] border border-[#E5E5E5] bg-white p-4 shadow-xs sm:w-[320px] lg:w-[350px] shrink-0">
        {/* Toggle Pill: Client vs Hustlers */}
        <div className="mx-auto mb-4 flex w-full max-w-[280px] items-center rounded-full border border-[#EBE4DC] bg-[#F7F3EE] p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('Client')}
            className={`flex-1 rounded-full py-1.5 text-center font-manrope text-[13px] font-bold transition-all ${
              activeTab === 'Client'
                ? 'bg-[#C06B3E] text-white shadow-sm'
                : 'text-[#7A7065] hover:text-[#08182B]'
            }`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Hustlers')}
            className={`flex-1 rounded-full py-1.5 text-center font-manrope text-[13px] font-bold transition-all ${
              activeTab === 'Hustlers'
                ? 'bg-[#C06B3E] text-white shadow-sm'
                : 'text-[#7A7065] hover:text-[#08182B]'
            }`}
          >
            Hustlers
          </button>
        </div>

        {/* Search Message Box */}
        <div className="relative mb-3 w-full">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9284]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Message"
            className="w-full rounded-full border border-transparent bg-[#F2EDE7] py-2 pl-9 pr-4 font-manrope text-[13px] text-[#08182B] placeholder-[#9E9284] outline-none transition-all focus:border-[#C06B3E]/40 focus:bg-white focus:ring-0"
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin]">
          {filteredContacts.map((contact) => {
            const isSelected = contact.id === activeContact?.id
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-[16px] p-2.5 transition-all ${
                  isSelected
                    ? 'bg-[#F9F5F0]'
                    : 'hover:bg-[#FAF8F5]'
                }`}
              >
                {/* Monogram Avatar with circle */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-manrope text-[16px] font-bold ${contact.avatarBg} ${contact.avatarText}`}
                >
                  {contact.initial}
                </div>

                {/* Name & snippet */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="truncate font-manrope text-[14px] font-bold text-[#08182B]">
                      {contact.name}
                    </h4>
                  </div>
                  <p className="line-clamp-2 mt-0.5 font-manrope text-[11.5px] leading-snug text-[#7A7065]">
                    {contact.lastMessage}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION VIEW */}
      {/* ========================================================= */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] border border-[#E5E5E5] bg-white shadow-xs">
        {/* Chat Header: Contact Name + Time */}
        <div className="border-b border-[#F0ECE6] px-6 py-4">
          <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
            {activeContact?.name || 'Praveen'}
          </h3>
          <span className="font-manrope text-[12px] font-medium text-[#9E9284]">
            {activeContact?.timeAgo || '2h ago'}
          </span>
        </div>

        {/* Message Thread Body with WhatsApp-style Doodle Pattern Background */}
        <div
          className="relative flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin] bg-[#F7F5F0]"
          style={{
            backgroundImage: `url("${messageDoodleBg}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '420px auto',
            backgroundPosition: 'center top',
          }}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'me'

            if (isMe) {
              // Right side message bubble (Beige bubble + Terracotta Monogram on right)
              return (
                <div key={msg.id} className="flex flex-col items-end">
                  <span className="mb-1 font-manrope text-[10.5px] font-medium text-[#9E9284] pr-10">
                    You · {msg.timestamp}
                  </span>
                  <div className="flex items-end gap-2.5 max-w-[80%] sm:max-w-[70%]">
                    {/* Message Bubble (Warm beige tint) */}
                    <div className="rounded-[18px] rounded-br-[4px] bg-[#F3ECE1] px-4 py-3 font-manrope text-[13.5px] leading-relaxed text-[#2C2318] shadow-xs">
                      {msg.text}
                    </div>

                    {/* My Avatar (Terracotta 'C') */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C06B3E] font-manrope text-[13px] font-bold text-white shadow-2xs">
                      {msg.senderInitial}
                    </div>
                  </div>
                </div>
              )
            }

            // Left side message bubble (White bubble + Purple/Blue Monogram on left)
            return (
              <div key={msg.id} className="flex flex-col items-start">
                <span className="mb-1 font-manrope text-[10.5px] font-medium uppercase tracking-wider text-[#9E9284] pl-10">
                  {msg.senderName} · {msg.timestamp}
                </span>
                <div className="flex items-start gap-2.5 max-w-[80%] sm:max-w-[70%]">
                  {/* Sender Avatar ('A' on dark indigo) */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4338CA] font-manrope text-[13px] font-bold text-white shadow-2xs">
                    {msg.senderInitial}
                  </div>

                  {/* Message Bubble (Pure white with subtle border) */}
                  <div className="rounded-[18px] rounded-tl-[4px] border border-[#EDE5DA] bg-white px-4 py-3 font-manrope text-[13.5px] leading-relaxed text-[#08182B] shadow-xs">
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-[#EFECE6] bg-white p-4">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 rounded-full border border-[#E8E0D5] bg-white px-4 py-2 shadow-xs transition-all focus-within:border-[#C06B3E]/50 focus-within:ring-1 focus-within:ring-[#C06B3E]/30"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 bg-transparent font-manrope text-[13.5px] text-[#08182B] placeholder-[#9E9284] outline-none"
            />

            {/* Paperclip attachment icon */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#9E9284] transition-colors hover:bg-[#F5EFE6] hover:text-[#08182B]"
              aria-label="Attach file"
            >
              <Paperclip size={17} />
            </button>

            {/* Terracotta Send Icon Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-xs transition-all hover:bg-[#AA572D] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
