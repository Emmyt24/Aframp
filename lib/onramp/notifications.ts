import { OnrampOrder } from '@/types/onramp'

export interface NotificationData {
  orderId: string
  status: string
  amount?: number
  currency?: string
  cryptoAmount?: number
  cryptoAsset?: string
  transactionHash?: string
}

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

export function sendSMSNotification(type: string, data: NotificationData): Promise<void> {
  // This would integrate with Twilio or similar SMS service
  const { message } = getDetailedNotificationMessage(type, data)

  console.warn(`SMS notification: ${type}`)
  console.warn(`Message: ${message.substring(0, 160)}...`) // SMS character limit

  // Simulate API call to SMS service
  return new Promise((resolve) => {
    setTimeout(() => {
      console.warn(`✅ SMS sent for ${type}`)
      resolve()
    }, 1000)
  })
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
  }

  try {
    await Promise.all([
      sendEmailNotification(type, data),
      // Uncomment to enable SMS
      // sendSMSNotification(type, data)
    ])
  } catch (error) {
    console.error('Failed to send notifications:', error)
  }
}
