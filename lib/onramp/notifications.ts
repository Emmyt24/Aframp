import { OnrampOrder } from '@/types/onramp'

export interface NotificationData {
  orderId: string
  status: string
  amount?: number
  currency?: string
  cryptoAmount?: number
  cryptoAsset?: string
  transactionHash?: string
  /** E.164 phone number of the recipient, e.g. "+234XXXXXXXXXX" */
  phoneNumber?: string
}

// ── Email ────────────────────────────────────────────────────────────────────

export function sendEmailNotification(type: string, data: NotificationData): Promise<void> {
  // This would integrate with your email service (SendGrid, Resend, etc.)
  const { subject, message } = getDetailedNotificationMessage(type, data)

  console.warn(`Email notification: ${type}`)
  console.warn(`Subject: ${subject}`)
  console.warn(`Message: ${message}`)

  // Simulate API call to email service
  return new Promise((resolve) => {
    setTimeout(() => {
      console.warn(`✅ Email sent for ${type}`)
      resolve()
    }, 1000)
  })
}

// ── SMS via Africa's Talking ──────────────────────────────────────────────────
//
// Africa's Talking is purpose-built for African markets and covers NG, KE, GH,
// ZA, and UG — exactly the currencies supported by AFRAMP.
//
// Required environment variables:
//   AT_API_KEY      — Africa's Talking API key (from their dashboard)
//   AT_USERNAME     — Africa's Talking username (use "sandbox" for testing)
//   AT_SENDER_ID    — Short-code or alphanumeric sender ID (optional)
//
// REST API docs: https://developers.africastalking.com/docs/sms/sending
// ---------------------------------------------------------------------------

const AT_BASE_URL = 'https://api.africastalking.com/version1/messaging'
const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging'

/**
 * Send an SMS message to a phone number using Africa's Talking.
 *
 * SMS events wired up:
 *   order_created          — payment instructions
 *   payment_received       — payment confirmed, processing started
 *   transfer_complete      — funds credited to wallet
 *   transaction_failed     — failure notice with support contact
 *   offramp_initiated      — offramp settlement started
 */
export async function sendSMSNotification(
  type: string,
  data: NotificationData,
): Promise<void> {
  const apiKey = process.env.AT_API_KEY
  const username = process.env.AT_USERNAME
  const senderId = process.env.AT_SENDER_ID ?? ''
  const phoneNumber = data.phoneNumber

  if (!apiKey || !username) {
    console.warn('[SMS] AT_API_KEY or AT_USERNAME not set — skipping SMS for:', type)
    return
  }

  if (!phoneNumber) {
    console.warn('[SMS] No phone number provided — skipping SMS for:', type)
    return
  }

  const { message } = getDetailedNotificationMessage(type, data)
  // Africa's Talking caps standard SMS at 160 chars; longer messages are split
  // automatically, but we trim for cost predictability.
  const smsBody = message.replace(/\n+/g, ' ').trim().slice(0, 160)

  const isSandbox = username === 'sandbox'
  const url = isSandbox ? AT_SANDBOX_URL : AT_BASE_URL

  const params = new URLSearchParams({
    username,
    to: phoneNumber,
    message: smsBody,
  })
  if (senderId) params.set('from', senderId)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const json = (await res.json()) as {
      SMSMessageData?: { Message: string; Recipients?: { status: string; number: string }[] }
    }

    if (!res.ok) {
      console.error(`[SMS] Africa's Talking request failed (${res.status}):`, json)
      return
    }

    const recipients = json.SMSMessageData?.Recipients ?? []
    const failed = recipients.filter((r) => r.status !== 'Success')
    if (failed.length > 0) {
      console.error('[SMS] Delivery failures:', failed)
    } else {
      console.info(`[SMS] ✅ Sent "${type}" to ${phoneNumber}`)
    }
  } catch (err) {
    console.error("[SMS] Africa's Talking network error:", err)
  }
}

function getDetailedNotificationMessage(
  type: string,
  data: NotificationData
): { subject: string; message: string } {
  const { orderId, status, amount, currency, cryptoAmount, cryptoAsset, transactionHash } = data

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL is not set. ' +
        'Add it to your .env.local file (e.g. NEXT_PUBLIC_APP_URL=http://localhost:3000) ' +
        'before sending email notifications.'
    )
  }

  switch (type) {
    case 'order_created':
      return {
        subject: `AFRAMP Order Created - #${orderId.slice(-8).toUpperCase()}`,
        message: `Your order #ONR-${orderId.slice(-8).toUpperCase()} is waiting for payment. 
        
Amount: ${amount?.toLocaleString()} ${currency}
Asset: ${cryptoAmount?.toFixed(2)} ${cryptoAsset}
Status: ${status.toUpperCase()}

Complete your payment to receive your ${cryptoAsset} tokens.

View order: ${appUrl}/onramp/payment?order=${orderId}`,
      }

    case 'payment_received':
      return {
        subject: `Payment Confirmed - Processing Your ${cryptoAsset}`,
        message: `Payment confirmed! Processing your ${cryptoAmount?.toFixed(2)} ${cryptoAsset}.

Order: #ONR-${orderId.slice(-8).toUpperCase()}
Amount Paid: ${amount?.toLocaleString()} ${currency}
Status: Processing

Your ${cryptoAsset} will be sent to your wallet shortly.`,
      }

    case 'transfer_complete':
      return {
        subject: `🎉 Transaction Complete - ${cryptoAmount?.toFixed(2)} ${cryptoAsset} Received!`,
        message: `Congratulations! Your transaction is complete.

✅ ${cryptoAmount?.toFixed(2)} ${cryptoAsset} sent to your wallet
💰 Amount paid: ${amount?.toLocaleString()} ${currency}
🔗 Transaction hash: ${transactionHash}
⏱️ Total time: 3 minutes 42 seconds

View on Stellar Explorer: https://stellar.expert/explorer/public/tx/${transactionHash}
Download receipt: ${appUrl}/onramp/success?order=${orderId}

Thank you for using AFRAMP!`,
      }

    case 'transaction_failed':
      return {
        subject: `Transaction Failed - Order #${orderId.slice(-8).toUpperCase()}`,
        message: `We encountered an issue processing your transaction.

Order: #ONR-${orderId.slice(-8).toUpperCase()}
Amount: ${amount?.toLocaleString()} ${currency}
Status: Failed

Please contact our support team for assistance:
Email: support@aframp.com
Include your order ID in your message.

We apologize for the inconvenience.`,
      }

    case 'offramp_initiated':
      return {
        subject: `Offramp Settlement Started - Order #${orderId.slice(-8).toUpperCase()}`,
        message: `Your offramp settlement has been initiated.

Order: #ONR-${orderId.slice(-8).toUpperCase()}
You will receive: ${amount?.toLocaleString()} ${currency}
Asset sold: ${cryptoAmount?.toFixed(2)} ${cryptoAsset}

Funds will arrive in your account within 1-2 business days.
Track your order: https://aframp.com/offramp/status?order=${orderId}`,
      }

    default:
      return {
        subject: `AFRAMP Order Update - #${orderId.slice(-8).toUpperCase()}`,
        message: `Your order status has been updated to: ${status.toUpperCase()}`,
      }
  }
}

export function getNotificationMessage(type: string, order: OnrampOrder): string {
  switch (type) {
    case 'order_created':
      return `Your order #${order.id.slice(-8).toUpperCase()} is waiting for payment`
    case 'payment_received':
      return `Payment confirmed! Processing your ${order.cryptoAsset}`
    case 'transfer_complete':
      return `${order.cryptoAmount.toFixed(2)} ${order.cryptoAsset} sent to your wallet`
    case 'transaction_failed':
      return `Payment issue with order #${order.id.slice(-8).toUpperCase()} - contact support`
    default:
      return 'AFRAMP transaction update'
  }
}

export async function notifyOrderUpdate(order: OnrampOrder, type: string) {
  const data: NotificationData = {
    orderId: order.id,
    status: order.status,
    amount: order.amount,
    currency: order.fiatCurrency,
    cryptoAmount: order.cryptoAmount,
    cryptoAsset: order.cryptoAsset,
    transactionHash: order.transactionHash,
    // phoneNumber is not stored on OnrampOrder yet; populate from user profile
    // when that data is available:  phoneNumber: order.userPhoneNumber
  }

  try {
    await Promise.all([
      sendEmailNotification(type, data),
      sendSMSNotification(type, data),
    ])
  } catch (error) {
    console.error('Failed to send notifications:', error)
  }
}
