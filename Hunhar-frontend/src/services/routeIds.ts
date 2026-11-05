/**
 * Opaque ids for browser URLs: /freelancer/projects/3f2b8c1e-9a7d-... becomes /freelancer/projects/qT7xK2mPz0vR9aLcW4bN8yE.
 *
 * A keyed 4-round Feistel permutation over the 16 UUID bytes plus a check byte, base64url-encoded.
 * This hides database ids from the address bar, history and screenshots; it is not access control,
 * which the backend enforces on every request.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const UUID_ANYWHERE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

// Round keys (fixed so links stay valid across deploys and devices)
const KEYS = [0x9e3779b9, 0x7f4a7c15, 0xc2b2ae35, 0x27d4eb2f]

const b64url = (bytes: Uint8Array): string => {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromB64url = (s: string): Uint8Array | null => {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

/** Round function: mixes 8 bytes with a round key into 8 pseudo-random bytes. */
const round = (half: Uint8Array, key: number): Uint8Array => {
  let a = key ^ 0x85ebca6b
  let b = Math.imul(key, 0x01000193) >>> 0
  for (let i = 0; i < 8; i++) {
    a = Math.imul(a ^ half[i], 0x01000193) >>> 0
    b = Math.imul(b ^ (half[i] + i * 31), 0x5bd1e995) >>> 0
    a ^= b >>> 13
    b ^= a << 7
  }
  const out = new Uint8Array(8)
  for (let i = 0; i < 4; i++) {
    out[i] = (a >>> (i * 8)) & 0xff
    out[i + 4] = (b >>> (i * 8)) & 0xff
  }
  return out
}

const checkByte = (bytes: Uint8Array): number => {
  let c = 0x5a
  for (let i = 0; i < bytes.length; i++) c = ((c << 1) | (c >>> 7)) & 0xff ^ bytes[i]
  return c
}

/** UUID → opaque token (anything that is not a UUID is returned unchanged). */
export function toRouteId(id: string | null | undefined): string {
  if (!id || !UUID_RE.test(id)) return id || ''
  const hex = id.replace(/-/g, '')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  let left = bytes.slice(0, 8)
  let right = bytes.slice(8)
  for (const k of KEYS) {
    const f = round(right, k)
    const next = new Uint8Array(8)
    for (let i = 0; i < 8; i++) next[i] = left[i] ^ f[i]
    left = right
    right = next
  }
  const out = new Uint8Array(17)
  out.set(left)
  out.set(right, 8)
  out[16] = checkByte(bytes)
  return b64url(out)
}

/** Opaque token → UUID. Raw UUIDs (old links, notification links) are accepted as-is; invalid tokens give ''. */
export function fromRouteId(token: string | null | undefined): string {
  if (!token) return ''
  if (UUID_RE.test(token)) return token.toLowerCase()
  const raw = fromB64url(token)
  if (!raw || raw.length !== 17) return ''
  let left = raw.slice(0, 8)
  let right = raw.slice(8, 16)
  for (let r = KEYS.length - 1; r >= 0; r--) {
    const f = round(left, KEYS[r])
    const prev = new Uint8Array(8)
    for (let i = 0; i < 8; i++) prev[i] = right[i] ^ f[i]
    right = left
    left = prev
  }
  const bytes = new Uint8Array(16)
  bytes.set(left)
  bytes.set(right, 8)
  if (checkByte(bytes) !== raw[16]) return ''
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Replaces every UUID inside an app path (e.g. a notification link from the server) with its token. */
export const hideIdsInPath = (path: string): string => path.replace(UUID_ANYWHERE, (m) => toRouteId(m))
