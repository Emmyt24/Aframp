'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorState } from '@/components/ui/error-state'
import { api, type Balance, type Payment, type PaymentRequest } from '@/lib/api'
import { formatStroops } from '@/lib/money'
import { useAuthenticatedSession } from '@/components/session-provider'

function isToday(iso: string): boolean {
  const date = new Date(iso)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

/** Sums confirmed payments taken today, keyed by asset. */
function takingsToday(payments: Payment[]): Map<string, bigint> {
  const totals = new Map<string, bigint>()
  for (const payment of payments) {
    if (payment.status !== 'confirmed' || !isToday(payment.created_at)) continue
    totals.set(payment.asset, (totals.get(payment.asset) ?? 0n) + payment.amount_stroops)
  }
  return totals
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

export default function HomePage() {
  const { token } = useAuthenticatedSession()
  const [balances, setBalances] = useState<Balance[] | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [openRequests, setOpenRequests] = useState<PaymentRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setError(null)
      try {
        const [nextBalances, nextPayments, requests] = await Promise.all([
          api.getBalances(token, signal),
          api.listTransactions(token, 50, signal),
          api.listPaymentRequests(token, 20, signal),
        ])
        setBalances(nextBalances)
        setPayments(nextPayments)
        setOpenRequests(requests.filter((request) => request.status === 'pending'))
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause.message : 'Could not load your dashboard')
        setBalances([])
      }
    },
    [token]
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!balances) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  const today = takingsToday(payments)
  const recent = payments.slice(0, 4)
  const pendingTotal = balances.reduce((sum, balance) => sum + balance.pending, 0n)

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <h1 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Available to cash out
        </h1>
        {balances.length === 0 ? (
          <p className="font-display text-4xl font-semibold tracking-tight tabular-nums">
            0.00
            <span className="text-muted-foreground ml-2 text-base font-medium">XLM</span>
          </p>
        ) : (
          <ul className="space-y-1">
            {balances.map((balance) => (
              <li key={balance.asset} className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold tracking-tight tabular-nums">
                  {formatStroops(balance.available)}
                </span>
                <span className="text-muted-foreground text-base font-medium">{balance.asset}</span>
              </li>
            ))}
          </ul>
        )}
        {pendingTotal > 0n && (
          <p className="text-muted-foreground text-sm">
            {formatStroops(pendingTotal)} still confirming
          </p>
        )}
      </section>

      <Button asChild size="lg" className="h-14 text-base">
        <Link href="/charge">
          New charge <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>

      <section className="bg-muted/50 space-y-2 rounded-2xl p-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Taken today
        </h2>
        {today.size === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing yet today.</p>
        ) : (
          <ul className="space-y-1">
            {[...today].map(([asset, total]) => (
              <li key={asset} className="text-xl font-semibold tabular-nums">
                {formatStroops(total)} <span className="text-sm font-medium">{asset}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {openRequests.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            Waiting to be paid
          </h2>
          <ul className="divide-border divide-y">
            {openRequests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/request/${request.id}`}
                  className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3"
                >
                  <span className="font-medium tabular-nums">
                    {formatStroops(request.amount_stroops)} {request.asset}
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" aria-hidden />
                    Open
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              Recent
            </h2>
            <Link href="/transactions" className="text-primary text-sm hover:underline">
              See all
            </Link>
          </div>
          <ul className="divide-border divide-y">
            {recent.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-medium tabular-nums">
                  {formatStroops(payment.amount_stroops)} {payment.asset}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatTime(payment.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
