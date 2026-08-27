'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateIllustration } from '@/components/ui/empty-state-illustration'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, ApiError, type Balance, type Payment, type PaymentStatus } from '@/lib/api'
import { formatStroops } from '@/lib/money'
import { useAuthenticatedSession } from '@/components/session-provider'

const STATUS_FILTER_ALL = 'all'
const ASSET_FILTER_ALL = 'all'

/** Backend paginates by offset; this is both the initial page size and page size for "Load more". */
const PAGE_SIZE = 50

/**
 * Driven by NEXT_PUBLIC_STELLAR_NETWORK so receipt links keep working when the
 * backend points at mainnet Horizon instead of testnet. Defaults to testnet
 * when the env var is absent or set to anything other than `public`.
 */
const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'public' : 'testnet'
const EXPLORER_BASE = `https://stellar.expert/explorer/${STELLAR_NETWORK}/tx`

const STATUS_LABEL: Record<PaymentStatus, string> = {
  detected: 'Detected',
  verified: 'Verifying',
  confirmed: 'Paid',
  failed: 'Failed',
}

function statusVariant(status: PaymentStatus) {
  if (status === 'confirmed') return 'default' as const
  if (status === 'failed') return 'destructive' as const
  return 'secondary' as const
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CSV_HEADER = ['date', 'amount', 'asset', 'status', 'tx_hash', 'memo']

/** Quotes a field only when it contains a comma, quote, or newline — RFC 4180. */
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Payment records don't carry a memo (that lives on the payment *request*
 * that generated them, which isn't joined in here) — the column is emitted
 * for the accounting template's sake and left blank.
 */
function paymentsToCsv(payments: Payment[]): string {
  const rows = payments.map((payment) =>
    [
      payment.created_at,
      formatStroops(payment.amount_stroops),
      payment.asset,
      STATUS_LABEL[payment.status] ?? payment.status,
      payment.tx_hash,
      '',
    ]
      .map(csvField)
      .join(',')
  )
  return [CSV_HEADER.join(','), ...rows].join('\n')
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** `aframp-transactions-YYYY-MM-DD.csv`, using today's date. */
function exportFilename(): string {
  return `aframp-transactions-${new Date().toISOString().slice(0, 10)}.csv`
}

export default function TransactionsPage() {
  const { token } = useAuthenticatedSession()
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [balances, setBalances] = useState<Balance[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL)
  const [assetFilter, setAssetFilter] = useState<string>(ASSET_FILTER_ALL)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null)
      try {
        const [nextPayments, nextBalances] = await Promise.all([
          api.listTransactions(token, PAGE_SIZE, 0, signal),
          api.getBalances(token, signal),
        ])
        setPayments(nextPayments)
        setBalances(nextBalances)
        setHasMore(nextPayments.length === PAGE_SIZE)
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        if (cause instanceof ApiError && cause.status === 0) throw cause
        setError(cause instanceof Error ? cause.message : 'Could not load your payments')
      }
    },
    [token]
  )

  const loadMore = useCallback(async () => {
    if (!payments || loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const next = await api.listTransactions(token, PAGE_SIZE, payments.length)
      setPayments((current) => [...(current ?? []), ...next])
      setHasMore(next.length === PAGE_SIZE)
    } catch (cause) {
      setLoadMoreError(
        cause instanceof Error ? cause.message : 'Could not load more payments'
      )
    } finally {
      setLoadingMore(false)
    }
  }, [token, payments, loadingMore, hasMore])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const assets = useMemo(
    () => Array.from(new Set((payments ?? []).map((payment) => payment.asset))).sort(),
    [payments]
  )

  const filteredPayments = useMemo(() => {
    return (payments ?? []).filter((payment) => {
      if (statusFilter !== STATUS_FILTER_ALL && payment.status !== statusFilter) return false
      if (assetFilter !== ASSET_FILTER_ALL && payment.asset !== assetFilter) return false
      return true
    })
  }, [payments, statusFilter, assetFilter])

  function exportCsv() {
    downloadCsv(exportFilename(), paymentsToCsv(filteredPayments))
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!payments) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
                {Object.entries(STATUS_LABEL).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-28" aria-label="Filter by asset">
                <SelectValue placeholder="Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ASSET_FILTER_ALL}>All assets</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              disabled={filteredPayments.length === 0}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
          </div>
        </div>
        {balances.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {balances.map((balance) => (
              <li
                key={balance.asset}
                className="bg-panel border-hairline flex items-baseline justify-between rounded-2xl border px-4 py-3"
              >
                <span className="text-dim text-sm">{balance.asset} available</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatStroops(balance.available)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </header>

      {filteredPayments.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-12 text-center">
          <EmptyStateIllustration variant="empty" className="size-20" />
          <p className="text-dim text-sm">
            {payments.length === 0
              ? "No payments yet. Charge a customer and they'll show up here."
              : 'No payments match the current filters.'}
          </p>
        </div>
      ) : (
        <ul className="border-hairline mt-6 divide-y">
          {filteredPayments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 space-y-1">
                <p className="text-base font-bold tabular-nums text-white">
                  {formatStroops(payment.amount_stroops)} {payment.asset}
                </p>
                <p className="text-dim text-xs">
                  {formatWhen(payment.created_at)} ·{' '}
                  <a
                    href={`${EXPLORER_BASE}/${payment.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-bright underline underline-offset-2"
                  >
                    Receipt
                  </a>
                </p>
              </div>
              <Badge variant={statusVariant(payment.status)}>
                {STATUS_LABEL[payment.status] ?? payment.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {payments.length > 0 && hasMore && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {loadMoreError && <p className="text-destructive text-xs">{loadMoreError}</p>}
          <Button variant="secondary" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
