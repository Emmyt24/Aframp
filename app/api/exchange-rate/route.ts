import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,stellar&vs_currencies=ngn,kes,ghs,zar,ugx'

const CACHE_KEY = 'exchange-rates'
const CACHE_TTL_SECONDS = 60

type ExchangeRates = Record<string, Record<string, number>>

export async function GET() {
  try {
    const cached = await redis.get<ExchangeRates>(CACHE_KEY)

    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      })
    }
  } catch {
    // Continue to CoinGecko when the cache is unavailable.
  }

  try {
    const response = await fetch(COINGECKO_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Aframp/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch rates' }, { status: response.status })
    }

    const data = (await response.json()) as ExchangeRates

    try {
      await redis.set(CACHE_KEY, data, { ex: CACHE_TTL_SECONDS })
    } catch {
      // Return fresh rates even when the cache write fails.
    }

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch {
    return NextResponse.json({ error: 'Unable to fetch exchange rates' }, { status: 500 })
  }
}
