#!/usr/bin/env node
// =============================================================================
// Hunhar production smoke test: talks to the site exactly like a browser does (same end-to-end
// encryption as Hunhar-frontend/src/services/secureTransport.ts) and checks every part answers.
//
//   node smoke-test.mjs                       # http://127.0.0.1 (on the server, after a deploy)
//   node smoke-test.mjs https://www.hunhar.in
//
// Exit 0 = all checks passed, 1 = something failed (Jenkins then rolls the deploy back).
// Needs Node 18+ (fetch + WebCrypto). Uses only public endpoints; writes nothing.
// =============================================================================
const BASE = (process.argv[2] || 'http://127.0.0.1').replace(/\/$/, '')
const subtle = globalThis.crypto.subtle
const enc = new TextEncoder()
const dec = new TextDecoder()
const b64url = (bytes) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = (s) => new Uint8Array(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'))

let session
async function getSession() {
  if (session) return session
  const res = await fetch(`${BASE}/api/v1/crypto/public-key`, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`public key: HTTP ${res.status}`)
  const { data } = await res.json()
  const serverKey = await subtle.importKey('raw', fromB64url(data.publicKey), { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])
  const shared = await subtle.deriveBits({ name: 'ECDH', public: serverKey }, pair.privateKey, 256)
  const aesRaw = await subtle.digest('SHA-256', shared)
  const key = await subtle.importKey('raw', aesRaw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  session = { kid: data.keyId, clientPublicKey: b64url(await subtle.exportKey('raw', pair.publicKey)), key }
  return session
}

async function seal(key, plain, aad) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, plain))
  const out = new Uint8Array(12 + ct.length)
  out.set(iv)
  out.set(ct, 12)
  return b64url(out)
}

async function open(key, payload, aad) {
  const bytes = fromB64url(payload)
  const plain = await subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: enc.encode(aad) }, key, bytes.slice(12))
  return dec.decode(plain)
}

/** Encrypted API call through /api/x; returns { status, json }. */
async function api(method, path, body) {
  const s = await getSession()
  const ts = String(Date.now())
  const nonce = b64url(globalThis.crypto.getRandomValues(new Uint8Array(18)))
  const aad = `${method} ${path} ${ts} ${nonce}`
  const headers = {
    'X-Enc-Key': s.clientPublicKey,
    'X-Enc-Kid': s.kid,
    'X-Enc-Ts': ts,
    'X-Enc-Nonce': nonce,
    'X-Enc-Auth': await seal(s.key, new Uint8Array(0), `A ${aad}`),
    'X-Enc-Target': await seal(s.key, enc.encode(path), `T ${ts} ${nonce}`),
  }
  let payload
  if (body !== undefined) {
    payload = JSON.stringify({ data: await seal(s.key, enc.encode(JSON.stringify(body)), `B ${aad}`) })
    headers['Content-Type'] = 'application/json'
    headers['X-Encrypted'] = '1'
  }
  const res = await fetch(`${BASE}/api/x`, { method, headers, body: payload, signal: AbortSignal.timeout(30000) })
  let text = await res.text()
  if (res.headers.get('X-Encrypted') === '1') text = await open(s.key, JSON.parse(text).data, `R ${aad}`)
  let json = null
  try { json = JSON.parse(text) } catch { /* not JSON */ }
  return { status: res.status, json, text }
}

const checks = [
  ['Website loads', async () => {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(20000) })
    const html = await res.text()
    if (res.status !== 200 || !html.includes('<div id="root">')) throw new Error(`HTTP ${res.status}`)
  }],
  ['Website routes (/login)', async () => {
    const res = await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(20000) })
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
  }],
  ['Encryption handshake (gateway)', async () => { await getSession() }],
  ['Identity service (google config)', async () => {
    const r = await api('GET', '/api/v1/auth/google/config')
    if (r.status !== 200) throw new Error(`HTTP ${r.status} ${r.text.slice(0, 120)}`)
  }],
  ['Login rejects a wrong password (identity + MySQL)', async () => {
    const r = await api('POST', '/api/v1/auth/login', { email: 'smoke-test@hunhar.invalid', password: 'not-a-real-password-1' })
    const msg = r.json?.message || r.text
    if (r.status !== 401 || !/invalid email or password/i.test(msg)) throw new Error(`HTTP ${r.status} ${String(msg).slice(0, 120)}`)
  }],
  ['Engagement service (FAQ content)', async () => {
    const r = await api('GET', '/api/v1/content/faq')
    if (r.status !== 200) throw new Error(`HTTP ${r.status} ${r.text.slice(0, 120)}`)
  }],
  ['Security: wallet needs login', async () => {
    const r = await api('GET', '/api/v1/wallets/my-wallet')
    if (r.status !== 401) throw new Error(`expected 401, got HTTP ${r.status}`)
  }],
]

let failed = 0
console.log(`Smoke test against ${BASE}`)
for (const [name, fn] of checks) {
  const t = Date.now()
  try {
    await fn()
    console.log(`  PASS  ${name} (${Date.now() - t} ms)`)
  } catch (e) {
    failed++
    console.log(`  FAIL  ${name}: ${e.message}`)
  }
}
console.log(failed ? `${failed} check(s) failed` : 'All checks passed')
process.exit(failed ? 1 : 0)
