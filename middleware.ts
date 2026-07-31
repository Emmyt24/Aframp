import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: false,
})

// Routes that don't require an authenticated session — public data reads and
// the login endpoint itself. Everything else under /api is protected.
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/exchange-rate', '/api/rates']

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const role = request.cookies.get('aframp_role')?.value
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  let requestHeaders = request.headers

  if (pathname.startsWith('/api') && !isPublicApiRoute(pathname)) {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.sub)
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(reset))
  return response
}

export const config = {
  // Webhook endpoints (Paystack/Flutterwave callbacks) are excluded — bursts
  // during batch settlement must not be rate-limited or blocked pending a
  // session cookie the payment provider will never send. Those endpoints
  // must independently verify the provider's HMAC signature instead.
  matcher: ['/api/((?!bills/verify|payments/webhook).*)', '/admin/:path*'],
}
