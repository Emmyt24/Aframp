/**
 * Stateless, edge-compatible session tokens signed with HMAC-SHA256 via
 * Web Crypto (works in both the Next.js middleware/edge runtime and Node).
 * Avoids pulling in a JWT library that doesn't run on the edge runtime.
 */

const encoder = new TextEncoder()

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET environment variable is not set')
  }
  return secret
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return toBase64Url(signature)
}

export interface SessionPayload {
  sub: string // userId — wallet public key
  exp: number // unix epoch seconds
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 // 24h

export async function createSessionToken(userId: string): Promise<string> {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const payloadEncoded = toBase64Url(encoder.encode(JSON.stringify(payload)).buffer)
  const signature = await hmacSign(payloadEncoded, getSecret())
  return `${payloadEncoded}.${signature}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null

  const [payloadEncoded, signature] = token.split('.')
  if (!payloadEncoded || !signature) return null

  const expectedSignature = await hmacSign(payloadEncoded, getSecret())
  if (!timingSafeEqual(expectedSignature, signature)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadEncoded)))
  } catch {
    return null
  }

  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
}

export const SESSION_COOKIE_NAME = 'aframp_session'
