import { Home } from 'lucide-react'
import Button from './components/ui/Button'
import CarIcon from './components/CarIcon'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
      <div className="relative w-64 h-8 mb-6" aria-hidden>
        <div className="absolute top-1/2 inset-x-0 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--border)_0_14px,transparent_14px_24px)]" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 animate-fade-up">
          <CarIcon className="w-12 h-8 -rotate-12" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="font-display text-3xl font-bold text-fg mt-2">Wrong turn</h1>
      <p className="text-muted mt-2 max-w-sm">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Button href="/" className="mt-8">
        <Home className="size-4" aria-hidden />
        Back to the start
      </Button>
    </main>
  )
}
