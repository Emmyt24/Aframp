import { Moon, RefreshCw } from 'lucide-react'

import { ActivityHighlights } from '@/components/wallet/activity-highlights'
import { BalanceTrend } from '@/components/wallet/balance-trend'
import { QuickActions } from '@/components/wallet/quick-actions'
import { QuickConvert } from '@/components/wallet/quick-convert'
import { TopAssets } from '@/components/wallet/top-assets'
import { WalletSidebar } from '@/components/wallet/wallet-sidebar'
import { balance, ethPrice, formatUsd, wallet } from '@/lib/wallet-data'

export const metadata = {
  title: 'Wallet overview — Aframp',
  description: 'Track balances, market moves and execute swaps in one clean view.',
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel border-hairline rounded-xl border px-4 py-3">
      <p className="text-dim text-xs">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight text-white tabular-nums">{value}</p>
    </div>
  )
}

export default function WalletOverviewPage() {
  return (
    <div className="bg-ink font-brand flex min-h-dvh text-white">
      <WalletSidebar />

      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wallet overview</h1>
            <p className="text-dim mt-1 text-sm">
              Track balances, market moves and execute swaps in one clean view.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-raised border-hairline text-bright flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
              ETH · {formatUsd(ethPrice)}
              <RefreshCw className="text-dim size-3.5" />
            </span>
            <button
              type="button"
              aria-label="Toggle theme"
              className="text-dim hover:text-bright transition-colors"
            >
              <Moon className="size-5" />
            </button>
            <span className="bg-brand-deep text-pos flex size-9 items-center justify-center rounded-full text-xs font-bold">
              AO
            </span>
          </div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="bg-panel border-hairline rounded-2xl border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-dim text-xs">Total Balance</p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                  {formatUsd(balance.total)}
                </p>
              </div>
              <span className="text-pos shrink-0 rounded-md bg-[#0c2010] px-2 py-1 text-xs font-bold">
                +{balance.trendPct}% · {balance.trendWindow}
              </span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-dim text-xs">Current wallet</p>
                <p className="mt-1 text-sm font-bold">
                  {wallet.label} · {wallet.address}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stat label="Available" value={formatUsd(balance.available)} />
                  <Stat label="In swaps" value={formatUsd(balance.inSwaps)} />
                </div>
                <div className="mt-3">
                  <Stat
                    label="Best asset"
                    value={`${balance.bestAsset} · +${balance.bestAssetPct}%`}
                  />
                </div>
              </div>

              <div>
                <p className="text-dim text-xs">Balance trend · Last 7 days</p>
                <div className="border-hairline mt-2 overflow-hidden rounded-xl border">
                  <BalanceTrend />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <QuickActions />
            </div>

            <div className="mt-6">
              <TopAssets />
            </div>
          </section>

          <div className="space-y-5">
            <QuickConvert />
            <ActivityHighlights />
          </div>
        </div>
      </main>
    </div>
  )
}
