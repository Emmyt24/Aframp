'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppNav } from '@/components/app-nav'
import { useSession } from '@/components/session-provider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (ready && !session) router.replace('/login')
  }, [ready, session, router])

  // Children below assume a session exists; don't mount them until it does.
  if (!ready || !session) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <LoadingSpinner />
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-4">{children}</main>
      <AppNav />
    </div>
  )
}
