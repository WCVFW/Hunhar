import { useEffect, useState } from 'react'
import { settingsApi } from './api'

/** Admin-controlled platform rules, as numbers. Defaults are used until the server answers. */
export interface PlatformRules {
  commissionRate: number // 0.10 = 10%
  commissionPercent: number
  creditsPerBid: number
  starterCredits: number
  minPayout: number
  kycRequiredForPayout: boolean
  autoApproveDays: number
}

const DEFAULTS: PlatformRules = {
  commissionRate: 0.1,
  commissionPercent: 10,
  creditsPerBid: 2,
  starterCredits: 10,
  minPayout: 100,
  kycRequiredForPayout: true,
  autoApproveDays: 7,
}

let cache: PlatformRules | null = null
let inflight: Promise<PlatformRules> | null = null

export function loadPlatformRules(force = false): Promise<PlatformRules> {
  if (cache && !force) return Promise.resolve(cache)
  if (inflight && !force) return inflight
  inflight = settingsApi
    .get()
    .then((s) => {
      const commissionPercent = Number(s.commissionPercent)
      cache = {
        commissionPercent,
        commissionRate: commissionPercent / 100,
        creditsPerBid: Number(s.creditsPerBid),
        starterCredits: Number(s.starterCredits),
        minPayout: Number(s.minPayout),
        kycRequiredForPayout: s.kycRequiredForPayout === 'true',
        autoApproveDays: Number(s.autoApproveDays),
      }
      return cache
    })
    .catch(() => DEFAULTS)
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function usePlatformSettings(): PlatformRules {
  const [rules, setRules] = useState<PlatformRules>(cache || DEFAULTS)
  useEffect(() => {
    let alive = true
    loadPlatformRules().then((r) => alive && setRules(r))
    return () => {
      alive = false
    }
  }, [])
  return rules
}
