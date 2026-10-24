import React from 'react'
import {
  Palette,
  Code2,
  Layout,
  Video,
  PenTool,
  Megaphone,
  Bot,
  Smartphone,
  Search,
  Camera,
  Boxes,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

interface SkillItem {
  id: string
  name: string
  icon: LucideIcon
}

const skillsList: SkillItem[] = [
  { id: 's-1', name: 'UI/UX Design', icon: Layout },
  { id: 's-2', name: 'Web Development', icon: Code2 },
  { id: 's-3', name: 'Graphic Design', icon: Palette },
  { id: 's-4', name: 'Mobile App Dev', icon: Smartphone },
  { id: 's-5', name: 'Video Editing', icon: Video },
  { id: 's-6', name: 'Content & Copywriting', icon: PenTool },
  { id: 's-7', name: 'Digital Marketing', icon: Megaphone },
  { id: 's-8', name: 'AI & Automation', icon: Bot },
  { id: 's-9', name: 'SEO & Growth', icon: Search },
  { id: 's-10', name: '3D Animation & Motion', icon: Boxes },
  { id: 's-11', name: 'Data & Analytics', icon: FileSpreadsheet },
  { id: 's-12', name: 'Full Stack Dev', icon: Cpu },
  { id: 's-13', name: 'Photography', icon: Camera },
  { id: 's-14', name: 'Brand Identity', icon: Sparkles },
]

export default function SkillsMarquee(): React.JSX.Element {
  // Repeat array to ensure seamless infinite loop
  const repeatedSkills = [
    ...skillsList,
    ...skillsList,
    ...skillsList,
  ]

  return (
    <section
      className="relative w-full overflow-hidden bg-terracotta py-4 sm:py-5 text-white shadow-md select-none border-y border-[#AA572D]/50"
      aria-label="Skills & Categories Marquee"
    >
      <div className="relative w-full flex items-center">
        {/* Subtle Edge Fade Gradients in Terracotta */}
        <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-terracotta to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-terracotta to-transparent z-10 pointer-events-none" />

        {/* Marquee Infinite Running Track */}
        <div className="flex overflow-hidden w-full">
          <div className="flex items-center gap-10 sm:gap-14 lg:gap-16 animate-marquee whitespace-nowrap will-change-transform py-1">
            {repeatedSkills.map((item, index) => {
              const IconComponent = item.icon
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="inline-flex items-center gap-3 sm:gap-3.5 shrink-0"
                >
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-white/95" />
                  <span className="font-display font-medium text-base sm:text-lg lg:text-xl tracking-tight text-white whitespace-nowrap">
                    {item.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
