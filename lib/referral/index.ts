/**
 * Referral program core logic.
 *
 * Storage: localStorage (client) + lib/referral/store.ts (server, DB-backed).
 */

export const REFERRAL_DISCOUNT_PCT = 10 // 10% off first ramp fees
export const REFERRAL_REWARD_PCT = 5   // 5% fee rebate for referrer on referee's first ramp

/** Generate a unique referral code from a wallet address */
export function generateReferralCode(walletAddress: string): string {
  // Deterministic: first 4 chars of address + 4-char hash suffix
  const prefix = walletAddress.slice(1, 5).toUpperCase()
  let hash = 0
  for (let i = 0; i < walletAddress.length; i++) {
    hash = (hash * 31 + walletAddress.charCodeAt(i)) >>> 0
  }
  const suffix = (hash % 10000).toString().padStart(4, '0')
  return `AFR-${prefix}-${suffix}`
}

export interface ReferralRecord {
  code: string
  ownerAddress: string
  referees: string[]       // wallet addresses who used this code
  totalRebatesEarned: number // in fiat (NGN equivalent)
  createdAt: number
}

export interface ReferralReward {
  discountPct: number
  isFirstRamp: boolean
  discountAmount: number
}

/** Calculate the discount for a referee on their first ramp */
export function calcReferralDiscount(totalFees: number): ReferralReward {
  const discountAmount = totalFees * (REFERRAL_DISCOUNT_PCT / 100)
  return {
    discountPct: REFERRAL_DISCOUNT_PCT,
    isFirstRamp: true,
    discountAmount,
  }
}

// ── localStorage helpers (client-side) ──────────────────────────────────────

const LS_APPLIED_KEY = 'referral:applied'   // code the current user applied
const LS_USED_KEY = 'referral:used'          // whether first-ramp discount was consumed

export function getAppliedReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LS_APPLIED_KEY)
}

export function setAppliedReferralCode(code: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_APPLIED_KEY, code)
}

export function isReferralDiscountConsumed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(LS_USED_KEY) === 'true'
}

export function markReferralDiscountConsumed() {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_USED_KEY, 'true')
}
