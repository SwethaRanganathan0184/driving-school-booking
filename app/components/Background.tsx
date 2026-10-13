'use client'

import { useSiteTheme } from './ThemeProvider'

/** Subtle fixed backdrop chosen in the Studio: soft accent glow, faint grid, drifting lane markings, or none. */
export default function Background() {
  const { settings } = useSiteTheme()
  const style = settings.background
  if (style === 'none') return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {style === 'glow' && (
        <>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)] blur-2xl dw-drift" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[500px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_10%,transparent),transparent)] blur-2xl" />
        </>
      )}
      {style === 'grid' && (
        <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      )}
      {style === 'road' && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[min(1100px,100%)] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] opacity-60">
          <div className="absolute inset-y-0 left-0 w-px bg-border" />
          <div className="absolute inset-y-0 right-0 w-px bg-border" />
          <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,color-mix(in_oklab,var(--accent)_45%,transparent)_0_36px,transparent_36px_80px)] bg-[size:3px_80px] dw-lanes" />
        </div>
      )}
    </div>
  )
}
