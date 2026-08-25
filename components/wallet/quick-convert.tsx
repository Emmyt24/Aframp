import Link from 'next/link'
import { ArrowRight, MoreHorizontal } from 'lucide-react'

import { formatUsd, swap, wallet } from '@/lib/wallet-data'

function Leg({
  side,
  meta,
  token,
  amount,
  footL,
  footR,
}: {
  side: string
  meta: string
  token: { symbol: string; badge: string; tint: string }
  amount: string
  footL?: string
  footR?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-dim text-xs">{side}</span>
        <span className="text-dim text-xs">{meta}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            style={{ backgroundColor: token.tint }}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
          >
            {token.badge}
          </span>
          <span className="text-sm font-bold text-white">{token.symbol}</span>
        </span>
        <span className="text-xl font-bold tracking-tight text-white tabular-nums">{amount}</span>
      </div>
      {(footL || footR) && (
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-dim text-xs">{footL}</span>
          <span className="text-dim text-xs">{footR}</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-dim text-xs">{label}</span>
      <span className="text-bright text-xs">{value}</span>
    </div>
  )
}

export function QuickConvert() {
  return (
    <section className="bg-panel border-hairline rounded-2xl border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dim text-xs">Swap</p>
          <h2 className="text-lg font-bold tracking-tight text-white">Quick convert</h2>
        </div>
        <button
          type="button"
          aria-label="Swap options"
          className="text-dim hover:text-bright transition-colors"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <Leg
          side="From"
          meta={`Balance: ${swap.fromBalance}`}
          token={swap.from}
          amount={swap.from.amount}
          footL={`≈ ${formatUsd(swap.from.usd)}`}
          footR="Max"
        />
        <Leg side="To" meta={`Wallet: ${wallet.address}`} token={swap.to} amount={swap.to.amount} />
        <Row label="Rate" value={swap.rate} />
      </div>

      <Link
        href="/charge"
        className="from-cta-from to-cta-to mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
      >
        Confirm swap
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </Link>

      <div className="mt-5 space-y-3">
        <Row label="Fee" value={`${swap.feePct}% · ${swap.feeAmount}`} />
        <Row label="Network" value={`${wallet.network} · ${swap.settlement}`} />
      </div>
    </section>
  )
}
