/**
 * POST /api/withdrawals
 *
 * Initiates a fiat withdrawal (offramp).  The KYC-tier limit is enforced here
 * on the backend — the frontend cannot bypass it.
 *
 * Request body (JSON):
 *   {
 *     userId:      string   — wallet public key
 *     amountCents: number   — withdrawal amount in cents (USD)
 *     asset:       string   — e.g. "cNGN", "USDC"
 *     chain:       string   — e.g. "Stellar"
 *     kycTier:     KycTier  — "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3"
 *   }
 *
 * Success 200:
 *   { orderId, remaining, resetAt }
 *
 * Error 400: invalid request body
 * Error 403: limit exceeded or KYC required  (WithdrawalLimitError body)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { canWithdraw } from '@/lib/kyc/withdrawalLimitService'
import { WithdrawalLimitError } from '@/lib/kyc/errors'
import { isKycTier } from '@/lib/kyc/tiers'
import { captureError, log } from '@/lib/observability'

const RequestSchema = z.object({
  userId: z.string().min(1),
  amountCents: z.number().int().positive(),
  asset: z.string().min(1),
  chain: z.string().min(1),
  kycTier: z.string().refine(isKycTier, { message: 'Invalid KYC tier' }),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, amountCents, asset, chain, kycTier } = parsed.data

  // Enforce the rolling 24-hour limit — this is the source of truth.
  const result = await canWithdraw(userId, amountCents, kycTier)

  if (!result.allowed) {
    const limitError = new WithdrawalLimitError(
      result.reason!,
      kycTier,
      result.used,
      result.remaining,
      result.resetAt
    )
    log.warn('withdrawal.limit_exceeded', {
      userId,
      kycTier,
      amountCents,
      reason: result.reason,
      remaining: result.remaining,
    })
    return NextResponse.json(limitError.toResponseBody(), { status: 403 })
  }

  // Limit check passed — proceed with order creation.
  // In production: persist the order to the DB, trigger the settlement flow.
  const orderId = `OFF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  log.info('withdrawal.initiated', {
    orderId,
    asset,
    chain,
    amountCents,
    kycTier,
    remaining: result.remaining,
  })

  return NextResponse.json(
    {
      orderId,
      asset,
      chain,
      amountCents,
      status: 'pending',
      remaining: result.remaining,
      resetAt: result.resetAt,
    },
    { status: 200 }
  )
}
