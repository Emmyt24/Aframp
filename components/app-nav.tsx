'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowDownToLine, Banknote, Receipt, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/charge', label: 'Charge', icon: Banknote },
  { href: '/transactions', label: 'Payments', icon: Receipt },
  { href: '/withdraw', label: 'Cash out', icon: ArrowDownToLine },
  { href: '/wallet', label: 'Account', icon: Wallet },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
