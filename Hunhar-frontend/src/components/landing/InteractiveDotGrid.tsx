import React, { useEffect, useRef } from 'react'

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  speed: number
  width: number
  strength: number
}

interface Dot {
  ox: number
  oy: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

export default function InteractiveDotGrid(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return

    let animationFrameId: number
    let width = 0
    let height = 0

    const SPACING = 30
    const MOUSE_RADIUS = 130
    const REPEL_FORCE = 3.2
    const SPRING_K = 0.08
    const DAMPING = 0.82

    let dots: Dot[][] = []
    let ripples: Ripple[] = []

    const mouse = {
      x: -1000,
      y: -1000,
      isActive: false,
    }

    const initGrid = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      width = rect.width
      height = rect.height

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const cols = Math.ceil(width / SPACING) + 2
      const rows = Math.ceil(height / SPACING) + 2

      dots = []
      for (let r = 0; r < rows; r++) {
        const rowDots: Dot[] = []
        for (let c = 0; c < cols; c++) {
          const ox = c * SPACING
          const oy = r * SPACING
          rowDots.push({
            ox,
            oy,
            x: ox,
            y: oy,
            vx: 0,
            vy: 0,
            r: 1.4,
          })
        }
        dots.push(rowDots)
      }
    }

    const addRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.7,
        speed: 7,
        width: 48,
        strength: 3.5,
      })
    }

    // Spawn an initial subtle center ripple on load
    const initialTimer = setTimeout(() => {
      addRipple(width / 2, height / 2)
    }, 400)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.isActive = true
    }

    const handleMouseLeave = () => {
      mouse.isActive = false
      mouse.x = -1000
      mouse.y = -1000
    }

    const handleClick = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      addRipple(clickX, clickY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = parent.getBoundingClientRect()
        mouse.x = e.touches[0].clientX - rect.left
        mouse.y = e.touches[0].clientY - rect.top
        mouse.isActive = true
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = parent.getBoundingClientRect()
        const clickX = e.touches[0].clientX - rect.left
        const clickY = e.touches[0].clientY - rect.top
        mouse.x = clickX
        mouse.y = clickY
        mouse.isActive = true
        addRipple(clickX, clickY)
      }
    }

    parent.addEventListener('mousemove', handleMouseMove)
    parent.addEventListener('mouseleave', handleMouseLeave)
    parent.addEventListener('click', handleClick)
    parent.addEventListener('touchmove', handleTouchMove, { passive: true })
    parent.addEventListener('touchstart', handleTouchStart, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      initGrid()
    })
    resizeObserver.observe(parent)

    initGrid()

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i]
        rip.radius += rip.speed
        if (rip.radius > rip.maxRadius) {
          ripples.splice(i, 1)
        }
      }

      const rows = dots.length
      const cols = rows > 0 ? dots[0].length : 0

      // Physics update
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dot = dots[r][c]

          // Mouse repulsion
          if (mouse.isActive) {
            const dx = dot.x - mouse.x
            const dy = dot.y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < MOUSE_RADIUS && dist > 0) {
              const force = (1 - dist / MOUSE_RADIUS) * REPEL_FORCE
              const angle = Math.atan2(dy, dx)
              dot.vx += Math.cos(angle) * force
              dot.vy += Math.sin(angle) * force
            }
          }

          // Ripples interaction
          for (let i = 0; i < ripples.length; i++) {
            const rip = ripples[i]
            const rdx = dot.ox - rip.x
            const rdy = dot.oy - rip.y
            const rDist = Math.sqrt(rdx * rdx + rdy * rdy)
            const diff = Math.abs(rDist - rip.radius)
            if (diff < rip.width) {
              const life = 1 - rip.radius / rip.maxRadius
              const factor = Math.sin((1 - diff / rip.width) * Math.PI) * rip.strength * life
              const angle = Math.atan2(rdy, rdx)
              dot.vx += Math.cos(angle) * factor
              dot.vy += Math.sin(angle) * factor
            }
          }

          // Spring recovery to original position
          const oxDiff = dot.ox - dot.x
          const oyDiff = dot.oy - dot.y
          dot.vx += oxDiff * SPRING_K
          dot.vy += oyDiff * SPRING_K

          // Damping
          dot.vx *= DAMPING
          dot.vy *= DAMPING

          dot.x += dot.vx
          dot.y += dot.vy
        }
      }

      // Draw faint mesh grid connecting lines
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(232, 223, 201, 0.55)'
      ctx.lineWidth = 0.75

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dot = dots[r][c]
          // Horizontal line
          if (c < cols - 1) {
            const rightDot = dots[r][c + 1]
            ctx.moveTo(dot.x, dot.y)
            ctx.lineTo(rightDot.x, rightDot.y)
          }
          // Vertical line
          if (r < rows - 1) {
            const bottomDot = dots[r + 1][c]
            ctx.moveTo(dot.x, dot.y)
            ctx.lineTo(bottomDot.x, bottomDot.y)
          }
        }
      }
      ctx.stroke()

      // Draw dots at vertices with displacement glow
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dot = dots[r][c]
          const disp = Math.sqrt((dot.x - dot.ox) ** 2 + (dot.y - dot.oy) ** 2)

          ctx.beginPath()
          const radius = dot.r + Math.min(disp * 0.15, 2)
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)

          if (disp > 1.2) {
            // Interactive glow when pushed / rippling
            ctx.fillStyle = `rgba(192, 107, 62, ${Math.min(0.35 + disp * 0.05, 0.85)})`
          } else {
            // Idle dot color
            ctx.fillStyle = 'rgba(190, 175, 155, 0.75)'
          }
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      clearTimeout(initialTimer)
      resizeObserver.disconnect()
      parent.removeEventListener('mousemove', handleMouseMove)
      parent.removeEventListener('mouseleave', handleMouseLeave)
      parent.removeEventListener('click', handleClick)
      parent.removeEventListener('touchmove', handleTouchMove)
      parent.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}

