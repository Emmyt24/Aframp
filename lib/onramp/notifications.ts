/**
 * lib/onramp/notifications.ts
 *
 * Sends transactional emails for onramp order lifecycle events via Resend.
 * Previously these were console.warn stubs — this module now delivers real
 * emails using the helpers in lib/email/resend-client.ts.
 *
 * Callers must supply a valid recipient email address.  The helper
 * `notifyOrderUpdate` is the recommended entry point for most use-cases.
 */

import { OnrampOrder } from '@/types/onramp'
import {
  sendOrderConfirmationEmail,
  sendPaymentReceivedEmail,
  sendTransferCompleteEmail,
  sendTransactionFailedEmail,
} from '@/lib/email/resend-client'

export interface NotificationData {
  orderId: string
  status: string
  amount?: number
  currency?: string
  cryptoAmount?: number
  cryptoAsset?: string
  transactionHash?: string
  /** Recipient email address — required for real delivery. */
  email?: string
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends a transactional email for the given order event type.
 *
 * @param type  - One of: 'order_created' | 'payment_received' | 'transfer_complete' | 'transaction_failed'
 * @param data  - Order data including recipient email
 */
export async function sendEmailNotification(type: string, data: NotificationData): Promise<void> {
  const {
    orderId,
    amount = 0,
    currency = 'NGN',
    cryptoAmount = 0,
    cryptoAsset = 'cNGN',
    transactionHash,
    email,
  } = data

  if (!email) {
    console.warn(
      `[notifications] sendEmailNotification(${type}): no recipient email provided — skipping.`
    )
    return
  }

  const base = { to: email, orderId, amount, currency, cryptoAmount, cryptoAsset }

  switch (type) {
    case 'order_created':
      await sendOrderConfirmationEmail(base)
      break

    case 'payment_received':
      await sendPaymentReceivedEmail(base)
      break

    case 'transfer_complete':
      await sendTransferCompleteEmail({ ...base, transactionHash })
      break

    case 'transaction_failed':
      await sendTransactionFailedEmail(base)
      break

    default:
      console.warn(`[notifications] Unknown notification type: ${type}`)
  }
}

/**
 * SMS notifications are handled by a separate provider (e.g. Twilio).
 * This stub is preserved to avoid breaking callers while SMS integration
 * is pending.
 */
export async function sendSMSNotification(type: string, data: NotificationData): Promise<void> {
  // TODO: integrate Twilio or Africa's Talking for SMS
  console.warn(`[notifications] SMS notification pending integration — type: ${type}`)
}

// ── Notification copy (used in push / in-app notifications) ─────────────────

export function getNotificationMessage(type: string, order: OnrampOrder): string {
  switch (type) {
    case 'order_created':
      return `Your order #${order.id.slice(-8).toUpperCase()} is waiting for payment`
    case 'payment_received':
      return `Payment confirmed! Processing your ${order.cryptoAsset}`
    case 'transfer_complete':
      return `${order.cryptoAmount.toFixed(2)} ${order.cryptoAsset} sent to your wallet`
    case 'transaction_failed':
      return `Payment issue with order #${order.id.slice(-8).toUpperCase()} — contact support`
    default:
      return 'AFRAMP transaction update'
  }
}

// ── Convenience wrapper ──────────────────────────────────────────────────────

/**
 * Sends email (and optionally SMS) notifications for an order lifecycle event.
 *
 * @param order  - The full OnrampOrder object
 * @param type   - Notification type key
 * @param email  - Recipient email address (fetched from auth session / user record by the caller)
 */
export async function notifyOrderUpdate(order: OnrampOrder, type: string, email?: string) {
  const data: NotificationData = {
    orderId: order.id,
    status: order.status,
    amount: order.amount,
    currency: order.fiatCurrency,
    cryptoAmount: order.cryptoAmount,
    cryptoAsset: order.cryptoAsset,
    transactionHash: order.transactionHash,
    email,
  }

  try {
    await Promise.all([
      sendEmailNotification(type, data),
      // Uncomment to enable SMS once a provider is integrated:
      // sendSMSNotification(type, data),
    ])
  } catch (error) {
    console.error('[notifications] Failed to send notifications:', error)
  }
}
