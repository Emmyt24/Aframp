/**
 * Mock data for the wallet dashboard, transcribed from
 * designs/Background.png. Swap for live wallet/market reads when the
 * multi-chain backend lands — the shapes below are what the UI expects.
 */

export type Asset = {
  name: string
  symbol: string
  /** Token amount, already formatted for display. */
  holding: string
  /** Fiat value in USD. */
  usd: number
  /** 24h move, percent. */
  changePct: number
  /** 24h move, USD. */
  changeUsd: number
  /** Badge letters and tint. */
  badge: string
  tint: string
}

export const wallet = {
  label: 'Trust Wallet',
  address: '0xf5ad...0DBC',
  network: 'ETH mainnet',
  count: 3,
}

export const balance = {
  total: 98230.02,
  trendPct: 12.3,
  trendWindow: '7d',
  available: 72430.5,
  inSwaps: 11320.12,
  bestAsset: 'BTC',
  bestAssetPct: 6.2,
}

/** Seven daily closes behind the "Balance trend" sparkline. */
export const trend = [82100, 79400, 88900, 96300, 92750, 89100, 98230]

export const assets: Asset[] = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    holding: '0.3243',
    usd: 21430.45,
    changePct: 3.23,
    changeUsd: 736.12,
    badge: 'B',
    tint: '#f7931a',
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    holding: '1.2580',
    usd: 19873.22,
    changePct: 1.85,
    changeUsd: 214.33,
    badge: 'N',
    tint: '#3b82f6',
  },
  {
    name: 'cNGN',
    symbol: '',
    holding: '2,450,000',
    usd: 1641.5,
    changePct: 12.5,
    changeUsd: 182.1,
    badge: 'CN',
    tint: '#f97316',
  },
  {
    name: 'Stellar',
    symbol: 'XLM',
    holding: '23,362',
    usd: 563.22,
    changePct: -1.32,
    changeUsd: -14.5,
    badge: 'S',
    tint: '#a855f7',
  },
]

export const swap = {
  from: { symbol: 'cNGN', badge: 'CN', tint: '#f97316', amount: '7,235.02', usd: 7235.02 },
  to: { symbol: 'USDT', badge: 'US', tint: '#3b82f6', amount: '24,230.02' },
  fromBalance: '23,253.32 cNGN',
  rate: '1 cNGN ≈ 0.0033 USDT',
  feePct: 0.15,
  feeAmount: '12.3 cNGN',
  settlement: '~34s',
}

export const activity = [
  { label: 'Swaps', value: '4 completed' },
  { label: 'Sent', value: '32,000 cNGN' },
  { label: 'Received', value: '0.0042 BTC' },
  { label: 'Gas spent', value: '$24.32' },
]

export const ethPrice = 3005.85

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export function formatUsd(value: number) {
  return usd.format(value)
}

export function formatSigned(value: number) {
  return `${value >= 0 ? '+' : '-'}${usd.format(Math.abs(value))}`
}

export function formatPct(value: number) {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`
}
