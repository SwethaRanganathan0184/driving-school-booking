'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { useMotionProfile } from '@/lib/motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110',
  secondary: 'bg-surface-2 text-fg border border-border hover:border-accent/60',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
}

const SIZES: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

const MotionLink = motion.create(Link)

type Props = {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  /** Place the icon after the label (e.g. arrows). */
  iconRight?: boolean
  loading?: boolean
  href?: string
  className?: string
  children: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight,
  loading,
  href,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  const m = useMotionProfile()
  const classes = `inline-flex items-center justify-center rounded-[var(--radius)] font-medium cursor-pointer select-none transition-[background-color,border-color,color,box-shadow,filter] duration-200 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`
  const motionProps = {
    whileHover: m.hover ? { scale: m.hoverScale } : undefined,
    whileTap: m.hover ? { scale: m.pressScale } : undefined,
    transition: m.spring,
  }

  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : !iconRight && Icon && <Icon className="size-4" aria-hidden />}
      {children}
      {!loading && iconRight && Icon && <Icon className="size-4" aria-hidden />}
    </>
  )

  if (href) {
    return (
      <MotionLink
        href={href}
        className={classes}
        onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        aria-label={rest['aria-label']}
        {...motionProps}
      >
        {content}
      </MotionLink>
    )
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...motionProps}
      {...(rest as object)}
    >
      {content}
    </motion.button>
  )
}
