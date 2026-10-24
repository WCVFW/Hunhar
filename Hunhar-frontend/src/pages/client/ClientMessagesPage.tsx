import React, { useState } from 'react'
import {
  Search,
  Paperclip,
  Send,
} from 'lucide-react'
import messageDoodleBg from '../../assets/Message doodle 6.png'

interface ChatContact {
  id: string
  name: string
  initial: string
  avatarBg: string
  avatarText: string
  lastMessage: string
  timeAgo: string
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

export default function ClientMessagesPage(): React.JSX.Element {
  const [selectedContactId, setSelectedContactId] = useState<string>('1')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [inputText, setInputText] = useState<string>('')

  const filteredContacts = clientContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeContact =
    clientContacts.find((c) => c.id === selectedContactId) || clientContacts[0]

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
    <div className="flex h-[calc(100vh-100px)] min-h-[660px] w-full gap-5 font-manrope">
      {/* ========================================================= */}
      {/* LEFT COLUMN: CONTACTS LIST (Search + Contact list) */}
      {/* Exactly matching client side screenshot: No Freelancer Hustlers tab */}
      {/* ========================================================= */}
      <div className="flex w-full flex-col rounded-[24px] border border-[#E9EBEF]/60 bg-white p-5 shadow-xs sm:w-[320px] lg:w-[360px] shrink-0">
        {/* Search Message input field */}
        <div className="relative mb-4 w-full">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9284]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Message"
            className="w-full rounded-full border border-transparent bg-[#F2EDE7] py-2.5 pl-10 pr-4 font-manrope text-[13px] text-[#08182B] placeholder-[#9E9284] outline-none transition-all focus:border-[#C06B3E]/40 focus:bg-white focus:ring-0"
          />
        </div>

        {/* Contacts List with rounded avatars matching exact colors */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
          {filteredContacts.map((contact) => {
            const isSelected = contact.id === activeContact?.id
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-[16px] p-3 transition-all ${
                  isSelected
                    ? 'bg-[#F9F5F0]'
                    : 'hover:bg-[#FAF8F5]'
                }`}
              >
                {/* Monogram Avatar with circle */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-manrope text-[16px] font-bold ${contact.avatarBg} ${contact.avatarText}`}
                >
                  {contact.initial}
                </div>

                {/* Name & snippet */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="truncate font-manrope text-[14.5px] font-bold text-[#08182B]">
                      {contact.name}
                    </h4>
                  </div>
                  <p className="line-clamp-2 mt-0.5 font-manrope text-[12px] leading-snug text-[#7A7065]">
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
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] border border-[#E9EBEF]/60 bg-white shadow-xs">
        {/* Chat Header: Contact Name + Time */}
        <div className="border-b border-[#F0ECE6] px-7 py-4">
          <h3 className="font-manrope text-[16.5px] font-bold text-[#08182B]">
            {activeContact?.name || 'Praveen'}
          </h3>
          <span className="font-manrope text-[12px] font-medium text-[#9E9284]">
            {activeContact?.timeAgo || '2h ago'}
          </span>
        </div>

        {/* Message Thread Body with WhatsApp-style Doodle Pattern Background */}
        <div
          className="relative flex-1 overflow-y-auto p-7 space-y-6 [scrollbar-width:thin] bg-[#F7F5F0]"
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
              // Right side message bubble (Terracotta bubble matching screenshot + 'C' avatar)
              return (
                <div key={msg.id} className="flex flex-col items-end">
                  <span className="mb-1 font-manrope text-[10.5px] font-medium text-[#9E9284] pr-10">
                    You · {msg.timestamp}
                  </span>
                  <div className="flex items-center gap-2.5 max-w-[85%] sm:max-w-[75%]">
                    {/* Message Bubble: Warm terracotta background with white text matching exact screenshot */}
                    <div className="rounded-[18px] rounded-br-[4px] bg-[#C06B3E] px-4 py-3 font-manrope text-[13.5px] leading-relaxed text-white shadow-xs">
                      {msg.text}
                    </div>

                    {/* Client Avatar (Terracotta 'C') */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C06B3E] font-manrope text-[13px] font-bold text-white shadow-2xs">
                      {msg.senderInitial}
                    </div>
                  </div>
                </div>
              )
            }

            // Left side message bubble (White bubble + Purple/Blue 'A' Monogram on left)
            return (
              <div key={msg.id} className="flex flex-col items-start">
                <span className="mb-1 font-manrope text-[10.5px] font-medium uppercase tracking-wider text-[#9E9284] pl-10">
                  {msg.senderName} · {msg.timestamp}
                </span>
                <div className="flex items-center gap-2.5 max-w-[85%] sm:max-w-[75%]">
                  {/* Sender Avatar ('A' on dark indigo/blue) */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4338CA] font-manrope text-[13px] font-bold text-white shadow-2xs">
                    {msg.senderInitial}
                  </div>

                  {/* Message Bubble: White bubble matching screenshot */}
                  <div className="rounded-[18px] rounded-tl-[4px] border border-[#EAE3D9] bg-white px-4 py-3 font-manrope text-[13.5px] leading-relaxed text-[#08182B] shadow-xs">
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chat Input Bar at bottom inside white card */}
        <div className="border-t border-[#EFECE6] bg-white p-4 sm:px-6">
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
              <Paperclip size={18} />
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
