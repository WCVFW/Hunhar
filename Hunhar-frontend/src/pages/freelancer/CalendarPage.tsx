import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react'

interface TaskStatusCount {
  label: string
  count: number
  iconType: 'todo' | 'progress' | 'completed' | 'overdue'
  bgColor: string
  textColor: string
  badgeBg: string
}

const taskStatuses: TaskStatusCount[] = [
  {
    label: 'To Do',
    count: 10,
    iconType: 'todo',
    bgColor: 'bg-[#FBF8F3]',
    textColor: 'text-[#4A4036]',
    badgeBg: 'text-[#1F2937]',
  },
  {
    label: 'In Progress',
    count: 4,
    iconType: 'progress',
    bgColor: 'bg-[#F6EFE7]',
    textColor: 'text-[#A05C35]',
    badgeBg: 'text-[#C06B3E]',
  },
  {
    label: 'Completed',
    count: 2,
    iconType: 'completed',
    bgColor: 'bg-[#EFFBF2]',
    textColor: 'text-[#1F874C]',
    badgeBg: 'text-[#1F874C]',
  },
  {
    label: 'Overdue',
    count: 0,
    iconType: 'overdue',
    bgColor: 'bg-[#FFF1F2]',
    textColor: 'text-[#E11D48]',
    badgeBg: 'text-[#E11D48]',
  },
]

interface ScheduledTask {
  id: string
  title: string
  time: string
  type: 'Deadline' | 'Task' | 'Meeting' | 'Milestone'
  project: string
  completed?: boolean
}

interface RoadmapItem {
  id: string
  title: string
  time?: string
  type: 'meeting' | 'review' | 'deadline' | 'milestone' | 'task'
}

interface DayColumn {
  dayName: string
  dateNumber: number | string
  isToday?: boolean
  tasks: RoadmapItem[]
  progress?: string
}

const initialRoadmapData: DayColumn[] = [
  {
    dayName: 'MON',
    dateNumber: 31,
    tasks: [],
    progress: '',
  },
  {
    dayName: 'TUE',
    dateNumber: 1,
    tasks: [
      {
        id: 't1',
        title: 'Competitor Research',
        time: '10:00',
        type: 'task',
      },
    ],
    progress: '1/1 done · 100%',
  },
  {
    dayName: 'WED',
    dateNumber: 2,
    tasks: [
      {
        id: 't2',
        title: 'Discovery Phase Sign-off',
        time: '17:00',
        type: 'milestone',
      },
    ],
    progress: '1/1 done · 100%',
  },
  {
    dayName: 'THU',
    dateNumber: 3,
    isToday: true,
    tasks: [
      {
        id: 't3',
        title: 'Brand Identity Check-in',
        time: '10:00',
        type: 'meeting',
      },
      {
        id: 't4',
        title: 'Logo Concepts Review',
        time: '14:00',
        type: 'review',
      },
      {
        id: 't5',
        title: 'Client Call — Orbit',
        time: '16:30',
        type: 'meeting',
      },
    ],
    progress: '0/3 done · 0%',
  },
  {
    dayName: 'FRI',
    dateNumber: 4,
    tasks: [
      {
        id: 't6',
        title: 'Design Review Session',
        time: '11:00',
        type: 'review',
      },
      {
        id: 't7',
        title: 'Typography System Deadline',
        time: '17:00',
        type: 'deadline',
      },
    ],
    progress: '0/2 done · 0%',
  },
  {
    dayName: 'SAT',
    dateNumber: 5,
    tasks: [
      {
        id: 't8',
        title: 'Website Redesign Milestone',
        time: '12:00',
        type: 'milestone',
      },
      {
        id: 't9',
        title: 'Social Media Templates Draft',
        time: '13:00',
        type: 'task',
      },
    ],
    progress: '0/2 done · 0%',
  },
  {
    dayName: 'SUN',
    dateNumber: 6,
    tasks: [
      {
        id: 't10',
        title: 'Content Planning',
        time: '14:00',
        type: 'task',
      },
    ],
    progress: '0/1 done · 0%',
  },
]

// Scheduled tasks mapping per date key (e.g. '2026-8-4' = 4 September 2026)
const defaultScheduledTasks: Record<string, ScheduledTask[]> = {
  '2026-8-4': [
    {
      id: 'st-1',
      title: 'Typography System Deadline',
      time: '17:00',
      type: 'Deadline',
      project: 'Brand Identity',
    },
    {
      id: 'st-2',
      title: 'Design Review Session',
      time: '11:00',
      type: 'Task',
      project: 'Website Redesign',
    },
  ],
  '2026-8-3': [
    {
      id: 'st-3',
      title: 'Brand Identity Check-in',
      time: '10:00',
      type: 'Meeting',
      project: 'Brand Identity',
    },
    {
      id: 'st-4',
      title: 'Logo Concepts Review',
      time: '14:00',
      type: 'Task',
      project: 'Brand Identity',
    },
    {
      id: 'st-5',
      title: 'Client Call — Orbit',
      time: '16:30',
      type: 'Meeting',
      project: 'Orbit App',
    },
  ],
  '2026-8-5': [
    {
      id: 'st-6',
      title: 'Website Redesign Milestone',
      time: '12:00',
      type: 'Milestone',
      project: 'Website Redesign',
    },
  ],
}

interface CalendarCell {
  dayNumber: number
  monthOffset: number // -1 = prev month, 0 = current, 1 = next
  dateKey: string
  dots?: string[]
}

export default function CalendarPage(): React.JSX.Element {
  // Calendar month state: September 2026 (month 8, 0-indexed)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 8, 3))

  // Task Store
  const [tasksStore, setTasksStore] =
    useState<Record<string, ScheduledTask[]>>(defaultScheduledTasks)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalDate, setModalDate] = useState<Date>(new Date(2026, 8, 3))

  // New task form inside modal
  const [taskTitle, setTaskTitle] = useState<string>('')
  const [taskType, setTaskType] = useState<string>('Task')
  const [taskPriority, setTaskPriority] = useState<string>('Medium')
  const [taskTime, setTaskTime] = useState<string>('')
  const [taskProject, setTaskProject] = useState<string>('None')
  const [taskNotes, setTaskNotes] = useState<string>('')
  const [taskReminder, setTaskReminder] = useState<string>('No reminder')

  // Month navigation helpers
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const monthTitle = `${monthNames[currentMonth]} ${currentYear}`

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleTodayClick = () => {
    const today = new Date(2026, 8, 3)
    setCurrentDate(new Date(2026, 8, 1))
    setSelectedDate(today)
    openDateModal(today)
  }

  // Generate 42 calendar grid cells (Monday-first)
  const generateMonthGrid = (): CalendarCell[] => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    // Convert Sunday=0 to Monday-first (0=Mon, ..., 6=Sun)
    const monFirstStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1

    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    const cells: CalendarCell[] = []

    // Previous month filler days
    for (let i = monFirstStart - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevDate = new Date(currentYear, currentMonth - 1, d)
      const key = `${prevDate.getFullYear()}-${prevDate.getMonth()}-${prevDate.getDate()}`
      cells.push({
        dayNumber: d,
        monthOffset: -1,
        dateKey: key,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const key = `${currentYear}-${currentMonth}-${d}`
      const hasTasks = tasksStore[key] && tasksStore[key].length > 0
      cells.push({
        dayNumber: d,
        monthOffset: 0,
        dateKey: key,
        dots: hasTasks ? ['#4F46E5', '#4F46E5', '#4F46E5'] : undefined,
      })
    }

    // Next month filler days up to 42 cells (6 rows x 7)
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d)
      const key = `${nextDate.getFullYear()}-${nextDate.getMonth()}-${nextDate.getDate()}`
      cells.push({
        dayNumber: d,
        monthOffset: 1,
        dateKey: key,
      })
    }

    return cells
  }

  const calendarGrid = generateMonthGrid()

  // Open Modal for clicked date
  const openDateModal = (date: Date) => {
    setModalDate(date)
    setSelectedDate(date)
    // Clear form inputs
    setTaskTitle('')
    setTaskType('Task')
    setTaskPriority('Medium')
    setTaskTime('')
    setTaskProject('None')
    setTaskNotes('')
    setTaskReminder('No reminder')
    setIsModalOpen(true)
  }

  const handleCellClick = (cell: CalendarCell) => {
    let targetMonth = currentMonth
    let targetYear = currentYear
    if (cell.monthOffset === -1) {
      targetMonth = currentMonth - 1
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
    } else if (cell.monthOffset === 1) {
      targetMonth = currentMonth + 1
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear += 1
      }
    }

    const clicked = new Date(targetYear, targetMonth, cell.dayNumber)
    openDateModal(clicked)
  }

  // Current modal date key
  const modalDateKey = `${modalDate.getFullYear()}-${modalDate.getMonth()}-${modalDate.getDate()}`
  const existingTasksForModal = tasksStore[modalDateKey] || []

  // Format Date for Header
  const weekdayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const modalWeekday = weekdayNames[modalDate.getDay()]
  const modalMonthName = monthNames[modalDate.getMonth()]
  const modalDayNumber = modalDate.getDate()
  const modalYear = modalDate.getFullYear()

  // Form submit: Add new task
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      time: taskTime.trim() || '12:00',
      type: (taskType as ScheduledTask['type']) || 'Task',
      project: taskProject !== 'None' ? taskProject : 'Personal',
    }

    setTasksStore((prev) => ({
      ...prev,
      [modalDateKey]: [...(prev[modalDateKey] || []), newTask],
    }))

    // Reset Title
    setTaskTitle('')
    setTaskNotes('')
  }

  const handleToggleTaskCompleted = (taskId: string) => {
    setTasksStore((prev) => {
      const dayTasks = prev[modalDateKey] || []
      const updated = dayTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
      return { ...prev, [modalDateKey]: updated }
    })
  }

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-7 lg:p-8 shadow-xs font-manrope">
      <div className="flex w-full flex-col gap-6">
        {/* 1. TOP HEADER & SUBTITLE */}
        <div className="pb-1">
          <h1 className="font-manrope text-[24px] font-bold text-[#C06B3E] sm:text-[26px]">
            Calendar
          </h1>
          <p className="mt-0.5 font-manrope text-[14px] text-[#7A7065]">
            Plan your schedule and manage your tasks.
          </p>
        </div>

        {/* 2. TOP SECTION: MONTHLY CALENDAR (Left) + STATS & SUMMARY (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left: Monthly Calendar Widget (8 Cols) */}
          <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-6 shadow-xs lg:col-span-8 flex flex-col justify-between min-h-[440px]">
            <div>
              {/* Calendar Controls with functional month changer */}
              <div className="flex items-center justify-between pb-4">
                <h2 className="font-manrope text-[18px] font-bold text-[#08182B]">
                  {monthTitle}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTodayClick}
                    className="rounded-full border border-[#E5DACD] bg-white px-3.5 py-1 text-[12px] font-bold text-[#4A4036] transition-colors hover:bg-[#FAF7F2] active:scale-95"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] transition-colors hover:bg-[#FAF7F2] active:scale-95"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5DACD] text-[#7A7065] transition-colors hover:bg-[#FAF7F2] active:scale-95"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Days of Week Row */}
              <div className="grid grid-cols-7 text-center font-manrope text-[11.5px] font-bold uppercase tracking-wider text-[#A09588] py-2">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              {/* Dates Grid (Interactive: Click any date to open popup modal) */}
              <div className="grid grid-cols-7 gap-y-2 text-center font-manrope text-[13.5px]">
                {calendarGrid.map((cell, idx) => {
                  const isCurrentMonth = cell.monthOffset === 0
                  const isTodaySelected =
                    isCurrentMonth &&
                    currentYear === 2026 &&
                    currentMonth === 8 &&
                    cell.dayNumber === 3

                  const isClickedDay =
                    isCurrentMonth &&
                    currentYear === selectedDate.getFullYear() &&
                    currentMonth === selectedDate.getMonth() &&
                    cell.dayNumber === selectedDate.getDate()

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCellClick(cell)}
                      className="group flex flex-col items-center justify-center cursor-pointer py-1"
                    >
                      {isTodaySelected ? (
                        <div className="flex h-11 w-11 flex-col items-center justify-center rounded-[12px] bg-[#EEF2FF] font-bold text-[#4F46E5] shadow-xs ring-2 ring-[#4F46E5]/20 transition-transform group-hover:scale-105">
                          <span>{cell.dayNumber}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                            <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                            <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                          </div>
                        </div>
                      ) : isClickedDay ? (
                        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-[12px] bg-[#FAF3ED] font-bold text-[#C06B3E] ring-2 ring-[#C06B3E]/40 transition-transform group-hover:scale-105">
                          <span>{cell.dayNumber}</span>
                          {cell.dots && (
                            <div className="flex gap-0.5 mt-0.5">
                              <span className="h-1 w-1 rounded-full bg-[#C06B3E]" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`flex h-10 w-10 flex-col items-center justify-center rounded-[10px] transition-all group-hover:bg-[#F7F4EF] ${
                            isCurrentMonth
                              ? 'text-[#334155] font-medium'
                              : 'text-[#CBD5E1]'
                          }`}
                        >
                          <span>{cell.dayNumber}</span>
                          {cell.dots && (
                            <div className="flex gap-0.5 mt-0.5">
                              <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                              <span className="h-1 w-1 rounded-full bg-[#4F46E5]" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom Indicators Legend */}
            <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-[#F0ECE6] font-manrope text-[12px] font-medium text-[#7A7065]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#4F46E5]" />
                <span>Task</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
                <span>Meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                <span>Deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <span>Milestone</span>
              </div>
            </div>
          </div>

          {/* Right: Task Status & Today's Summary (4 Cols) */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            {/* Card 1: Task Status Counts */}
            <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B] pb-3.5">
                Task Status
              </h3>

              <div className="flex flex-col gap-2.5">
                {taskStatuses.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-[14px] p-3 font-manrope transition-all ${item.bgColor}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.iconType === 'todo' && (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-[#94A3B8]" />
                      )}
                      {item.iconType === 'progress' && (
                        <Clock size={15} className="text-[#C06B3E]" />
                      )}
                      {item.iconType === 'completed' && (
                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1F874C] text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      {item.iconType === 'overdue' && (
                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#E11D48] text-[#E11D48] text-[9px] font-black">
                          !
                        </div>
                      )}
                      <span className="text-[13px] font-bold text-[#2A231A]">
                        {item.label}
                      </span>
                    </div>

                    <span className={`text-[15px] font-extrabold ${item.badgeBg}`}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Today's Summary */}
            <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                  Today's Summary
                </h3>
                <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#6366F1]">
                  3 Sept
                </span>
              </div>

              <div className="space-y-2 py-1 font-manrope text-[13px] text-[#4A4036]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1]" />
                    <span>Meetings</span>
                  </div>
                  <span className="font-bold text-[#08182B]">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full border border-[#94A3B8]" />
                    <span>Tasks</span>
                  </div>
                  <span className="font-bold text-[#08182B]">1</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTodayClick}
                className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#EEF2FF] font-manrope text-[13px] font-bold text-[#4F46E5] transition-all hover:bg-[#E0E7FF] active:scale-98"
              >
                <Plus size={15} />
                <span>Add to Today</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM SECTION: WEEKLY ROADMAP */}
        <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-6 shadow-xs">
          {/* Roadmap Title & View Switcher */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center pb-5">
            <div>
              <h2 className="font-manrope text-[18px] font-bold text-[#08182B]">
                Weekly Roadmap
              </h2>
              <p className="mt-0.5 font-manrope text-[13px] text-[#7A7065]">
                Plan and assign your tasks for this week.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF7F2]"
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="rounded-lg border border-[#E5DACD] bg-white px-4 py-1.5 font-manrope text-[13px] font-bold text-[#08182B]">
                This Week
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5DACD] text-[#7A7065] hover:bg-[#FAF7F2]"
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 7 Columns: Mon through Sun */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 overflow-x-auto">
            {initialRoadmapData.map((col, idx) => {
              const hasCompleted = col.progress?.includes('100%')
              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between rounded-[20px] p-4 min-h-[400px] transition-all ${
                    col.isToday
                      ? 'border-2 border-[#C06B3E] bg-white shadow-sm'
                      : 'border border-[#EFECE6] bg-[#FAF8F5]'
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3.5">
                      <div>
                        <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A09588]">
                          {col.dayName}
                        </span>
                        <span
                          className={`font-manrope text-[18px] font-extrabold ${
                            col.isToday ? 'text-[#C06B3E]' : 'text-[#08182B]'
                          }`}
                        >
                          {col.dateNumber}
                        </span>
                      </div>

                      {col.isToday && (
                        <span className="rounded-full bg-[#FBF0EA] px-2.5 py-0.5 font-manrope text-[10px] font-bold text-[#C06B3E]">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Tasks List */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      {col.tasks.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-[12px] text-[#A89D91]">
                          No tasks
                        </div>
                      ) : (
                        col.tasks.map((task) => {
                          let borderLeftColor = 'border-l-[#1E293B]'
                          let taskBg = 'bg-[#F5EFE6]'

                          if (task.type === 'meeting') {
                            borderLeftColor = 'border-l-[#1E293B]'
                            taskBg = 'bg-[#F4ECE1]'
                          } else if (task.type === 'review') {
                            borderLeftColor = 'border-l-[#C06B3E]'
                            taskBg = 'bg-[#F9F4EC]'
                          } else if (task.type === 'deadline') {
                            borderLeftColor = 'border-l-[#C06B3E]'
                            taskBg = 'bg-[#F9F4EC]'
                          } else if (task.type === 'milestone') {
                            borderLeftColor = 'border-l-[#C06B3E]'
                            taskBg = 'bg-[#F4ECE1]'
                          } else if (task.type === 'task') {
                            borderLeftColor = 'border-l-[#1E293B]'
                            taskBg = 'bg-[#F4ECE1]'
                          }

                          if (col.dateNumber === 1 || col.dateNumber === 2) {
                            taskBg = 'bg-white/80'
                            borderLeftColor = 'border-l-transparent'
                          }

                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                const dayNum = typeof col.dateNumber === 'number' ? col.dateNumber : 3
                                openDateModal(new Date(2026, 8, dayNum))
                              }}
                              className={`cursor-pointer rounded-[12px] border-l-[3.5px] ${borderLeftColor} ${taskBg} p-3 shadow-2xs transition-all hover:shadow-md hover:scale-[1.01]`}
                            >
                              <h4 className="font-manrope text-[12.5px] font-bold leading-snug text-[#08182B]">
                                {task.title}
                              </h4>
                              {task.time && (
                                <div className="mt-1.5 flex items-center gap-1 font-manrope text-[11px] font-medium text-[#8E8376]">
                                  <Clock size={11} />
                                  <span>{task.time}</span>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Bottom: Add Task Button & Progress bar */}
                  <div className="mt-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const dayNum = typeof col.dateNumber === 'number' ? col.dateNumber : 3
                        openDateModal(new Date(2026, 8, dayNum))
                      }}
                      className={`flex w-full items-center justify-center gap-1 rounded-[10px] py-1.5 font-manrope text-[11px] font-bold transition-all ${
                        col.isToday
                          ? 'border border-[#C06B3E] text-[#C06B3E] bg-[#FFF9F5] hover:bg-[#FDF3EB]'
                          : 'border border-dashed border-[#DECFBE] text-[#7A7065] hover:border-[#C06B3E] hover:text-[#C06B3E]'
                      }`}
                    >
                      <Plus size={12} />
                      <span>Add Task</span>
                    </button>

                    {col.progress ? (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between font-manrope text-[10px] font-bold text-[#8E8376]">
                          <span>{col.progress.split(' · ')[0]}</span>
                          <span className={hasCompleted ? 'text-[#16A34A]' : 'text-[#8E8376]'}>
                            {col.progress.split(' · ')[1]}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#EADDCF]">
                          <div
                            className={`h-full rounded-full ${
                              hasCompleted ? 'bg-[#16A34A]' : 'bg-[#EADDCF]'
                            }`}
                            style={{ width: hasCompleted ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL (Matching User Images 1 & 2)                  */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] transition-opacity"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative flex w-full max-w-[480px] max-h-[88vh] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed at top with generous top and bottom padding) */}
            <div className="flex items-center justify-between border-b border-[#F4F4F5] px-7 py-6 shrink-0 bg-white">
              <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                {existingTasksForModal.length > 0
                  ? `${modalDayNumber} ${modalMonthName} ${modalYear}`
                  : `Add Task — ${modalWeekday}, ${modalDayNumber} ${modalMonthName}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F4F5] text-[#71717A] transition-colors hover:bg-[#E4E4E7] hover:text-[#18181B] active:scale-95"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body (Sleek minimalist internal scrollbar) */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-modal-scrollbar">

            {/* If Already Has Tasks Scheduled (IMAGE 2 DESIGN) */}
            {existingTasksForModal.length > 0 && (
              <div className="mb-5 border-b border-[#F0ECE6] pb-4">
                <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A09588] pb-3">
                  {existingTasksForModal.length} ITEMS SCHEDULED
                </span>

                <div className="space-y-3">
                  {existingTasksForModal.map((task) => {
                    let typeBadgeClass = 'bg-[#EDE9FE] text-[#7C3AED]'
                    if (task.type === 'Deadline') {
                      typeBadgeClass = 'bg-[#FEE2E2] text-[#EF4444]'
                    } else if (task.type === 'Meeting') {
                      typeBadgeClass = 'bg-[#E0F2FE] text-[#0284C7]'
                    } else if (task.type === 'Milestone') {
                      typeBadgeClass = 'bg-[#FEF3C7] text-[#D97706]'
                    }

                    return (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskCompleted(task.id)}
                            className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#CBD5E1] transition-colors hover:border-[#C06B3E]"
                          >
                            {task.completed && (
                              <span className="h-2 w-2 rounded-full bg-[#C06B3E]" />
                            )}
                          </button>
                          <div>
                            <h4
                              className={`font-manrope text-[13.5px] font-bold text-[#08182B] ${
                                task.completed ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {task.title}
                            </h4>
                            <p className="font-manrope text-[12px] text-[#8E8376]">
                              {task.project}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-manrope text-[12px] font-medium text-[#8E8376]">
                            {task.time}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${typeBadgeClass}`}
                          >
                            {task.type}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* NEW TASK FORM (MATCHING IMAGES 1 & 2 EXACTLY) */}
            <form onSubmit={handleAddNewTask} className="space-y-4">
              {existingTasksForModal.length > 0 && (
                <span className="block font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A09588]">
                  NEW TASK
                </span>
              )}

              {/* Task Title */}
              <div>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title *"
                  className="w-full rounded-[14px] border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-3 font-manrope text-[13.5px] text-[#08182B] placeholder-[#A1A1AA] outline-none transition-all focus:border-[#C06B3E] focus:bg-white focus:ring-1 focus:ring-[#C06B3E]/30"
                />
              </div>

              {/* Type & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <div>
                  <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                      className="w-full appearance-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 pr-8 font-manrope text-[13px] font-medium text-[#18181B] outline-none focus:border-[#C06B3E]"
                    >
                      <option value="Task">Task</option>
                      <option value="Deadline">Deadline</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Milestone">Milestone</option>
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full appearance-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 pr-8 font-manrope text-[13px] font-medium text-[#18181B] outline-none focus:border-[#C06B3E]"
                    >
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Low">Low</option>
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                    />
                  </div>
                </div>
              </div>

              {/* Time & Project Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Time */}
                <div>
                  <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                    Time
                  </label>
                  <input
                    type="text"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    placeholder="e.g. 11:00"
                    className="w-full rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 font-manrope text-[13px] text-[#18181B] placeholder-[#A1A1AA] outline-none focus:border-[#C06B3E]"
                  />
                </div>

                {/* Project */}
                <div>
                  <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={taskProject}
                      onChange={(e) => setTaskProject(e.target.value)}
                      className="w-full appearance-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 pr-8 font-manrope text-[13px] font-medium text-[#18181B] outline-none focus:border-[#C06B3E]"
                    >
                      <option value="None">None</option>
                      <option value="Personal">Personal</option>
                      <option value="Brand Identity">Brand Identity</option>
                      <option value="Website Redesign">Website Redesign</option>
                      <option value="Orbit App">Orbit App</option>
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full resize-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 font-manrope text-[13px] text-[#18181B] placeholder-[#A1A1AA] outline-none focus:border-[#C06B3E]"
                />
              </div>

              {/* Reminder */}
              <div>
                <label className="mb-1 block font-manrope text-[12px] font-medium text-[#71717A]">
                  Reminder
                </label>
                <div className="relative">
                  <select
                    value={taskReminder}
                    onChange={(e) => setTaskReminder(e.target.value)}
                    className="w-full appearance-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 pr-8 font-manrope text-[13px] font-medium text-[#18181B] outline-none focus:border-[#C06B3E]"
                  >
                    <option value="No reminder">No reminder</option>
                    <option value="15 minutes before">15 minutes before</option>
                    <option value="30 minutes before">30 minutes before</option>
                    <option value="1 hour before">1 hour before</option>
                    <option value="1 day before">1 day before</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                  />
                </div>
              </div>

              {/* Action Buttons: Cancel vs Add Task */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-[12px] border border-[#E4E4E7] bg-white py-3 font-manrope text-[14px] font-semibold text-[#52525B] transition-colors hover:bg-[#F4F4F5] active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className={`flex-1 rounded-[12px] py-3 font-manrope text-[14px] font-bold transition-all shadow-sm active:scale-98 ${
                    taskTitle.trim()
                      ? 'bg-[#C06B3E] text-white hover:bg-[#AA572D]'
                      : 'bg-[#D4D4D8] text-[#71717A] cursor-not-allowed'
                  }`}
                >
                  Add Task
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
