'use client'

import { useState, useEffect, useCallback } from 'react'
import { TokenBalance } from '@/types/balance'


export function useBalances(walletAddress?: string) {
  // Initial balances (in a real app, these would come from wallet/API)
  const [balances, setBalances] = useState<TokenBalance[]>([
    {
      symbol: 'cNGN',
      amount: 2450000,
      price: 0.00067, // Approximate USD value per cNGN
      change: 12.5,
      trend: 'up',
    },
    {
      symbol: 'BTC',
      amount: 0.0025,
      price: null, // Will be fetched if needed
      priceLoading: false,
      change: 5.2,
      trend: 'up',
    },
    {
      symbol: 'ETH',
      amount: 0.125,
      price: null, // Will be fetched from API
      priceLoading: true,
      change: undefined,
      trend: undefined,
    },
  ])

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch ETH balance from blockchain
  const fetchWalletEthBalance = useCallback(async (address: string) => {
    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    if (!alchemyApiKey) {
      console.warn(
        '[use-balances] NEXT_PUBLIC_ALCHEMY_API_KEY is not set — skipping on-chain balance fetch. ' +
          'Get a free key at https://www.alchemy.com and add it to your .env.local.'
      )
      return
    }

    try {
      const response = await fetch(
        `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        }
      )

      const data = await response.json()

      if (data.result) {
        // Convert from Wei to ETH (1 ETH = 10^18 Wei)
        const balanceInWei = BigInt(data.result)
        const balanceInEth = Number(balanceInWei) / 1e18

        setBalances((prev) =>
          prev.map((balance) =>
            balance.symbol === 'ETH'
              ? {
                  ...balance,
                  amount: balanceInEth,
                }
              : balance
          )
        )
      }
    } catch (error) {
      console.error('Error fetching wallet ETH balance:', error)
    }
  }, [])

  const fetchEthPrice = useCallback(async () => {
    try {
      // Use the project's own /api/rates route (backed by CoinGecko) instead of
      // a hardcoded personal server. The route returns { ethereum: { usd: number } }.
      const response = await fetch('/api/rates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ETH price: ${response.statusText}`)
      }

      const data = await response.json() as { ethereum?: { usd?: number } }

      const ethPrice: number | null =
        typeof data?.ethereum?.usd === 'number' ? data.ethereum.usd : null

      if (ethPrice !== null && !isNaN(ethPrice)) {
        setBalances((prev) =>
          prev.map((balance) =>
            balance.symbol === 'ETH'
              ? {
                  ...balance,
                  price: ethPrice,
                  priceLoading: false,
                  priceError: null,
                }
              : balance
          )
        )
        setLastUpdated(new Date())
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ETH price'
      setBalances((prev) =>
        prev.map((balance) =>
          balance.symbol === 'ETH'
            ? {
                ...balance,
                priceLoading: false,
                priceError: errorMessage,
              }
            : balance
        )
      )
      console.error('Error fetching ETH price:', err)
    }
  }, [])

  useEffect(() => {
    // Fetch wallet balance if address is provided
    if (walletAddress) {
      fetchWalletEthBalance(walletAddress)
    }

    // Fetch ETH price immediately
    fetchEthPrice()
    setLoading(false)

    // Set up interval to fetch every minute (60000ms)
    const interval = setInterval(() => {
      fetchEthPrice()
      if (walletAddress) {
        fetchWalletEthBalance(walletAddress)
      }
    }, 60000) // 60 seconds = 1 minute

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [fetchEthPrice, fetchWalletEthBalance, walletAddress])

  // Calculate total USD value
  const totalUsdValue = balances.reduce((total, balance) => {
    if (balance.price && balance.amount) {
      return total + balance.amount * balance.price
    }
    return total
  }, 0)

  return {
    balances,
    totalUsdValue,
    loading,
    lastUpdated,
    refetch: fetchEthPrice,
  }
}
