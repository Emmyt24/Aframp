import { eq } from 'drizzle-orm'
import { db, hasDatabase } from '@/db/client'
import { referralCodes } from '@/db/schema'
import type { ReferralRecord } from '@/lib/referral'

// In-memory fallback used only when DATABASE_URL is not configured
// (local development). Production must set DATABASE_URL.
const memoryStore = new Map<string, ReferralRecord>()

export async function getReferralRecord(code: string): Promise<ReferralRecord | undefined> {
  if (hasDatabase && db) {
    const [row] = await db.select().from(referralCodes).where(eq(referralCodes.code, code))
    if (!row) return undefined
    return {
      code: row.code,
      ownerAddress: row.ownerAddress,
      referees: row.referees as string[],
      totalRebatesEarned: Number(row.totalRebatesEarned),
      createdAt: row.createdAt.getTime(),
    }
  }
  return memoryStore.get(code)
}

export async function createReferralRecordIfMissing(record: ReferralRecord): Promise<void> {
  if (hasDatabase && db) {
    await db
      .insert(referralCodes)
      .values({
        code: record.code,
        ownerAddress: record.ownerAddress,
        referees: record.referees,
        totalRebatesEarned: String(record.totalRebatesEarned),
      })
      .onConflictDoNothing()
    return
  }
  if (!memoryStore.has(record.code)) memoryStore.set(record.code, record)
}

export async function addReferee(code: string, refereeWallet: string): Promise<void> {
  if (hasDatabase && db) {
    const [row] = await db.select().from(referralCodes).where(eq(referralCodes.code, code))
    if (!row) return
    const referees = [...(row.referees as string[]), refereeWallet]
    await db.update(referralCodes).set({ referees }).where(eq(referralCodes.code, code))
    return
  }
  memoryStore.get(code)?.referees.push(refereeWallet)
}
