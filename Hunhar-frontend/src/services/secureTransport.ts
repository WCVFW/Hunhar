/**
 * End-to-end API payload encryption (on top of HTTPS), matching the gateway's PayloadEncryptionFilter.
 *
 * Per browser tab: fetch the gateway's P-256 public key, create an ephemeral ECDH key pair (the private
 * key is non-extractable), derive AES-256 key = SHA-256(shared secret). Every request then:
 *   goes to /api/x with the real "path?query" encrypted in X-Enc-Target (DevTools shows no endpoint or ids),
 *   carries X-Enc-Key / X-Enc-Kid / X-Enc-Ts / X-Enc-Nonce and X-Enc-Auth (GCM tag over method, path, time, nonce),
 *   and sends its JSON body as {"data": <encrypted>}.
 * JSON responses come back as {"data": <encrypted>} and are decrypted here.
 */

interface Session {
  kid: string
  clientPublicKey: string
  key: CryptoKey
}

const enc = new TextEncoder()
const dec = new TextDecoder()

const b64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromB64url = (s: string): Uint8Array => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

let sessionPromise: Promise<Session> | null = null

async function createSession(baseUrl: string): Promise<Session> {
  if (!window.crypto?.subtle) {
    throw new Error('A secure (HTTPS) connection is required to use Hunhar.')
  }
  const res = await fetch(`${baseUrl}/api/v1/crypto/public-key`)
  if (!res.ok) throw new Error('Cannot reach the server. Please check your internet connection and try again.')
  const { data } = (await res.json()) as { data: { keyId: string; publicKey: string } }

  const serverKey = await crypto.subtle.importKey('raw', fromB64url(data.publicKey) as BufferSource, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const pair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])) as CryptoKeyPair
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: serverKey }, pair.privateKey, 256)
  const aesRaw = await crypto.subtle.digest('SHA-256', shared)
  const key = await crypto.subtle.importKey('raw', aesRaw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  return { kid: data.keyId, clientPublicKey: b64url(await crypto.subtle.exportKey('raw', pair.publicKey)), key }
}

const getSession = (baseUrl: string, fresh = false): Promise<Session> => {
  if (!sessionPromise || fresh) {
    sessionPromise = createSession(baseUrl)
    sessionPromise.catch(() => (sessionPromise = null))
  }
  return sessionPromise
}

async function seal(key: CryptoKey, plain: Uint8Array, aad: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, plain as BufferSource))
  const out = new Uint8Array(12 + ct.length)
  out.set(iv)
  out.set(ct, 12)
  return b64url(out)
}

async function open(key: CryptoKey, payload: string, aad: string): Promise<Uint8Array> {
  const bytes = fromB64url(payload)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: enc.encode(aad) },
    key,
    bytes.slice(12) as BufferSource
  )
  return new Uint8Array(plain)
}

/**
 * fetch() replacement for JSON API calls. Returns a normal Response whose body is already decrypted,
 * so callers keep using res.json(). Retries once with a fresh key if the gateway key changed.
 */
export async function secureFetch(baseUrl: string, url: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const session = await getSession(baseUrl, retried)
  const method = (init.method || 'GET').toUpperCase()
  const target = new URL(url)
  const path = target.pathname
  const ts = String(Date.now())
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(18)))
  const aad = `${method} ${path} ${ts} ${nonce}`

  const headers = new Headers(init.headers || {})
  headers.set('X-Enc-Key', session.clientPublicKey)
  headers.set('X-Enc-Kid', session.kid)
  headers.set('X-Enc-Ts', ts)
  headers.set('X-Enc-Nonce', nonce)
  headers.set('X-Enc-Auth', await seal(session.key, new Uint8Array(0), `A ${aad}`))

  headers.set('X-Enc-Target', await seal(session.key, enc.encode(path + target.search), `T ${ts} ${nonce}`))

  let body = init.body
  if (typeof body === 'string') {
    body = JSON.stringify({ data: await seal(session.key, enc.encode(body), `B ${aad}`) })
    headers.set('Content-Type', 'application/json')
    headers.set('X-Encrypted', '1')
  }

  const res = await fetch(`${target.origin}/api/x`, { ...init, headers, body })

  const encError = res.headers.get('X-Enc-Error')
  if (encError === 'key' && !retried) {
    return secureFetch(baseUrl, url, init, true)
  }
  if (res.headers.get('X-Encrypted') !== '1') return res

  const wrapped = (await res.json()) as { data: string }
  const plain = dec.decode(await open(session.key, wrapped.data, `R ${aad}`))
  return new Response(plain, { status: res.status, statusText: res.statusText, headers: res.headers })
}
