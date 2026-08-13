import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        That page doesn&apos;t exist, or it moved.
      </p>
      <Button asChild>
        <Link href="/">Back to start</Link>
      </Button>
    </main>
  )
}
