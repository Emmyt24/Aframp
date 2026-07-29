import { Server, Asset, Memo, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk'
import { signTransactionWithFreighter } from '@/lib/wallet/freighter'
import type { FreighterNetwork } from '@/lib/wallet'

const HORIZON_URLS: Record<string, string> = {
  PUBLIC: 'https://horizon.stellar.org',
  TESTNET: 'https://horizon-testnet.stellar.org',
}

/** Validate a Stellar public key (G + 55 base32 chars). */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address)
}

/** Fetch the current base fee (stroops) from Horizon and return it in XLM. */
export async function estimateStellarFee(network: FreighterNetwork | null): Promise<string> {
  const url = HORIZON_URLS[network ?? 'PUBLIC'] ?? HORIZON_URLS.PUBLIC
  const server = new Server(url)
  const fee = await server.fetchBaseFee()
  // base fee is in stroops (1 XLM = 10_000_000 stroops)
  return (fee / 10_000_000).toFixed(7)
}

export interface SendP2PParams {
  sourcePublicKey: string
  destination: string
  amount: string
  assetCode: string
  assetIssuer?: string
  memo?: string
  network: FreighterNetwork | null
}

export interface SendP2PResult {
  txHash: string
  error?: string
}

/** Build, sign (via Freighter), and submit a P2P Stellar payment. */
export async function sendStellarP2P(params: SendP2PParams): Promise<SendP2PResult> {
  const { sourcePublicKey, destination, amount, assetCode, assetIssuer, memo, network } = params

  if (!isValidStellarAddress(destination)) {
    return { txHash: '', error: 'Invalid destination address' }
  }

  const horizonUrl = HORIZON_URLS[network ?? 'PUBLIC'] ?? HORIZON_URLS.PUBLIC
  const server = new Server(horizonUrl)
  const networkPassphrase = network === 'TESTNET' ? Networks.TESTNET : Networks.PUBLIC

  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey)
    const fee = await server.fetchBaseFee()

    const asset =
      assetCode === 'XLM' ? Asset.native() : new Asset(assetCode, assetIssuer ?? sourcePublicKey)

    const builder = new TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase,
    }).addOperation(Operation.payment({ destination, asset, amount }))

    if (memo?.trim()) {
      builder.addMemo(Memo.text(memo.trim().slice(0, 28)))
    }

    const tx = builder.setTimeout(300).build()
    const xdr = tx.toXDR()

    const signed = await signTransactionWithFreighter(xdr, network ?? 'PUBLIC', networkPassphrase)
    if (signed.error || !signed.signedTxXdr) {
      return { txHash: '', error: signed.error ?? 'Signing failed' }
    }

    const result = await server.submitTransaction(
      TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase)
    )

    return { txHash: result.hash }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Transaction failed'
    return { txHash: '', error: msg }
  }
}
