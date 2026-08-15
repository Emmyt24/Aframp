'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Action {
  label: string
  href?: string
  onClick?: () => void
}

interface ErrorLayoutProps {
  title: string
  message: string
  status?: number
  actions: Action[]
}

export default function ErrorLayout({ title, message, status, actions }: ErrorLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-sm space-y-5 text-center">
        {status && (
          <p className="font-heading text-muted-foreground text-4xl font-semibold tabular-nums">
            {status}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>

        <div className="flex justify-center gap-3">
          {actions.map((action, index) =>
            action.href ? (
              // Primary is a light mint; text-white on it fails contrast, so the
              // Button component's own token pairing is used instead.
              <Button key={action.label} asChild variant={index === 0 ? 'default' : 'outline'}>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button
                key={action.label}
                variant={index === 0 ? 'default' : 'outline'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      </div>
    </main>
  )
}
