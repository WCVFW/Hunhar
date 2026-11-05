import React, { createContext, useContext, useState, useEffect } from 'react'
import hunharLogo from '../../assets/hunha Logo.png'
import sidebarCollapseLogo from '../../assets/Sidebar_collaps.png'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

/**
 * Standard inline circular spinner for buttons, cards, and data-fetching slots
 */
export function LoadingSpinner({
  size = 'md',
  color = '#C06B3E',
  className = '',
}: LoadingSpinnerProps): React.JSX.Element {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent ${sizeMap[size]} ${className}`}
      style={{ color }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface PageLoaderProps {
  text?: string
  subtext?: string
  fullscreen?: boolean
  showLogo?: boolean
}

/**
 * Fullscreen or Page-level sleek animated loader matching Hunhar brand aesthetics
 */
export function PageLoader({
  text = 'Loading Hunhar...',
  subtext = 'Preparing your experience, please wait...',
  fullscreen = true,
  showLogo = true,
}: PageLoaderProps): React.JSX.Element {
  return (
    <div
      className={`flex flex-col items-center justify-center font-manrope ${
        fullscreen
          ? 'fixed inset-0 z-[9999] bg-[#FBF8F3]/95 backdrop-blur-md'
          : 'w-full py-16'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated outer glowing pulsing ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-[#C06B3E]/20 animate-ping opacity-75" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#08182B] shadow-2xl border border-white/10">
            {showLogo ? (
              <img
                src={sidebarCollapseLogo}
                alt="Hunhar"
                className="h-10 w-10 object-contain animate-pulse"
              />
            ) : (
              <img
                src={hunharLogo}
                alt="Hunhar"
                className="h-8 w-auto object-contain"
              />
            )}
          </div>
        </div>

        {/* Orbit dots spinner */}
        <div className="mt-5 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#C06B3E] animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#D98F62] animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#08182B] animate-bounce" />
        </div>

        {/* Informative text */}
        {text && (
          <h3 className="mt-4 text-[16px] font-extrabold tracking-tight text-[#08182B]">
            {text}
          </h3>
        )}
        {subtext && (
          <p className="mt-1 max-w-[320px] text-center text-[12.5px] font-medium text-[#7D7365]">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Top thin loading progress bar when background API calls or transitions take place
 */
export function TopProgressBar({ active }: { active: boolean }): React.JSX.Element | null {
  if (!active) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-1 w-full overflow-hidden bg-[#C06B3E]/20">
      <div className="h-full w-full bg-gradient-to-r from-[#C06B3E] via-[#D98F62] to-[#08182B] animate-[progress_1.5s_ease-in-out_infinite]" />
    </div>
  )
}

/**
 * Skeleton Loader helper for loading cards, tables, and lists
 */
export function CardSkeleton({ count = 3 }: { count?: number }): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[18px] border border-[#E5DACD] bg-white p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-full bg-gray-200" />
            <div className="h-4 w-12 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 h-6 w-3/4 rounded-md bg-gray-200" />
          <div className="mt-2 h-4 w-full rounded-md bg-gray-100" />
          <div className="mt-1 h-4 w-2/3 rounded-md bg-gray-100" />
          <div className="mt-6 flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="h-6 w-20 rounded-md bg-gray-200" />
            <div className="h-8 w-24 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Global Loader Context & Hook to trigger page loader or top progress anywhere
interface LoaderContextType {
  showLoader: (text?: string, subtext?: string) => void
  hideLoader: () => void
  isLoading: boolean
  isApiLoading: boolean
  setApiLoading: (loading: boolean) => void
}

const LoaderContext = createContext<LoaderContextType>({
  showLoader: () => {},
  hideLoader: () => {},
  isLoading: false,
  isApiLoading: false,
  setApiLoading: () => {},
})

export function LoaderProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [loadingState, setLoadingState] = useState<{
    show: boolean
    text: string
    subtext: string
  }>({
    show: false,
    text: 'Loading Hunhar...',
    subtext: 'Preparing your experience, please wait...',
  })

  const [isApiLoading, setApiLoading] = useState<boolean>(false)

  const showLoader = (text = 'Loading Hunhar...', subtext = 'Preparing your experience, please wait...') => {
    setLoadingState({ show: true, text, subtext })
  }

  const hideLoader = () => {
    setLoadingState((prev) => ({ ...prev, show: false }))
  }

  // Listen to global custom events dispatched from api.ts or routes
  useEffect(() => {
    const handleStart = (e: any) => {
      setApiLoading(true)
      if (e.detail?.full) {
        showLoader(e.detail?.text, e.detail?.subtext)
      }
    }
    const handleEnd = () => {
      setApiLoading(false)
      hideLoader()
    }

    window.addEventListener('hunhar:loading-start', handleStart)
    window.addEventListener('hunhar:loading-end', handleEnd)

    return () => {
      window.removeEventListener('hunhar:loading-start', handleStart)
      window.removeEventListener('hunhar:loading-end', handleEnd)
    }
  }, [])

  return (
    <LoaderContext.Provider
      value={{
        showLoader,
        hideLoader,
        isLoading: loadingState.show,
        isApiLoading,
        setApiLoading,
      }}
    >
      <TopProgressBar active={isApiLoading} />
      {loadingState.show && (
        <PageLoader text={loadingState.text} subtext={loadingState.subtext} fullscreen />
      )}
      {children}
    </LoaderContext.Provider>
  )
}

export const useLoader = () => useContext(LoaderContext)

export default PageLoader
