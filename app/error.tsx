'use client'

import { useEffect } from 'react'
import { Home, RotateCcw, TriangleAlert } from 'lucide-react'
import Button from './components/ui/Button'

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
      <TriangleAlert className="size-12 text-danger mb-4" aria-hidden />
      <h1 className="font-display text-2xl font-bold text-fg">Something went wrong</h1>
      <p className="text-muted mt-2 max-w-sm">An unexpected error occurred. Please try again. If it keeps happening, contact the school.</p>
      {error.digest && <p className="text-xs text-muted/70 mt-2 font-mono">Ref: {error.digest}</p>}
      <div className="flex gap-3 mt-8">
        <Button icon={RotateCcw} onClick={() => retry()}>Try again</Button>
        <Button variant="secondary" icon={Home} href="/">Home</Button>
      </div>
    </main>
  )
}
