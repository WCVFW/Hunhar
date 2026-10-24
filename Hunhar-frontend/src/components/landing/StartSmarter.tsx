import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X } from 'lucide-react'

import earnImg from '../../assets/guide_earn_student.jpg'
import hireImg from '../../assets/guide_hire_affordably.jpg'
import skillsImg from '../../assets/guide_freelance_skills.jpg'

interface GuideItem {
  id: number
  title: string
  subtitle: string
  readTime: string
  image: string
  alt: string
  videoUrl: string
  tag: string
}

const guides: GuideItem[] = [
  {
    id: 1,
    title: 'How to earn as a student?',
    subtitle: "A beginner's guide to start earning online.",
    readTime: '5 min read',
    image: earnImg,
    alt: 'How to earn as a student - Guide for freelancers',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tag: 'Student Guide',
  },
  {
    id: 2,
    title: 'How to hire affordably?',
    subtitle: 'Smart ways to get quality work done on a budget.',
    readTime: '5 min read',
    image: hireImg,
    alt: 'How to hire affordably - Client business guide',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tag: 'Client Guide',
  },
  {
    id: 3,
    title: 'Best freelance skills in 2026',
    subtitle: 'Top skills in demand and how to learn them.',
    readTime: '6 min read',
    image: skillsImg,
    alt: 'Best freelance skills in 2026 - Market trends',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    tag: 'Trends 2026',
  },
]

export default function StartSmarter() {
  const [activeVideo, setActiveVideo] = useState<GuideItem | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideo(null)
      }
    }
    if (activeVideo) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [activeVideo])

  return (
    <section className="relative w-full py-16 sm:py-24 px-6 overflow-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px]" id="start-smarter">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-xl mx-auto mb-14"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="font-display text-3xl sm:text-5xl font-medium text-terracotta leading-tight tracking-tight mb-3">
            Start smarter
          </h2>
          <p className="font-sans text-base sm:text-lg font-medium text-navy leading-relaxed m-0">
            Tips, guides and resources to
            <br />
            help you grow.
          </p>
        </motion.div>

        {/* 3 Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 w-full">
          {guides.map((guide, idx) => (
            <motion.div
              key={guide.id}
              className="group relative h-[360px] sm:h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-horizon transition-all duration-300"
              role="button"
              tabIndex={0}
              onClick={() => setActiveVideo(guide)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveVideo(guide)
                }
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: 'easeOut' }}
              aria-label={`Watch guide: ${guide.title}`}
            >
              {/* Background Thumbnail Image */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={guide.image}
                  alt={guide.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Dark Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              {/* Centered Glassmorphic Play Button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-terracotta">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
              </div>

              {/* Bottom Card Content */}
              <div className="absolute bottom-0 inset-x-0 p-6 text-white z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-terracotta/90 text-white font-sans text-xs font-semibold uppercase tracking-wider mb-2">
                  {guide.tag}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug mb-1 text-white">
                  {guide.title}
                </h3>
                <p className="font-sans text-sm text-white/80 line-clamp-2 mb-3">
                  {guide.subtitle}
                </p>
                <div className="text-xs text-white/60 font-sans">
                  <span>{guide.readTime}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video Lightbox Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              className="relative w-full max-w-3xl bg-navy rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h4 className="flex items-center gap-3 text-white font-display text-lg m-0">
                  <span>{activeVideo.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-terracotta text-white text-xs font-sans">
                    {activeVideo.tag}
                  </span>
                </h4>
                <button
                  type="button"
                  className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => setActiveVideo(null)}
                  aria-label="Close video"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full bg-black">
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              </div>

              {/* Modal Footer Description */}
              <div className="flex items-center justify-between px-6 py-4 bg-navy/90 border-t border-white/10">
                <p className="text-sm text-white/80 m-0 font-sans">{activeVideo.subtitle}</p>
                <span className="text-xs text-white/50 font-sans">{activeVideo.readTime}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
