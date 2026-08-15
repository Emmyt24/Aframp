import {
  Activity,
  ArrowLeftRight,
  LayoutGrid,
  LineChart,
  Settings2,
  ShieldCheck,
  Wallet as WalletIcon,
} from 'lucide-react'

import { AframpMark } from '@/components/brand/aframp-mark'
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
        <AframpMark className="size-8" />
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
