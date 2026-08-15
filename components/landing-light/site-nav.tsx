import Link from 'next/link'

import { AframpMark } from '@/components/brand/aframp-mark'
import { nav } from '@/lib/landing-light-data'

export function SiteNav() {
  return (
    <div className="px-6 pt-6">
      <nav className="mx-auto flex max-w-5xl items-center gap-8 rounded-2xl bg-white px-5 py-3 shadow-sm">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <AframpMark className="size-7" />
          <span className="text-charcoal text-lg font-bold tracking-tight">Aframp</span>
        </Link>

        <ul className="text-charcoal ml-auto hidden items-center gap-7 text-sm md:flex">
          {nav.map(({ label, href }) => (
            <li key={label}>
              <a href={href} className="hover:text-brand">
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 md:ml-0">
          <Link
            href="/signup"
            className="bg-charcoal rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-brand rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Login
          </Link>
        </div>
      </nav>
    </div>
  )
}
