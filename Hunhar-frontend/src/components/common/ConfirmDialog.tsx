import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, X, Loader2 } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  warning?: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger' | 'warning' | 'success'
  confirmLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  confirmLoading = false,
}: ConfirmDialogProps): React.JSX.Element {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const iconConfig = {
    primary: {
      Icon: HelpCircle,
      bg: 'bg-[#C06B3E]/10',
      text: 'text-[#C06B3E]',
      btn: 'bg-[#C06B3E] hover:bg-[#AA572D] text-white shadow-xs',
    },
    success: {
      Icon: CheckCircle2,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
    },
    warning: {
      Icon: AlertTriangle,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      btn: 'bg-[#C06B3E] hover:bg-[#AA572D] text-white shadow-xs',
    },
    danger: {
      Icon: AlertCircle,
      bg: 'bg-red-50',
      text: 'text-red-600',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
    },
  }[variant]

  const { Icon, bg, text, btn } = iconConfig

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-black/10 font-manrope"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={confirmLoading}
              className="absolute top-5 right-5 w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Icon + Title */}
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className={`w-11 h-11 rounded-2xl ${bg} ${text} flex items-center justify-center shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="pt-0.5 pr-6">
                <h3 className="font-makira text-lg font-bold text-[#08182B] uppercase tracking-wide leading-snug">
                  {title}
                </h3>
              </div>
            </div>

            {/* Message Body */}
            <div className="text-sm text-slate-600 font-manrope leading-relaxed pl-0.5">
              {message}
            </div>

            {/* Optional Warning Banner */}
            {warning && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 p-3.5 text-xs font-semibold text-amber-900 leading-relaxed font-manrope">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-black/5 font-manrope">
              <button
                type="button"
                onClick={onClose}
                disabled={confirmLoading}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirmLoading}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold ${btn} transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50`}
              >
                {confirmLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
