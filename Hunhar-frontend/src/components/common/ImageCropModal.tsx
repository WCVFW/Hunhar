import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Move,
  Crop as CropIcon,
} from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  imageSrc: string
  title?: string
  aspectRatio?: 'circle' | 'square'
  onClose: () => void
  onSave: (croppedDataUrl: string) => void
}

const CROP_BOX_SIZE = 260 // Viewport crop box width & height in modal

export default function ImageCropModal({
  isOpen,
  imageSrc,
  title = 'Adjust Profile Picture',
  aspectRatio = 'circle',
  onClose,
  onSave,
}: ImageCropModalProps): React.JSX.Element | null {
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)

  // Measure rendered image natural dimensions to calculate correct base display size
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth || 400
    const nh = img.naturalHeight || 400

    // Scale so the smaller dimension fills the crop box completely with 0 gaps
    const minScale = CROP_BOX_SIZE / Math.min(nw, nh)
    const baseW = nw * minScale
    const baseH = nh * minScale

    setImageSize({ width: baseW, height: baseH })
    setZoom(1.05) // Slight 5% initial bleed so edges never leak
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen, imageSrc])

  // Mouse / Touch Drag handlers for positioning
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Handle Zoom In / Out
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.min(3, Math.max(0.8, Number(newZoom.toFixed(2)))))
  }

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  // Perform HTML Canvas crop that EXACTLY captures what's inside the circle with NO gaps/borders
  const handleApplyCrop = () => {
    const img = imageRef.current
    if (!img || imageSize.width === 0 || imageSize.height === 0) return

    const canvas = document.createElement('canvas')
    const size = 500 // High-definition export
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Circular clipping path so output is perfectly rounded without corner artifacts
    if (aspectRatio === 'circle') {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    // Canvas center transforms
    ctx.translate(size / 2, size / 2)
    ctx.rotate((rotation * Math.PI) / 180)

    // Calculate exact ratio between exported canvas size and modal crop box
    const scaleRatio = size / CROP_BOX_SIZE

    // The displayed image width & height with zoom applied
    const displayedW = imageSize.width * zoom * scaleRatio
    const displayedH = imageSize.height * zoom * scaleRatio

    ctx.drawImage(
      img,
      -displayedW / 2 + position.x * scaleRatio,
      -displayedH / 2 + position.y * scaleRatio,
      displayedW,
      displayedH
    )

    // Export as transparent PNG for clean circles with no black edges
    const croppedResult = canvas.toDataURL('image/png')
    onSave(croppedResult)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-manrope">
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-[26px] bg-white shadow-2xl border border-[#EBE6DF]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0ECE6] px-6 py-4.5">
          <div className="flex items-center gap-2 text-[#08182B]">
            <CropIcon size={18} className="text-[#C06B3E]" />
            <h3 className="text-[16px] font-bold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#7A7065] hover:bg-[#F3EFE6] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Canvas Area (LinkedIn style circular / square mask) */}
        <div className="relative h-[340px] w-full bg-[#18181B] overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing">
          {/* Draggable & Scalable Image */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="will-change-transform flex items-center justify-center"
          >
            <img
              ref={imageRef}
              src={imageSrc}
              onLoad={handleImageLoad}
              alt="Crop preview"
              style={{
                width: imageSize.width > 0 ? `${imageSize.width}px` : 'auto',
                height: imageSize.height > 0 ? `${imageSize.height}px` : 'auto',
                maxWidth: 'none',
              }}
              className="pointer-events-none select-none object-contain"
              draggable={false}
            />
          </div>

          {/* LinkedIn-style Dark Overlay Mask with Center Circle Cutout */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {aspectRatio === 'circle' ? (
              <div
                style={{ width: `${CROP_BOX_SIZE}px`, height: `${CROP_BOX_SIZE}px` }}
                className="rounded-full ring-[9999px] ring-black/70 border-2 border-white/90 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <div
                style={{ width: `${CROP_BOX_SIZE}px`, height: `${CROP_BOX_SIZE}px` }}
                className="rounded-[24px] ring-[9999px] ring-black/70 border-2 border-white/90 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              />
            )}
          </div>

          {/* Move Hint */}
          <div className="pointer-events-none absolute bottom-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
            <Move size={12} />
            <span>Drag image to reposition</span>
          </div>
        </div>

        {/* Controls: Zoom Slider + Rotate */}
        <div className="p-6 bg-white space-y-5">
          {/* Zoom Slider */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.2)}
              className="text-[#64748B] hover:text-[#08182B] transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min="0.8"
              max="2.8"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#C06B3E] h-1.5 bg-[#E2E8F0] rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.2)}
              className="text-[#64748B] hover:text-[#08182B] transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#08182B] hover:bg-[#FAF8F5] transition-colors ml-1"
              title="Rotate 90 degrees"
            >
              <RotateCw size={15} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#E2E8F0] px-4 py-2 text-[13px] font-bold text-[#08182B] hover:bg-[#FAF8F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white hover:bg-[#AA572D] transition-all shadow-sm active:scale-98"
            >
              <Check size={16} />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
