'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/session-provider'

/**
 * The landing page is the public front door, so it renders for everyone right
 * away. Merchants who already have a token are moved on to the app once
 * localStorage has been read.
 */
export function RedirectSignedIn({ to = '/home' }: { to?: string }) {
  const { session, ready } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (ready && session) router.replace(to)
  }, [ready, session, router, to])

  return null
}
