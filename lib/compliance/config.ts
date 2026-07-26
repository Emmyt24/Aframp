/**
 * Tunable AML policy — every threshold the engine reads lives here.
 *
 * Nothing in lib/compliance/ may hard-code a limit, a window, or a score.  A
 * compliance officer changing risk appetite should only ever have to touch this
 * file, and the diff should be reviewable by someone who does not read
 * TypeScript.  This mirrors the rule lib/kyc/tiers.ts sets for KYC limits.
 *
 * ⚠️  The jurisdictional figures below (reporting thresholds, filing windows)
 *     are starting values drawn from the headline requirements of each market's
 *     AML statute.  They are NOT a substitute for local legal advice, and the
 *     exact figures move with statutory instruments and FX.  Confirm each one
 *     with counsel and with the relevant FIU before go-live, and re-confirm on
 *     a scheduled basis.  They are configuration, not fact.
 */

import type { Jurisdiction, RiskLevel } from './types'

// ---------------------------------------------------------------------------
// Risk bands
// ---------------------------------------------------------------------------

/**
 * Aggregate-score → risk level.  Bands are lower-inclusive: a score of exactly
 * 50 is HIGH.
 */
export const RISK_BANDS: Array<{ min: number; level: RiskLevel }> = [
  { min: 75, level: 'SEVERE' },
  { min: 50, level: 'HIGH' },
  { min: 25, level: 'MEDIUM' },
  { min: 0, level: 'LOW' },
]

/**
 * Decision thresholds against the aggregate score.
 *
 * A sanctions hit bypasses these entirely and blocks — see screenTransaction().
 * These only decide what to do with an accumulation of softer signals.
 */
export const DECISION_THRESHOLDS = {
  /** At or above this, hold the transaction and open a case. */
  review: 50,
  /** At or above this, reject. */
  block: 90,
} as const

/**
 * Weight applied to every signal after the highest-scoring one when
 * aggregating.  See scoreSignals() for why the aggregate is not a plain sum.
 */
export const SECONDARY_SIGNAL_WEIGHT = 0.35

// ---------------------------------------------------------------------------
// Name screening
// ---------------------------------------------------------------------------

export const NAME_SCREENING = {
  /**
   * Similarity at or above which a candidate is returned as a match.  0.85 is
   * the conventional starting point for Jaro-Winkler on transliterated names;
   * lowering it trades analyst time for recall.  Regulators expect this number
   * to be justified and periodically tested — do not change it casually.
   */
  matchThreshold: 0.85,
  /**
   * Above this, treat the hit as strong enough to block rather than review.
   * Between the two thresholds a human decides.
   */
  strongMatchThreshold: 0.95,
  /** Cap on matches carried into a case file, highest-scoring first. */
  maxMatches: 25,
} as const

// ---------------------------------------------------------------------------
// Velocity rules
// ---------------------------------------------------------------------------

export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000

/**
 * Velocity thresholds.  All windows in ms, all amounts in integer USD cents.
 *
 * Each rule is independently switchable so a market can run a subset while its
 * baseline data matures — a rule with no history behind it generates noise, not
 * intelligence.
 */
export const VELOCITY_RULES = {
  /** More than `maxCount` transactions inside `windowMs`. */
  txCount: {
    enabled: true,
    windowMs: DAY_MS,
    maxCount: 15,
    score: 45,
  },

  /** Aggregate throughput inside `windowMs` exceeds `maxVolumeCents`. */
  volume: {
    enabled: true,
    windowMs: DAY_MS,
    maxVolumeCents: 10_000_00, // $10,000
    score: 55,
  },

  /**
   * 24 h volume exceeds `multiplier` × the account's own trailing daily mean.
   *
   * Requires `minHistoryDays` of history and `minBaselineCents` of trailing
   * volume before it fires: without both, a first real transaction on a quiet
   * account trivially clears any multiple of ~zero and every new user gets
   * flagged.
   */
  spike: {
    enabled: true,
    windowMs: DAY_MS,
    baselineMs: 30 * DAY_MS,
    multiplier: 5,
    minHistoryDays: 7,
    minBaselineCents: 100_00, // $100
    score: 50,
  },

  /**
   * Structuring / smurfing: `minCount` or more transactions inside
   * `windowMs`, each landing within `bandPct` *below* the jurisdiction's
   * reporting threshold, and summing to at least that threshold.
   *
   * The "sums to at least the threshold" leg is what separates deliberate
   * structuring from a merchant who simply transacts in similar amounts.
   */
  structuring: {
    enabled: true,
    windowMs: 7 * DAY_MS,
    minCount: 3,
    bandPct: 0.2,
    score: 70,
  },

  /**
   * Layering: an onramp followed by an offramp (or the reverse) of comparable
   * value inside `windowMs`.  Buying and immediately selling forfeits the
   * spread, so it is rarely done for economic reasons.
   */
  rapidReversal: {
    enabled: true,
    windowMs: 6 * HOUR_MS,
    /** Counterpart must be within ±this fraction of the current amount. */
    valueTolerance: 0.15,
    /** Ignore below this — small round-trips are usually genuine mistakes. */
    minAmountCents: 500_00, // $500
    score: 60,
  },

  /** Payouts fanned across more than `maxCounterparties` distinct recipients. */
  counterpartyFanout: {
    enabled: true,
    windowMs: DAY_MS,
    maxCounterparties: 8,
    score: 45,
  },

  /** A large transaction inside the account's first `windowMs`. */
  newAccountHighValue: {
    enabled: true,
    windowMs: 7 * DAY_MS,
    minAmountCents: 2_000_00, // $2,000
    score: 40,
  },

  /**
   * A large transaction after `dormancyMs` of silence — a classic mule-account
   * reactivation pattern.
   */
  dormantReactivation: {
    enabled: true,
    dormancyMs: 90 * DAY_MS,
    minAmountCents: 1_000_00, // $1,000
    score: 40,
  },
} as const

// ---------------------------------------------------------------------------
// Jurisdictions
// ---------------------------------------------------------------------------

export interface JurisdictionPolicy {
  /** Receiving financial intelligence unit. */
  regulator: string
  regulatorName: string
  /** What the FIU calls the filing locally. */
  filingName: string
  /**
   * Hours from suspicion being formed to the filing being due.
   * ⚠️  Confirm against current local statute — see the file header.
   */
  filingDeadlineHours: number
  /**
   * Cash/transaction reporting threshold, converted to USD cents.
   *
   * Used only to anchor structuring detection (transactions clustering just
   * below it).  It is an FX-sensitive approximation of the local-currency
   * figure noted alongside, and must be re-derived when rates move materially.
   */
  reportingThresholdCents: number
  localThresholdNote: string
}

export const JURISDICTIONS: Record<Jurisdiction, JurisdictionPolicy> = {
  NG: {
    regulator: 'NFIU',
    regulatorName: 'Nigerian Financial Intelligence Unit',
    filingName: 'Suspicious Transaction Report (STR)',
    filingDeadlineHours: 24,
    reportingThresholdCents: 3_300_00,
    localThresholdNote: '≈ ₦5,000,000 individual threshold (MLPPA 2022)',
  },
  KE: {
    regulator: 'FRC',
    regulatorName: 'Financial Reporting Centre',
    filingName: 'Suspicious Transaction Report (STR)',
    filingDeadlineHours: 168, // 7 days
    reportingThresholdCents: 7_700_00,
    localThresholdNote: '≈ KES 1,000,000 threshold (POCAMLA)',
  },
  GH: {
    regulator: 'FIC',
    regulatorName: 'Financial Intelligence Centre',
    filingName: 'Suspicious Transaction Report (STR)',
    filingDeadlineHours: 24,
    reportingThresholdCents: 4_000_00,
    localThresholdNote: '≈ GHS 50,000 threshold (AMLA 2020)',
  },
  ZA: {
    regulator: 'FIC',
    regulatorName: 'Financial Intelligence Centre',
    filingName: 'Suspicious Transaction Report (STR), FICA s29',
    filingDeadlineHours: 360, // 15 days
    reportingThresholdCents: 2_700_00,
    localThresholdNote: '≈ R49,999.99 cash threshold (FICA)',
  },
  UG: {
    regulator: 'FIA',
    regulatorName: 'Financial Intelligence Authority',
    filingName: 'Suspicious Transaction Report (STR)',
    filingDeadlineHours: 48,
    reportingThresholdCents: 5_400_00,
    localThresholdNote: '≈ UGX 20,000,000 threshold (AMLA 2013)',
  },
}

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

/**
 * All five markets require AML records to be retained for at least five years
 * after the relationship or transaction ends.  The in-memory stores obviously
 * cannot honour that — this constant exists so the SQL retention job and any
 * future archival code read the same number.
 */
export const RECORD_RETENTION_YEARS = 5

/**
 * Ledger entries held per account in the in-memory store.  Bounds heap growth
 * the way MAX_ORDERS_PER_WALLET does for orders.  The SQL table has no such
 * cap — retention there is RECORD_RETENTION_YEARS.
 */
export const MAX_LEDGER_ENTRIES_PER_USER = 500

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

/**
 * How long to wait on a provider before falling back to the local list.
 *
 * A screening call sits in the critical path of a payment, so this is short by
 * design.  A timeout is not a pass: it raises PROVIDER_UNAVAILABLE and the
 * transaction is routed to review rather than allowed through unscreened
 * (see FAIL_CLOSED).
 */
export const PROVIDER_TIMEOUT_MS = 4_000

/**
 * When a provider is unreachable, fail closed — hold the transaction for human
 * review instead of letting it through unscreened.
 *
 * Turning this off makes an outage at the provider a hole in the control, which
 * is exactly the failure mode examiners look for.  It exists only so a market
 * can be brought up before its provider contract is signed, and it should be
 * `true` in every production environment.
 */
export const FAIL_CLOSED = true
