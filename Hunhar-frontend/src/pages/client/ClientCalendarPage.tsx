import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  Square,
  CheckSquare,
} from 'lucide-react'

interface TaskStatusCard {
  id: string
  label: string
  count: number
  icon: React.ReactNode
  bgColor: string
  textColor: string
  badgeColor: string
}

interface CalendarEventDot {
  type: 'task' | 'meeting' | 'deadline' | 'milestone'
}

interface CalendarDay {
  dayNumber: number
  isCurrentMonth: boolean
  isToday?: boolean
  isSelected?: boolean
  events?: CalendarEventDot[]
}

export default function ClientCalendarPage(): React.JSX.Element {
  const [currentMonth, setCurrentMonth] = useState<string>('September 2026')
  const [selectedDay, setSelectedDay] = useState<number>(3)
  const [meetingDone, setMeetingDone] = useState<boolean>(false)
  const [taskDone, setTaskDone] = useState<boolean>(false)

  // Status counters exactly matching screenshot
  const taskStatusList: TaskStatusCard[] = [
    {
      id: 'todo',
      label: 'To Do',
      count: 10,
      icon: <Circle size={15} className="text-[#EAB308]" />,
      bgColor: 'bg-[#FEFCE8]',
      textColor: 'text-[#854D0E]',
      badgeColor: 'text-[#854D0E]',
    },
    {
      id: 'inprogress',
      label: 'In Progress',
      count: 4,
      icon: <Clock size={15} className="text-[#3B82F6]" />,
      bgColor: 'bg-[#EFF6FF]',
      textColor: 'text-[#1D4ED8]',
      badgeColor: 'text-[#1D4ED8]',
    },
    {
      id: 'completed',
      label: 'Completed',
      count: 2,
      icon: <CheckCircle2 size={15} className="text-[#22C55E]" />,
      bgColor: 'bg-[#F0FDF4]',
      textColor: 'text-[#15803D]',
      badgeColor: 'text-[#15803D]',
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: 0,
      icon: <AlertCircle size={15} className="text-[#EF4444]" />,
      bgColor: 'bg-[#FEF2F2]',
      textColor: 'text-[#B91C1C]',
      badgeColor: 'text-[#B91C1C]',
    },
  ]

  // September 2026 calendar matrix (Starts Monday Aug 31)
  const daysGrid: CalendarDay[] = [
    // Row 1
    { dayNumber: 31, isCurrentMonth: false },
    { dayNumber: 1, isCurrentMonth: true },
    { dayNumber: 2, isCurrentMonth: true },
    {
      dayNumber: 3,
      isCurrentMonth: true,
      isToday: true,
      events: [{ type: 'meeting' }, { type: 'meeting' }, { type: 'task' }],
    },
    { dayNumber: 4, isCurrentMonth: true },
    { dayNumber: 5, isCurrentMonth: true },
    { dayNumber: 6, isCurrentMonth: true },
    // Row 2
    { dayNumber: 7, isCurrentMonth: true },
    { dayNumber: 8, isCurrentMonth: true },
    { dayNumber: 9, isCurrentMonth: true },
    { dayNumber: 10, isCurrentMonth: true },
    { dayNumber: 11, isCurrentMonth: true },
    { dayNumber: 12, isCurrentMonth: true },
    { dayNumber: 13, isCurrentMonth: true },
    // Row 3
    { dayNumber: 14, isCurrentMonth: true },
    { dayNumber: 15, isCurrentMonth: true },
    { dayNumber: 16, isCurrentMonth: true },
    { dayNumber: 17, isCurrentMonth: true },
    { dayNumber: 18, isCurrentMonth: true },
    { dayNumber: 19, isCurrentMonth: true },
    { dayNumber: 20, isCurrentMonth: true },
    // Row 4
    { dayNumber: 21, isCurrentMonth: true },
    { dayNumber: 22, isCurrentMonth: true },
    { dayNumber: 23, isCurrentMonth: true },
    { dayNumber: 24, isCurrentMonth: true },
    { dayNumber: 25, isCurrentMonth: true },
    { dayNumber: 26, isCurrentMonth: true },
    { dayNumber: 27, isCurrentMonth: true },
    // Row 5
    { dayNumber: 28, isCurrentMonth: true },
    { dayNumber: 29, isCurrentMonth: true },
    { dayNumber: 30, isCurrentMonth: true },
    { dayNumber: 1, isCurrentMonth: false },
    { dayNumber: 2, isCurrentMonth: false },
    { dayNumber: 3, isCurrentMonth: false },
    { dayNumber: 4, isCurrentMonth: false },
    // Row 6
    { dayNumber: 5, isCurrentMonth: false },
    { dayNumber: 6, isCurrentMonth: false },
    { dayNumber: 7, isCurrentMonth: false },
    { dayNumber: 8, isCurrentMonth: false },
    { dayNumber: 9, isCurrentMonth: false },
    { dayNumber: 10, isCurrentMonth: false },
    { dayNumber: 11, isCurrentMonth: false },
  ]

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching exact screenshot */}
      <div className="w-full min-h-[840px] rounded-[24px] bg-white p-6 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* 1. Header: Calendar title in Terracotta + subtitle */}
        <div className="mb-7">
          <h1 className="font-manrope text-[24px] sm:text-[26px] font-bold text-[#C06B3E]">
            Calendar
          </h1>
          <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">
            Plan your schedule and manage your tasks.
          </p>
        </div>

        {/* 2. Main 2-Column Content Grid: Left Calendar Card + Right Status/Summary Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ========================================================= */}
          {/* LEFT: CALENDAR MONTH MATRIX CARD (8 cols) */}
          {/* ========================================================= */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs lg:col-span-8">
            <div>
              {/* Header row: Month & Year (Left) + Today, Left, Right controls (Right) */}
              <div className="flex items-center justify-between pb-6">
                <h2 className="font-manrope text-[16.5px] font-bold text-[#08182B]">
                  {currentMonth}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMonth('September 2026')
                      setSelectedDay(3)
                    }}
                    className="rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1 font-manrope text-[12.5px] font-medium text-[#475569] shadow-2xs hover:bg-[#F8FAFC] transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white text-[#64748B] shadow-2xs hover:bg-[#F8FAFC] transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white text-[#64748B] shadow-2xs hover:bg-[#F8FAFC] transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day Name Headers */}
              <div className="grid grid-cols-7 text-center font-manrope text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] pb-3">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              {/* 6-Row Calendar Day Grid */}
              <div className="grid grid-cols-7 gap-y-2 text-center">
                {daysGrid.map((day, idx) => {
                  const isDaySelected = day.isCurrentMonth && selectedDay === day.dayNumber
                  const isSep1 = day.isCurrentMonth && day.dayNumber === 1

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (day.isCurrentMonth) setSelectedDay(day.dayNumber)
                      }}
                      className="flex flex-col items-center justify-center py-2 relative cursor-pointer"
                    >
                      {/* Day Number Box / Pill */}
                      <div
                        className={`flex h-11 w-11 sm:h-12 sm:w-12 flex-col items-center justify-center rounded-[14px] transition-all ${
                          day.isToday
                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold shadow-xs'
                            : isSep1
                            ? 'bg-[#FAF3EB] text-[#08182B] font-bold'
                            : isDaySelected
                            ? 'bg-[#F9F5F0] text-[#C06B3E] font-bold'
                            : day.isCurrentMonth
                            ? 'text-[#08182B] font-semibold hover:bg-[#F8F9FA]'
                            : 'text-[#CBD5E1] font-normal'
                        }`}
                      >
                        <span className="text-[13.5px]">{day.dayNumber}</span>

                        {/* Three Blue Dots for September 3 (Today) matching screenshot */}
                        {day.isToday && (
                          <div className="mt-0.5 flex items-center gap-0.5">
                            <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                            <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                            <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Legend matching exact screenshot: Task, Meeting, Deadline, Milestone */}
            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-[#F1ECE5] pt-4 font-manrope text-[11.5px] text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span>Task</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0284C7]" />
                <span>Meeting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                <span>Deadline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <span>Milestone</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: TASK STATUS & TODAY'S SUMMARY (4 cols) */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Top Right Card: Task Status List */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[15px] font-bold text-[#08182B]">
                Task Status
              </h3>

              <div className="mt-4 flex flex-col space-y-2.5">
                {taskStatusList.map((st) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between rounded-[12px] px-4 py-3 transition-colors ${st.bgColor}`}
                  >
                    <div className="flex items-center gap-2.5 font-manrope text-[13px] font-semibold">
                      {st.icon}
                      <span className={st.textColor}>{st.label}</span>
                    </div>
                    <span className={`font-manrope text-[14px] font-bold ${st.badgeColor}`}>
                      {st.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Right Card: Today's Summary */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  Today's Summary
                </h3>
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#4F46E5]">
                  3 Sept
                </span>
              </div>

              {/* Items List */}
              <div className="mt-4 flex flex-col space-y-3 font-manrope text-[13px]">
                {/* Meetings item */}
                <div
                  onClick={() => setMeetingDone(!meetingDone)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 text-[#475569]">
                    <Circle
                      size={15}
                      className={meetingDone ? 'fill-[#3B82F6] text-[#3B82F6]' : 'text-[#94A3B8]'}
                    />
                    <span className={meetingDone ? 'line-through text-[#94A3B8]' : 'text-[#334155]'}>
                      Meetings
                    </span>
                  </div>
                  <span className="font-bold text-[#08182B]">2</span>
                </div>

                {/* Tasks item */}
                <div
                  onClick={() => setTaskDone(!taskDone)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 text-[#475569]">
                    <Square
                      size={15}
                      className={taskDone ? 'fill-[#C06B3E] text-[#C06B3E]' : 'text-[#94A3B8]'}
                    />
                    <span className={taskDone ? 'line-through text-[#94A3B8]' : 'text-[#334155]'}>
                      Tasks
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to Today Button */}
              <button
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-[#F3C9B2] bg-[#FAF3EB] py-2.5 font-manrope text-[13px] font-bold text-[#C06B3E] shadow-2xs hover:bg-[#F5ECE0] transition-colors active:scale-98"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add to Today</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
