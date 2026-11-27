import type { Deliverable, MilestoneStatus, MilestoneTask } from './api'

export interface ProjectPhaseSync {
  tasks: Record<string, MilestoneTask[]>
  deliverables: Record<string, Deliverable[]>
  status: Record<string, MilestoneStatus>
  funded: Record<string, boolean>
  lastUpdated: number
}

const memoryCache: Record<string, ProjectPhaseSync> = {}

export const phaseSync = {
  get: async (projectId: string, altProjectId?: string): Promise<ProjectPhaseSync | null> => {
    if (!projectId && !altProjectId) return null
    const keys = Array.from(new Set([projectId, altProjectId].filter(Boolean))) as string[]

    // 1. Check memory cache
    for (const key of keys) {
      if (memoryCache[key]) {
        for (const k of keys) memoryCache[k] = memoryCache[key]
        return memoryCache[key]
      }
    }

    // 2. Try local dev server endpoint
    for (const key of keys) {
      try {
        const res = await fetch(`/_phase_sync/${encodeURIComponent(key)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data === 'object') {
            for (const k of keys) {
              memoryCache[k] = data
              try {
                localStorage.setItem(`hunhar_phase_sync_${k}`, JSON.stringify(data))
              } catch {}
            }
            return data
          }
        }
      } catch {}
    }

    // 3. Fallback to localStorage
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(`hunhar_phase_sync_${key}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object') {
            for (const k of keys) {
              memoryCache[k] = parsed
            }
            return parsed
          }
        }
      } catch {}
    }

    return null
  },

  update: async (
    projectId: string,
    updater: (prev: ProjectPhaseSync) => ProjectPhaseSync,
    altProjectId?: string
  ): Promise<ProjectPhaseSync> => {
    const keys = Array.from(new Set([projectId, altProjectId].filter(Boolean))) as string[]
    const primaryKey = keys[0] || 'default'

    const existing =
      (await phaseSync.get(primaryKey, keys[1])) || {
        tasks: {},
        deliverables: {},
        status: {},
        funded: {},
        lastUpdated: Date.now(),
      }
    const next = { ...updater(existing), lastUpdated: Date.now() }

    for (const k of keys) {
      memoryCache[k] = next
      try {
        localStorage.setItem(`hunhar_phase_sync_${k}`, JSON.stringify(next))
      } catch {}
    }

    // Send to local dev server endpoint for all keys
    for (const k of keys) {
      try {
        await fetch(`/_phase_sync/${encodeURIComponent(k)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        })
      } catch {}
    }

    window.dispatchEvent(new Event('storage'))
    return next
  },

  getAll: async (): Promise<Record<string, ProjectPhaseSync>> => {
    try {
      const res = await fetch('/_phase_sync_all', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === 'object') {
          Object.assign(memoryCache, data)
          return data
        }
      }
    } catch {}

    // Fallback: collect from localStorage
    const result: Record<string, ProjectPhaseSync> = { ...memoryCache }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('hunhar_phase_sync_')) {
          const syncKey = key.replace('hunhar_phase_sync_', '')
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '')
            if (parsed && typeof parsed === 'object') result[syncKey] = parsed
          } catch {}
        }
      }
    } catch {}
    return result
  },
}
