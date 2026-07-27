import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider, MobileMoneyError } from '@/lib/payments'
import type { MobileMoneyProviderName } from '@/lib/payments'

const bodySchema = z.object({
  provider: z.enum(['mpesa', 'mtn_momo', 'flutterwave']),
  phoneNumber: z
    .string()
    .regex(/^\+\d{7,15}$/, 'phoneNumber must be in E.164 format, e.g. +254712345678'),
  amount: z.number().positive('amount must be a positive number'),
  currency: z.string().length(3, 'currency must be an ISO 4217 code, e.g. KES'),
  accountReference: z.string().min(1).max(12),
  transactionDesc: z.string().min(1).max(13),
  externalId: z.string().min(1),
  email: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { provider: providerName, ...params } = parsed.data

  try {
    const provider = getProvider(providerName as MobileMoneyProviderName)
    const result = await provider.initiatePayment(params)

    return NextResponse.json(
      {
        transactionId: result.transactionId,
        status: result.status,
        provider: result.provider,
      },
      { status: 202 }
    )
  } catch (err) {
    if (err instanceof MobileMoneyError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 })
    }

    console.error('[mobile-money/initiate]', err)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}
