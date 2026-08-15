'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/session-provider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  const { session, ready } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return
    router.replace(session ? '/home' : '/login')
  }, [ready, session, router])

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <LoadingSpinner />
      <span className="sr-only">Loading Aframp Pay</span>
    </main>
  )
}
