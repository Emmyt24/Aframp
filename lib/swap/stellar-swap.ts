import Server, { Asset, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk'
import type { FreighterNetwork } from '@/lib/wallet'
import { captureError, log } from '@/lib/observability'

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
  path: Asset[]
  sourceAmount: string
  destinationAmount: string
}

export interface SwapSimulation {
  fromAsset: SwapAsset
  toAsset: SwapAsset
  fromAmount: string
  toAmount: string
  /** Best path found by Stellar DEX path-finding */
  path: Asset[]
  /** Minimum received after slippage */
  minReceived: string
  /** Effective exchange rate */
  rate: string
  /** Network fee in XLM stroops */
  fee: string
  slippagePct: number
}

function getAsset(code: SwapAsset): Asset {
  if (code === 'XLM') return Asset.native()
  const issuer = ASSET_ISSUERS[code]
  if (!issuer) throw new Error(`Unknown issuer for ${code}`)
  return new Asset(code, issuer)
}

function getHorizon(network: FreighterNetwork | null) {
  return network === 'TESTNET' ? HORIZON_TESTNET : HORIZON_PUBLIC
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
  const horizonUrl = getHorizon(network)
  const src = getAsset(fromAsset)
  const dest = getAsset(toAsset)

  // Use Stellar's path-payment strict-send finder
  const params = new URLSearchParams({
    source_asset_type: src.isNative() ? 'native' : 'credit_alphanum4',
    ...(src.isNative() ? {} : { source_asset_code: src.getCode(), source_asset_issuer: src.getIssuer() }),
    source_amount: fromAmount,
    destination_asset_type: dest.isNative() ? 'native' : 'credit_alphanum4',
    ...(dest.isNative() ? {} : { destination_asset_code: dest.getCode(), destination_asset_issuer: dest.getIssuer() }),
  })

  try {
    const res = await fetch(`${horizonUrl}/paths/strict-send?${params}`)
    if (!res.ok) throw new Error(`Path-finding failed: ${res.status}`)

    const data = await res.json()
    const records: Array<{
      destination_amount: string
      path: Array<{ asset_type: string; asset_code?: string; asset_issuer?: string }>
    }> = data._embedded?.records ?? []

    if (records.length === 0) throw new Error('No swap path found for this pair')

    // Best path = highest destination amount
    const best = records.reduce((a, b) =>
      parseFloat(a.destination_amount) >= parseFloat(b.destination_amount) ? a : b
    )

    const toAmount = best.destination_amount
    const minReceived = (parseFloat(toAmount) * (1 - slippagePct / 100)).toFixed(7)
    const rate = (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(7)

    const path = best.path.map((p) =>
      p.asset_type === 'native' ? Asset.native() : new Asset(p.asset_code!, p.asset_issuer!)
    )

    log.info('stellar.swap.simulated', {
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      rate,
      network: network ?? 'PUBLIC',
    })

    return {
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      path,
      minReceived,
      rate,
      fee: '100', // base fee in stroops
      slippagePct,
    }
  } catch (err) {
    captureError(err, {
      tags: { domain: 'stellar', operation: 'swap-simulate' },
      extra: { fromAsset, toAsset, fromAmount, network: network ?? 'PUBLIC' },
    })
    log.error('stellar.swap.simulate.failed', {
      error: err instanceof Error ? err.message : String(err),
      fromAsset,
      toAsset,
      network: network ?? 'PUBLIC',
    })
    throw err
  }
}

/**
 * Build a path-payment strict-send XDR for signing via Freighter.
 */
export async function buildSwapXdr(
  sourcePublicKey: string,
  sim: SwapSimulation,
  network: FreighterNetwork | null
): Promise<string> {
  const horizonUrl = getHorizon(network)
  const server = new Server(horizonUrl)

  try {
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

    log.info('stellar.swap.xdr_built', {
      fromAsset: sim.fromAsset,
      toAsset: sim.toAsset,
      fromAmount: sim.fromAmount,
      network: network ?? 'PUBLIC',
    })

    return tx.toXDR()
  } catch (err) {
    captureError(err, {
      tags: { domain: 'stellar', operation: 'swap-build-xdr' },
      extra: {
        fromAsset: sim.fromAsset,
        toAsset: sim.toAsset,
        fromAmount: sim.fromAmount,
        network: network ?? 'PUBLIC',
      },
    })
    log.error('stellar.swap.xdr_build.failed', {
      error: err instanceof Error ? err.message : String(err),
      fromAsset: sim.fromAsset,
      toAsset: sim.toAsset,
    })
    throw err
  }
}
