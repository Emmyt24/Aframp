import * as StellarSdk from '@stellar/stellar-sdk'
import type { FreighterNetwork } from '@/lib/wallet'

const { Asset, Networks, Operation, TransactionBuilder } = StellarSdk
// Server is accessed as a named export under the default namespace in the Stellar SDK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Server: new (url: string) => any = (StellarSdk as any).Horizon?.Server ?? (StellarSdk as any).Server

const HORIZON_PUBLIC = 'https://horizon.stellar.org'
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'

// Known issuers — override via NEXT_PUBLIC_ env vars
const ASSET_ISSUERS: Record<string, string> = {
  cNGN: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CNGN_ISSUER) || 'GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3TNFWQQE',
  USDC: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USDC_ISSUER) || 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  cKES: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CKES_ISSUER) || '',
  cGHS: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CGHS_ISSUER) || '',
}

export const SWAP_ASSETS = ['cNGN', 'USDC', 'XLM', 'cKES', 'cGHS'] as const
export type SwapAsset = (typeof SWAP_ASSETS)[number]

export interface SwapPath {
  path: StellarSdk.Asset[]
  sourceAmount: string
  destinationAmount: string
}

export interface SwapSimulation {
  fromAsset: SwapAsset
  toAsset: SwapAsset
  fromAmount: string
  toAmount: string
  /** Best path found by Stellar DEX path-finding */
  path: StellarSdk.Asset[]
  /** Minimum received after slippage */
  minReceived: string
  /** Effective exchange rate */
  rate: string
  /** Network fee in XLM stroops */
  fee: string
  slippagePct: number
}

function getAsset(code: SwapAsset): StellarSdk.Asset {
  if (code === 'XLM') return Asset.native()
  const issuer = ASSET_ISSUERS[code]
  if (!issuer) throw new Error(`Unknown issuer for ${code}`)
  return new Asset(code, issuer)
}

function getHorizon(network: FreighterNetwork | null) {
  return network === 'TESTNET' ? HORIZON_TESTNET : HORIZON_PUBLIC
}

/**
 * Find the optimal DEX route for a strict-send path payment.
 *
 * Queries Stellar Horizon's `/paths/strict-send` endpoint and returns all
 * candidate paths sorted by best (highest) destination amount first.
 *
 * This is the routing layer — call {@link simulateSwap} for a full quote
 * including slippage math, or call this directly when you need the raw paths.
 */
export async function findSwapPath(
  fromAsset: SwapAsset,
  toAsset: SwapAsset,
  fromAmount: string,
  network: FreighterNetwork | null
): Promise<SwapPath[]> {
  const horizonUrl = getHorizon(network)
  const src = getAsset(fromAsset)
  const dest = getAsset(toAsset)

  const params = new URLSearchParams({
    source_asset_type: src.isNative() ? 'native' : 'credit_alphanum4',
    ...(src.isNative() ? {} : { source_asset_code: src.getCode(), source_asset_issuer: src.getIssuer() }),
    source_amount: fromAmount,
    destination_asset_type: dest.isNative() ? 'native' : 'credit_alphanum4',
    ...(dest.isNative() ? {} : { destination_asset_code: dest.getCode(), destination_asset_issuer: dest.getIssuer() }),
  })

  const res = await fetch(`${horizonUrl}/paths/strict-send?${params}`)
  if (!res.ok) throw new Error(`Path-finding failed: ${res.status}`)

  const data = await res.json()
  const records: Array<{
    destination_amount: string
    source_amount: string
    path: Array<{ asset_type: string; asset_code?: string; asset_issuer?: string }>
  }> = data._embedded?.records ?? []

  if (records.length === 0) throw new Error('No swap path found for this pair')

  // Map to our SwapPath type and sort best (highest dest amount) first
  const paths: SwapPath[] = records.map((r) => ({
    sourceAmount: r.source_amount,
    destinationAmount: r.destination_amount,
    path: r.path.map((p) =>
      p.asset_type === 'native' ? Asset.native() : new Asset(p.asset_code!, p.asset_issuer!)
    ),
  }))

  paths.sort((a, b) => parseFloat(b.destinationAmount) - parseFloat(a.destinationAmount))

  return paths
}

/**
 * Simulate a swap using Stellar DEX strict-receive path payment.
 * Returns the best route and expected output — equivalent to 1inch/Jupiter quote.
 */
export async function simulateSwap(
  fromAsset: SwapAsset,
  toAsset: SwapAsset,
  fromAmount: string,
  slippagePct: number,
  network: FreighterNetwork | null
): Promise<SwapSimulation> {
  // Use findSwapPath to get the optimal DEX route
  const paths = await findSwapPath(fromAsset, toAsset, fromAmount, network)

  // Best path is first after sorting
  const best = paths[0]
  const toAmount = best.destinationAmount
  const minReceived = (parseFloat(toAmount) * (1 - slippagePct / 100)).toFixed(7)
  const rate = (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(7)

  return {
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    path: best.path,
    minReceived,
    rate,
    fee: '100', // base fee in stroops
    slippagePct,
  }
}

/**
 * Build a PathPaymentStrictSend XDR for signing via Freighter.
 * Uses the optimal path from simulateSwap / findSwapPath.
 */
export async function buildSwapXdr(
  sourcePublicKey: string,
  sim: SwapSimulation,
  network: FreighterNetwork | null
): Promise<string> {
  const horizonUrl = getHorizon(network)
  const server = new Server(horizonUrl)

  const sourceAccount = await server.loadAccount(sourcePublicKey)
  const fee = await server.fetchBaseFee()

  const sendAsset = getAsset(sim.fromAsset)
  const destAsset = getAsset(sim.toAsset)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: fee.toString(),
    networkPassphrase: network === 'TESTNET' ? Networks.TESTNET : Networks.PUBLIC,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: sim.fromAmount,
        destination: sourcePublicKey, // self-swap (swap to own wallet)
        destAsset,
        destMin: sim.minReceived,
        path: sim.path,
      })
    )
    .setTimeout(300)
    .build()

  return tx.toXDR()
}
