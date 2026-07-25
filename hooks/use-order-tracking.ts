import { useState, useEffect, useCallback, useRef } from 'react'
import { OnrampOrder, OrderStatus } from '@/types/onramp'
import { fetchOrder, patchOrder, persistOrder, readCachedOrder } from '@/lib/orders/order-client'
import { useWalletConnection } from '@/hooks/use-wallet-connection'

/**
 * Loads and tracks a single onramp order.
 *
 * The order is resolved in two passes so a cleared cache or a different device
 * no longer loses the order:
 *   1. the localStorage copy renders immediately (optimistic), then
 *   2. the server copy replaces it once /api/orders responds.
 *
 * Status updates are written to both, and never block on the network.
 */
export function useOrderTracking(orderId: string | null) {
  const { address, loading: walletLoading } = useWalletConnection()
  const [order, setOrder] = useState<OnrampOrder | null>(null)
  const [resolving, setResolving] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Kept in refs so updateOrderStatus stays referentially stable — callers pass
  // it into effects (see useOrderStatusUpdates) that must not re-run on every
  // order change.
  const orderRef = useRef<OnrampOrder | null>(null)
  const addressRef = useRef('')

  useEffect(() => {
    orderRef.current = order
  }, [order])

  useEffect(() => {
    addressRef.current = address
  }, [address])

  useEffect(() => {
    // Wait for the wallet address before hitting the server; without it the
    // ownership-scoped lookup can only 404.
    if (!orderId || walletLoading) return

    let cancelled = false

    const applyOrder = (next: OnrampOrder) => {
      if (cancelled) return
      orderRef.current = next
      setOrder(next)
      setLoadError(null)
      setResolving(false)
    }

    // Deferred to a microtask so the optimistic cache read below does not call
    // setState synchronously inside the effect body.
    const load = async () => {
      // Pass 1 — optimistic render from the local cache.
      const cached = readCachedOrder<OnrampOrder>('onramp', orderId)
      if (cached) {
        applyOrder(cached)
      }

      // Pass 2 — reconcile with the server copy.
      const remote = await fetchOrder<OnrampOrder>('onramp', orderId, address)
      if (cancelled) return

      if (remote) {
        applyOrder(remote)
        return
      }

      if (cached) return

      // Neither the cache nor the server knows this order.  Seed the demo order
      // the flow has always fallen back to, and persist it so a reload or
      // another device picks it up from the server instead.
      const mockOrder: OnrampOrder = {
        id: orderId,
        createdAt: Date.now(), // Start at current time so delays work correctly
        expiresAt: Date.now() + 13 * 60 * 1000, // 13 minutes from now
        fiatCurrency: 'NGN',
        cryptoAsset: 'cNGN',
        paymentMethod: 'bank_transfer',
        amount: 50000,
        exchangeRate: 1600,
        cryptoAmount: 31.25,
        fees: {
          processingFee: 0,
          networkFee: 15,
          totalFees: 15,
          totalCost: 50015,
        },
        walletAddress: address || 'GAXYZ123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789ABCDEFG',
        status: 'awaiting_payment', // Start at awaiting_payment for demo
        transactionHash: undefined,
      }

      applyOrder(mockOrder)
      void persistOrder('onramp', mockOrder, mockOrder.walletAddress)
    }

    void Promise.resolve()
      .then(load)
      .catch(() => {
        if (cancelled) return
        setLoadError('Failed to load order')
        setResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [orderId, address, walletLoading])

  const updateOrderStatus = useCallback(
    (status: OrderStatus, additionalData?: Partial<OnrampOrder>) => {
      if (!orderId) return

      const previous = orderRef.current
      if (!previous) return

      const updated: OnrampOrder = { ...previous, status, ...additionalData }
      orderRef.current = updated
      setOrder(updated)

      // Writes the cache synchronously, then syncs the server in the
      // background — a failed round-trip must not stall the flow.
      void patchOrder('onramp', updated, updated.walletAddress || addressRef.current)
    },
    [orderId]
  )

  return {
    order,
    // Derived rather than stored, so the missing-id case needs no effect.
    loading: orderId ? resolving : false,
    error: orderId ? loadError : 'No order ID provided',
    updateOrderStatus,
  }
}
