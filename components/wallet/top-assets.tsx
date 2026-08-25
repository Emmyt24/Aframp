import Link from 'next/link'
import { cn } from '@/lib/utils'
import { assets, formatPct, formatSigned, formatUsd } from '@/lib/wallet-data'

export function TopAssets() {
  return (
    <div>
      <p className="text-dim mb-2 text-xs">Top assets</p>
      <ul>
        {assets.map((a, i) => {
          const up = a.changePct >= 0
          return (
            <li key={a.name}>
              <Link
                href="/transactions"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                  i === 1 ? 'bg-raised' : 'hover:bg-raised/60'
                )}
              >
                <span
                  style={{ backgroundColor: a.tint }}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                >
                  {a.badge}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {a.name}{' '}
                    <span className="text-dim text-xs font-normal">
                      {a.symbol ? `${a.symbol} · ` : ''}
                      {a.holding}
                    </span>
                  </p>
                  <p className="text-dim text-xs">{formatUsd(a.usd)}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className={cn('text-sm font-bold', up ? 'text-white' : 'text-neg')}>
                    {formatPct(a.changePct)}
                  </p>
                  <p className={cn('text-xs', up ? 'text-pos' : 'text-neg')}>
                    {formatSigned(a.changeUsd)}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
