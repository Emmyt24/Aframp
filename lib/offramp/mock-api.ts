export interface OfframpOrder {
  id: string
  sourceAsset: string
  sourceAmount: number
  fiatCurrency: string
  fiatAmount: number
  exchangeRate: number
  expiresAt: Date
  bankDetails: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  settlementAddress: string
  memo: string
  fees: {
    offrampFee: number
    networkFee: number
    bankFee: number
    total: number
  }
  status: 'awaiting_crypto' | 'processing' | 'completed' | 'failed'
}

export const MOCK_ORDER: OfframpOrder = {
  id: 'OFF-20260119-A1B2C3',
  sourceAsset: 'cNGN',
  sourceAmount: 50,
  fiatCurrency: 'NGN',
  fiatAmount: 79200,
  exchangeRate: 1584,
  expiresAt: new Date('2026-02-01T12:00:00Z'), // Stable date for hydration
  bankDetails: {
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'CHUKWUEMEKA OKAFOR',
  },
  settlementAddress: 'GAFRAMPSTAGINGWALLETADDRESS...XYZ123',
  memo: 'OFF-20260119-A1B2C3',
  fees: {
    offrampFee: 800,
    networkFee: 15,
    bankFee: 0,
    total: 815,
  },
  status: 'awaiting_crypto',
}

export async function createOfframpOrder(amount: number, asset: string): Promise<OfframpOrder> {
  const exchangeRate = await getExchangeRate(`${asset}-${MOCK_ORDER.fiatCurrency}`)
  const fiatAmount = Number((amount * exchangeRate).toFixed(2))
  const offrampFee = Number((fiatAmount * 0.01).toFixed(2))

  return {
    ...MOCK_ORDER,
    sourceAmount: amount,
    exchangeRate,
    fiatAmount,
    fees: {
      ...MOCK_ORDER.fees,
      offrampFee,
      total: offrampFee + MOCK_ORDER.fees.networkFee + MOCK_ORDER.fees.bankFee,
    },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }
}

// Fetches the live, spread-adjusted rate (locked for 15 minutes server-side).
export async function getExchangeRate(pair: string): Promise<number> {
  const response = await fetch(`/api/offramp/rate?pair=${encodeURIComponent(pair)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rate')
  }
  const data = await response.json()
  return data.rate
}
