'use client'

import { useState, useEffect, useCallback } from 'react'
import { TokenBalance } from '@/types/balance'
import { fetchStellarBalances } from '@/lib/wallet/freighter'
import { useWalletStore } from '@/lib/wallet/walletStore'

const REFRESH_INTERVAL_MS = 30_000 // 30 seconds

/**
 * Map a Stellar asset code to a USD price approximation.
 * Prices are loaded from the ETH-price proxy for ETH or CoinGecko for XLM;
 * other tokens default to null until a price feed is wired up.
 *
 * Keeping price fetching separate from balance fetching makes the hook
 * easier to extend without breaking the critical balance path.
 */
async function fetchXlmPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd',
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data?.stellar?.usd as number) ?? null
  } catch {
    return null
  }
}

export function useBalances(walletAddress?: string) {
  const { publicKey: storePublicKey, network } = useWalletStore()

  // Prefer the explicitly provided walletAddress; fall back to the store key
  const effectiveAddress = walletAddress ?? storePublicKey ?? undefined

  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchBalances = useCallback(async () => {
    if (!effectiveAddress) {
      setBalances([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch real Stellar balances from Horizon
      const stellarBalances = await fetchStellarBalances(
        effectiveAddress,
        network ?? 'PUBLIC'
      )

      // Fetch XLM price in parallel (best-effort — failures are non-fatal)
      const xlmPrice = await fetchXlmPrice()

      const mapped: TokenBalance[] = stellarBalances.map((bal) => {
        const symbol = bal.asset === 'XLM' ? 'XLM' : bal.asset
        const amount = parseFloat(bal.balance)

        if (symbol === 'XLM') {
          return {
            symbol,
            amount,
            price: xlmPrice,
            priceLoading: false,
          }
        }

        // Non-XLM Stellar assets (cNGN, USDC, cKES, etc.)
        return {
          symbol,
          amount,
          price: null,
          priceLoading: false,
        }
      })

      setBalances(mapped)
      setLastUpdated(new Date())
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch wallet balances'
      setError(message)
      console.error('[useBalances] Error fetching Stellar balances:', err)
    } finally {
      setLoading(false)
    }
  }, [effectiveAddress, network])

  // Fetch on mount and whenever the address/network changes
  useEffect(() => {
    void fetchBalances()

    // Poll for fresh balances every 30 seconds while the address is available
    if (!effectiveAddress) return

    const interval = setInterval(() => {
      void fetchBalances()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [fetchBalances, effectiveAddress])

  // Calculate total USD value from balances that have a known price
  const totalUsdValue = balances.reduce((total, balance) => {
    if (balance.price != null && balance.amount) {
      return total + balance.amount * balance.price
    }
    return total
  }, 0)

  return {
    balances,
    totalUsdValue,
    loading,
    error,
    lastUpdated,
    refetch: fetchBalances,
  }
}
