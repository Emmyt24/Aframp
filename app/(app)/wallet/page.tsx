'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ThemeToggle } from '@/components/theme-toggle'
import { api, ApiError, type Me, type Wallet } from '@/lib/api'
import { useSession, useAuthenticatedSession } from '@/components/session-provider'

export default function WalletPage() {
  const { token } = useAuthenticatedSession()
  const { signOut } = useSession()
  const router = useRouter()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // The JWT holds only ids, so identity comes from /me on every load.
      setMe(await api.getMe(token))
    } catch {
      // Non-fatal: the address below is the part that matters.
    }
    try {
      setWallet(await api.getWallet(token))
      setError(null)
    } catch (cause) {
      // 400 "no wallet created yet" is the expected state for a new merchant.
      if (cause instanceof ApiError && cause.status === 400) setWallet(null)
      else setError(cause instanceof Error ? cause.message : 'Could not load your account')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function createWallet() {
    setCreating(true)
    setError(null)
    try {
      setWallet(await api.createWallet(token))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not set up your address')
    } finally {
      setCreating(false)
    }
  }

  async function copyAddress() {
    if (!wallet) return
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display truncate text-2xl font-semibold tracking-tight">
            {me?.merchant_name ?? me?.name ?? 'Account'}
          </h1>
          {me?.email && <p className="text-muted-foreground truncate text-sm">{me.email}</p>}
        </div>
        <ThemeToggle />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {wallet ? (
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            Your payment address
          </h2>
          <p className="bg-muted/50 font-heading rounded-2xl p-4 text-xs break-all">
            {wallet.address}
          </p>
          <Button variant="outline" onClick={copyAddress} className="w-full">
            {copied ? (
              <>
                <Check className="size-4" aria-hidden /> Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden /> Copy address
              </>
            )}
          </Button>
          <p className="text-muted-foreground text-xs">
            Aframp keeps this address secure for you. Customers pay into it when they scan a
            charge — you never need to share it directly.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Set up your payment address</h2>
          <p className="text-muted-foreground text-sm">
            You need one before you can take your first payment. It only takes a moment.
          </p>
          <Button size="lg" className="w-full" disabled={creating} onClick={createWallet}>
            {creating ? 'Setting up…' : 'Create payment address'}
          </Button>
        </section>
      )}

      <Button
        variant="ghost"
        className="text-muted-foreground mt-auto"
        onClick={() => {
          signOut()
          router.replace('/login')
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
