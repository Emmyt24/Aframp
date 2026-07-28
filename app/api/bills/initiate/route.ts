import { NextRequest, NextResponse } from 'next/server'
import { getPaymentGatewayService } from '@/lib/bills/payment-gateway'
import { BillPaymentFormData } from '@/lib/bills/types'
import { captureError, log } from '@/lib/observability'

export async function POST(request: NextRequest) {
  try {
    const body: BillPaymentFormData = await request.json()

    // Validate required fields
    if (!body.billerId || !body.accountNumber || !body.amount || !body.customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique reference
    const reference = `BILL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Initialize payment with selected gateway
    const gateway = body.gateway || 'paystack'
    const paymentService = getPaymentGatewayService(gateway)

    const paymentData = {
      email: body.customerEmail,
      amount: body.amount,
      currency: 'NGN', // Default to NGN, can be made dynamic
      reference,
      metadata: {
        billerId: body.billerId,
        billerName: body.billerName,
        accountNumber: body.accountNumber,
        customerPhone: body.customerPhone,
        paymentMethod: body.paymentMethod,
        ...body.metadata,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bills/verify?reference=${reference}`,
    }

    const result = await paymentService.initiatePayment(paymentData)

    log.info('bills.payment.initiated', {
      billerId: body.billerId,
      gateway,
      reference,
    })

    return NextResponse.json({
      success: true,
      authorization_url: result.authorization_url,
      reference: result.reference,
    })
  } catch (error) {
    captureError(error, {
      tags: { domain: 'bills', operation: 'initiate-payment' },
      extra: { billerId: (error as Record<string, unknown>)?.billerId },
    })
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
