import { OnrampOrder } from '@/types/onramp'
import { notifyOrderUpdate } from './notifications'

/**
 * Simulates the complete onramp flow with notifications
 * This would be called by your backend services at each stage
 */
export async function simulateOnrampFlow(order: OnrampOrder) {
  console.warn('🚀 Starting onramp flow simulation...')

  // 1. Order created
  console.warn('📝 Order created')
  await notifyOrderUpdate(order, 'order_created')
  await delay(2000)

  // 2. Payment received
  console.warn('💳 Payment received')
  const updatedOrder = { ...order, status: 'payment_received' as const }
  await notifyOrderUpdate(updatedOrder, 'payment_received')
  await delay(3000)

  // 3. Transaction complete
  // transactionHash must come from the Stellar network response after broadcast.
  // The caller is responsible for setting order.transactionHash before invoking this
  // function, or passing an order that already has the confirmed hash attached.
  console.warn('✅ Transaction complete')
  if (!updatedOrder.transactionHash) {
    throw new Error(
      `Cannot complete onramp flow for order ${updatedOrder.id}: ` +
        'transactionHash is missing. Submit the transaction to Stellar first and ' +
        'attach the returned hash to the order before calling simulateOnrampFlow.'
    )
  }
  const completedOrder = {
    ...updatedOrder,
    status: 'completed' as const,
    completedAt: Date.now(),
  }
  await notifyOrderUpdate(completedOrder, 'transfer_complete')

  console.warn('🎉 Onramp flow completed successfully!')
  return completedOrder
}

/**
 * Logs successful conversion for analytics
 */
export function logSuccessfulConversion(order: OnrampOrder) {
  const analyticsData = {
    orderId: order.id,
    amount: order.amount,
    fiatCurrency: order.fiatCurrency,
    cryptoAmount: order.cryptoAmount,
    cryptoAsset: order.cryptoAsset,
    paymentMethod: order.paymentMethod,
    exchangeRate: order.exchangeRate,
    processingTime: order.completedAt ? order.completedAt - order.createdAt : 0,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    referrer: typeof window !== 'undefined' ? window.document.referrer : null,
  }

  console.warn('📊 Analytics: Successful conversion logged', analyticsData)

  // In production, this would send to your analytics service
  // Examples: Google Analytics, Mixpanel, Amplitude, etc.

  return analyticsData
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
