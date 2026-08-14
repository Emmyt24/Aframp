import {
  Activity,
  ArrowLeftRight,
  LayoutGrid,
  LineChart,
  Settings2,
  ShieldCheck,
  Wallet as WalletIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { wallet } from '@/lib/wallet-data'

const main = [
  { label: 'Dashboard', icon: LayoutGrid, active: true },
  { label: 'Wallets', icon: WalletIcon },
  { label: 'Swaps', icon: ArrowLeftRight },
  { label: 'Markets', icon: LineChart },
]

const tools = [
  { label: 'Activity', icon: Activity },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Settings', icon: Settings2 },
]

function AframpMark() {
  return (
    <span className="bg-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
      {/* The Aframp mark: an "A" whose crossbar runs on as an arrow — the
          "flow of value" idea from the brand sheet. */}
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5.5 20 12 4.5 18.5 20" />
        <path d="M8.6 14.4h8.2" />
        <path d="M14.4 11.9l2.6 2.5-2.6 2.5" />
      </svg>
    </span>
  )
}

function NavGroup({
  title,
  items,
}: {
  title: string
  items: { label: string; icon: typeof LayoutGrid; active?: boolean }[]
}) {
  return (
    <div className="space-y-1">
      <p className="text-dim px-3 pb-2 text-[11px] font-bold tracking-[0.12em] uppercase">
        {title}
      </p>
      {items.map(({ label, icon: Icon, active }) => (
        <a
          key={label}
          href="#"
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
            active
              ? 'bg-nav-active font-bold text-white'
              : 'text-dim hover:bg-raised hover:text-bright'
          )}
        >
          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
          {label}
        </a>
      ))}
    </div>
  )
}

export function WalletSidebar() {
  return (
    <aside className="bg-rail border-hairline sticky top-0 flex h-dvh w-[260px] shrink-0 flex-col border-r p-4 pb-6">
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <AframpMark />
        <span className="text-xl font-bold tracking-tight text-white">Aframp</span>
      </div>
      <p className="text-dim mt-1.5 px-1 text-xs">Multi-chain wallet</p>

      <nav className="mt-8 space-y-7">
        <NavGroup title="Main" items={main} />
        <NavGroup title="Tools" items={tools} />
      </nav>

      <div className="mt-auto space-y-3">
        <p className="bg-raised text-dim rounded-md px-3 py-1.5 text-xs">
          {wallet.network} · {wallet.count} wallets
        </p>
        <p className="text-dim px-1 text-xs">Secure. Non-custodial. Always on.</p>
      </div>
    </aside>
  )
}
