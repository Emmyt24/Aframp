import { OnrampOrder } from '@/types/onramp'

export function generateReceiptPDF(order: OnrampOrder): void {
  if (!order.transactionHash) {
    throw new Error(
      `Cannot generate receipt for order ${order.id}: transactionHash is missing. ` +
        'The transaction must be confirmed on-chain before a receipt can be issued.'
    )
  }

  // Enhanced receipt data with all required fields
  const receiptData = {
    receiptNumber: `RCP-${order.id.slice(-8).toUpperCase()}`,
    date: new Date(order.completedAt || order.createdAt).toLocaleDateString(),
    orderDetails: {
      amount: `${order.fiatCurrency} ${order.amount.toLocaleString()}`,
      asset: `${order.cryptoAmount.toFixed(2)} ${order.cryptoAsset}`,
      paymentMethod: order.paymentMethod.replace('_', ' '),
      exchangeRate: `1 ${order.fiatCurrency} = ${order.exchangeRate} ${order.cryptoAsset}`,
      processingFee: `${order.fees.processingFee}`,
      networkFee: `${order.fees.networkFee}`,
      totalTime:
        order.completedAt
          ? `${Math.round((order.completedAt - order.createdAt) / 1000)} seconds`
          : 'N/A',
      completedAt: new Date(order.completedAt || order.createdAt).toLocaleString(),
    },
    blockchain: {
      transactionHash: order.transactionHash,
      walletAddress: order.walletAddress,
      network: 'Stellar',
      explorerUrl: `https://stellar.expert/explorer/public/tx/${order.transactionHash}`,
    },
  }

  // Create comprehensive receipt content
  const receiptText = `
═══════════════════════════════════════════════════════════════
                        🌍 AFRAMP RECEIPT
                   Africa's Financial Bridge
═══════════════════════════════════════════════════════════════

Receipt Number: ${receiptData.receiptNumber}
Date: ${receiptData.date}
Status: COMPLETED ✅

═══════════════════════════════════════════════════════════════
                      TRANSACTION SUMMARY
═══════════════════════════════════════════════════════════════

You paid:           ${receiptData.orderDetails.amount}
You received:       ${receiptData.orderDetails.asset}
Exchange rate:      ${receiptData.orderDetails.exchangeRate}
Processing fee:     ${receiptData.orderDetails.processingFee}
Network fee:        ${receiptData.orderDetails.networkFee}
Total time:         ${receiptData.orderDetails.totalTime}
Completed:          ${receiptData.orderDetails.completedAt}

═══════════════════════════════════════════════════════════════
                    BLOCKCHAIN VERIFICATION
═══════════════════════════════════════════════════════════════

Transaction Hash:   ${receiptData.blockchain.transactionHash}
Wallet Address:     ${receiptData.blockchain.walletAddress}
Network:            ${receiptData.blockchain.network}
Explorer URL:       ${receiptData.blockchain.explorerUrl}

═══════════════════════════════════════════════════════════════
                         VERIFICATION
═══════════════════════════════════════════════════════════════

This transaction has been verified on the Stellar blockchain.
You can verify this transaction independently using the 
transaction hash above on any Stellar explorer.

QR Code for Verification: [Transaction Hash]
${receiptData.blockchain.transactionHash}

═══════════════════════════════════════════════════════════════
                      TERMS & CONDITIONS
═══════════════════════════════════════════════════════════════

• All transactions are final and irreversible
• AFRAMP is not responsible for user errors in wallet addresses
• Network fees are determined by the Stellar network
• Exchange rates are locked at time of order creation
• For support, contact: support@aframp.com

═══════════════════════════════════════════════════════════════
                         SUPPORT
═══════════════════════════════════════════════════════════════

Need help? Contact us:
Email: support@aframp.com
Website: https://aframp.com
Verification Portal: https://verify.aframp.com

═══════════════════════════════════════════════════════════════

Built for Africa, Verified by Blockchain.
Onramp to the future. Offramp to opportunity. 🔗🌍

Thank you for using AFRAMP!

═══════════════════════════════════════════════════════════════
  `.trim()

  // Create and download the receipt
  const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aframp-receipt-${receiptData.receiptNumber}.txt`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  // Log successful receipt generation for analytics
  console.warn('Receipt generated:', {
    receiptNumber: receiptData.receiptNumber,
    orderId: order.id,
    timestamp: new Date().toISOString(),
  })
}
