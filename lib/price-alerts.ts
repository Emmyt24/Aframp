import { promises as fs } from 'fs'
import path from 'path'
import { desc, eq } from 'drizzle-orm'
import { db, hasDatabase } from '@/db/client'
import { priceAlertEvents, priceAlertRules } from '@/db/schema'

export type PriceAlertChannel = 'email' | 'push'
export type PriceAlertDirection = 'below' | 'above'

export interface PriceAlertRule {
  id: string
  asset: 'cNGN'
  direction: PriceAlertDirection
  threshold: number
  channels: {
    email: boolean
    push: boolean
  }
  email: string
  createdAt: number
  lastTriggeredAt?: number
}

export interface PriceAlertEvent {
  id: string
  ruleId: string
  asset: 'cNGN'
  direction: PriceAlertDirection
  threshold: number
  actualValue: number
  channel: PriceAlertChannel
  notifiedAt: number
  message: string
}

export interface PriceAlertsStore {
  rules: PriceAlertRule[]
  history: PriceAlertEvent[]
}

const generateId = () => `alert_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

function ruleToRow(rule: PriceAlertRule) {
  return {
    id: rule.id,
    asset: rule.asset,
    direction: rule.direction,
    threshold: String(rule.threshold),
    email: rule.email,
    notifyEmail: rule.channels.email,
    notifyPush: rule.channels.push,
    lastTriggeredAt: rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt) : null,
  }
}

function rowToRule(row: typeof priceAlertRules.$inferSelect): PriceAlertRule {
  return {
    id: row.id,
    asset: row.asset as 'cNGN',
    direction: row.direction as PriceAlertDirection,
    threshold: Number(row.threshold),
    channels: { email: row.notifyEmail, push: row.notifyPush },
    email: row.email,
    createdAt: row.createdAt.getTime(),
    lastTriggeredAt: row.lastTriggeredAt ? row.lastTriggeredAt.getTime() : undefined,
  }
}

function rowToEvent(row: typeof priceAlertEvents.$inferSelect): PriceAlertEvent {
  return {
    id: row.id,
    ruleId: row.ruleId,
    asset: row.asset as 'cNGN',
    direction: row.direction as PriceAlertDirection,
    threshold: Number(row.threshold),
    actualValue: Number(row.actualValue),
    channel: row.channel as PriceAlertChannel,
    notifiedAt: row.notifiedAt.getTime(),
    message: row.message,
  }
}

// ── File-backed fallback (local dev only, when DATABASE_URL is unset) ──────
const STORE_PATH = path.join(process.cwd(), 'db', 'price-alerts-store.json')
const DEFAULT_STORE: PriceAlertsStore = { rules: [], history: [] }

async function ensureStoreFile() {
  try {
    await fs.access(STORE_PATH)
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8')
  }
}

async function readPriceAlertStore(): Promise<PriceAlertsStore> {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    return JSON.parse(raw) as PriceAlertsStore
  } catch {
    return DEFAULT_STORE
  }
}

async function writePriceAlertStore(store: PriceAlertsStore): Promise<PriceAlertsStore> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
  return store
}

async function readStore(): Promise<PriceAlertsStore> {
  if (hasDatabase && db) {
    const [rules, history] = await Promise.all([
      db.select().from(priceAlertRules),
      db.select().from(priceAlertEvents).orderBy(desc(priceAlertEvents.notifiedAt)).limit(100),
    ])
    return { rules: rules.map(rowToRule), history: history.map(rowToEvent) }
  }
  return readPriceAlertStore()
}

export async function getPriceAlertsStore() {
  const store = await readStore()
  const currentPrice = await getCngnPrice()
  return { ...store, currentPrice }
}

export async function addPriceAlertRule({
  email,
  direction,
  threshold,
  channels,
}: Omit<PriceAlertRule, 'id' | 'asset' | 'createdAt' | 'lastTriggeredAt'>) {
  const newRule: PriceAlertRule = {
    id: generateId(),
    asset: 'cNGN',
    direction,
    threshold,
    channels,
    email,
    createdAt: Date.now(),
  }

  if (hasDatabase && db) {
    await db.insert(priceAlertRules).values(ruleToRow(newRule))
    return newRule
  }

  const store = await readPriceAlertStore()
  store.rules.unshift(newRule)
  await writePriceAlertStore(store)
  return newRule
}

export async function triggerPriceAlertChecks() {
  const currentPrice = await getCngnPrice()
  const now = Date.now()

  if (hasDatabase && db) {
    const rules = (await db.select().from(priceAlertRules)).map(rowToRule)
    const events: PriceAlertEvent[] = []

    for (const rule of rules) {
      const meetsThreshold =
        rule.direction === 'below' ? currentPrice < rule.threshold : currentPrice > rule.threshold
      if (!meetsThreshold) continue

      const wasRecentlyTriggered = rule.lastTriggeredAt && now - rule.lastTriggeredAt < 60 * 60 * 1000
      if (wasRecentlyTriggered) continue

      if (rule.channels.email) events.push(await notifyAlert(rule, 'email', currentPrice))
      if (rule.channels.push) events.push(await notifyAlert(rule, 'push', currentPrice))

      await db
        .update(priceAlertRules)
        .set({ lastTriggeredAt: new Date(now) })
        .where(eq(priceAlertRules.id, rule.id))
    }

    if (events.length > 0) {
      await db.insert(priceAlertEvents).values(
        events.map((event) => ({
          id: event.id,
          ruleId: event.ruleId,
          asset: event.asset,
          direction: event.direction,
          threshold: String(event.threshold),
          actualValue: String(event.actualValue),
          channel: event.channel,
          message: event.message,
        }))
      )
    }

    const store = await readStore()
    return { currentPrice, events, rules: store.rules, history: store.history }
  }

  const store = await readPriceAlertStore()
  const events: PriceAlertEvent[] = []

  for (const rule of store.rules) {
    const meetsThreshold =
      rule.direction === 'below'
        ? currentPrice < rule.threshold
        : currentPrice > rule.threshold

    if (!meetsThreshold) {
      continue
    }

    const wasRecentlyTriggered = rule.lastTriggeredAt && now - rule.lastTriggeredAt < 60 * 60 * 1000
    if (wasRecentlyTriggered) {
      continue
    }

    if (rule.channels.email) {
      const event = await notifyAlert(rule, 'email', currentPrice)
      events.push(event)
      store.history.unshift(event)
    }

    if (rule.channels.push) {
      const event = await notifyAlert(rule, 'push', currentPrice)
      events.push(event)
      store.history.unshift(event)
    }

    rule.lastTriggeredAt = now
  }

  // Keep history manageable
  store.history = store.history.slice(0, 100)
  await writePriceAlertStore(store)

  return { currentPrice, events, rules: store.rules, history: store.history }
}

async function notifyAlert(rule: PriceAlertRule, channel: PriceAlertChannel, currentPrice: number) {
  const directionLabel = rule.direction === 'below' ? 'below' : 'above'
  const subject = `Aframp price alert: cNGN ${directionLabel} ${rule.threshold}`
  const message = `Your cNGN price alert has triggered.

Direction: ${rule.direction}
Threshold: ₦${rule.threshold.toLocaleString()}
Current cNGN price: ₦${currentPrice.toLocaleString()}
Channel: ${channel}

${rule.direction === 'below' ? 'The price has dropped below your configured threshold.' : 'The price has risen above your configured threshold.'}`

  if (channel === 'email') {
    await sendEmailNotification(rule.email, subject, message)
  } else {
    await sendPushNotification(message)
  }

  return {
    id: generateId(),
    ruleId: rule.id,
    asset: rule.asset,
    direction: rule.direction,
    threshold: rule.threshold,
    actualValue: currentPrice,
    channel,
    notifiedAt: Date.now(),
    message,
  }
}

export async function sendEmailNotification(email: string, subject: string, body: string) {
  console.warn('Sending price alert email to:', email)
  console.warn('Subject:', subject)
  console.warn(body)
  return Promise.resolve()
}

export async function sendPushNotification(message: string) {
  console.warn('Sending price alert push notification:')
  console.warn(message)
  return Promise.resolve()
}

async function getCngnPrice() {
  if (process.env.CNGN_ALERT_PRICE) {
    const value = Number(process.env.CNGN_ALERT_PRICE)
    if (!Number.isNaN(value)) {
      return value
    }
  }

  // Simulate a live cNGN feed with mild volatility around ₦1,120.
  const basePrice = 1120
  const swing = Math.cos(Date.now() / 90_000) * 260
  return Math.round(basePrice + swing)
}
