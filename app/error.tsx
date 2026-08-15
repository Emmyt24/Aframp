'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import ErrorLayout from '@/components/error/ErrorLayout'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <ErrorLayout
      title="Something went wrong"
      message="The page couldn't load. Try again, and if it keeps happening let us know."
      actions={[
        { label: 'Try again', onClick: reset },
        { label: 'Go home', href: '/' },
      ]}
    />
  )
}
