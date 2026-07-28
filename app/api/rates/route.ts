import { NextResponse } from 'next/server'
import { captureError } from '@/lib/observability'

const COINGECKO_ETH_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

const CACHE_TTL_MS = 60_000 // 1 minute

let cache: { data: { ethereum: { usd: number } }; cachedAt: number } | null = null

export async function GET() {
  // Return cached data if still fresh
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT' },
    })
  }

  try {
    const res = await fetch(COINGECKO_ETH_URL, {
      headers: { 'User-Agent': 'Aframp/1.0', Accept: 'application/json' },
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)

    const data = (await res.json()) as { ethereum: { usd: number } }

    if (!data?.ethereum?.usd) throw new Error('Unexpected CoinGecko response shape')

    cache = { data, cachedAt: Date.now() }

    return NextResponse.json(data, { headers: { 'X-Cache': 'MISS' } })
  } catch (err) {
    // Serve stale cache as fallback rather than failing
    if (cache) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'STALE' },
        status: 200,
      })
    }

    captureError(err, { tags: { domain: 'rates', operation: 'eth-price-fetch' } })
    const message = err instanceof Error ? err.message : 'Failed to fetch rates'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
