'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, Gauge, MapPinned, Minus, Plus, ShieldCheck, UserCheck, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useMotionProfile } from '@/lib/motion'
import { useSiteTheme } from '../ThemeProvider'
import Reveal from '../Reveal'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Stars } from '../ui/Feedback'
import SteeringWheel from './SteeringWheel'

export function Hero() {
  const { settings } = useSiteTheme()
  const m = useMotionProfile()

  return (
    <section className="relative px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <motion.h1
            initial={m.enabled ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.5), ease: 'easeOut' }}
            className="font-display font-bold tracking-tight text-fg text-4xl sm:text-5xl leading-[1.1] text-balance"
          >
            {settings.tagline}
          </motion.h1>

          <motion.p
            initial={m.enabled ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.5), delay: m.duration(0.1) }}
            className="text-lg text-muted max-w-xl mt-5"
          >
            Book lessons with a real instructor in your own car. Pick a slot that works, learn at your own pace, and
            pay only after each class.
          </motion.p>

          <motion.div
            initial={m.enabled ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.5), delay: m.duration(0.15) }}
            className="flex flex-col sm:flex-row gap-3 mt-8"
          >
            <Button size="lg" href="/signup" icon={ArrowRight} iconRight>
              Get started
            </Button>
            <Button size="lg" variant="secondary" href="/customer">
              Find an instructor
            </Button>
          </motion.div>

          <motion.dl
            initial={m.enabled ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: m.duration(0.5), delay: m.duration(0.25) }}
            className="grid grid-cols-3 gap-6 mt-12 pt-6 border-t border-border max-w-md"
          >
            {[
              ['1 hr', 'per lesson'],
              [`₹${settings.pricePerClass}`, 'per class'],
              ['₹0', 'paid upfront'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-xl font-semibold text-fg tabular-nums">{value}</dd>
                <dd className="text-xs text-muted">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <SteeringWheel className="hidden sm:block w-72 lg:w-full max-w-sm mx-auto aspect-square" />
      </div>
    </section>
  )
}

const FEATURES = [
  { icon: MapPinned, title: 'Real roads, real confidence', body: "Practise on the streets you'll drive every day, not a closed course." },
  { icon: CalendarClock, title: 'Flexible timings', body: 'Morning and evening slots, so lessons fit around your day.' },
  { icon: Wallet, title: 'Pay after each class', body: "No upfront payment. Settle up in person once you've had the lesson." },
  { icon: Gauge, title: 'Learn at your pace', body: 'Try a single class, or commit to a 10-class package.' },
  { icon: UserCheck, title: 'Personal attention', body: 'Small enough that your instructor actually knows you.' },
  { icon: ShieldCheck, title: 'Transparent pricing', body: 'One simple rate per class. No hidden fees, no surprises.' },
]

export function Features() {
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <SectionHeading title="Built around how people actually learn" />
        <Reveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <h3 className="font-semibold text-fg flex items-center gap-2">
                <Icon className="size-4 text-accent shrink-0" aria-hidden />
                {title}
              </h3>
              <p className="text-muted mt-1.5 leading-relaxed">{body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

export function Pricing() {
  const { settings } = useSiteTheme()
  const price = settings.pricePerClass
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <SectionHeading title="Pricing" subtitle="One hour per class. You only pay for lessons you've taken." />
        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl">
          <Reveal>
            <Card className="h-full p-7">
              <h3 className="font-display font-bold text-fg text-lg">Single class</h3>
              <p className="text-muted mt-1">Try a lesson before committing.</p>
              <p className="font-display text-4xl font-bold text-fg mt-6 tabular-nums">₹{price.toLocaleString('en-IN')}</p>
              <p className="text-sm text-muted mt-1">paid after the class</p>
              <Button variant="secondary" href="/signup" className="w-full mt-7">
                Book a class
              </Button>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="h-full p-7 border-accent/60">
                <h3 className="font-display font-bold text-fg text-lg flex items-center justify-between gap-3">
                  10-class package
                  <span className="text-xs font-medium text-accent">Most chosen</span>
                </h3>
                <p className="text-muted mt-1">Best value if you&apos;re ready to commit.</p>
                <p className="font-display text-4xl font-bold text-fg mt-6 tabular-nums">₹{(price * 10).toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted mt-1">paid after all 10, or only for classes taken if you stop early</p>
                <Button href="/signup" className="w-full mt-7">
                  Start the package
                </Button>
              </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

type Review = { id: string; rating: number; comment: string }

/** Real, anonymous student reviews. Hidden entirely until there are some, so nothing fabricated is ever shown. */
export function Testimonials() {
  const m = useMotionProfile()
  const [reviews, setReviews] = useState<Review[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    supabase
      .from('public_reviews')
      .select('id, rating, comment')
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setReviews((data ?? []) as Review[]))
  }, [])

  useEffect(() => {
    if (reviews.length < 2 || !m.enabled) return
    const t = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 6000)
    return () => clearInterval(t)
  }, [reviews.length, m.enabled])

  if (reviews.length === 0) return null
  const review = reviews[index % reviews.length]
  const go = (d: number) => setIndex((i) => (i + d + reviews.length) % reviews.length)

  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <SectionHeading title="What students say" />
        <Reveal className="max-w-3xl">
          <Card className="relative p-8 sm:p-10 min-h-[200px] flex flex-col justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.figure
                key={review.id}
                initial={m.enabled ? { opacity: 0, x: 30 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={m.enabled ? { opacity: 0, x: -30 } : undefined}
                transition={{ duration: m.duration(0.35) }}
              >
                <Stars value={review.rating} size="md" />
                <blockquote className="text-lg text-fg leading-relaxed mt-4">&ldquo;{review.comment}&rdquo;</blockquote>
                <figcaption className="text-sm text-muted mt-4">Verified student</figcaption>
              </motion.figure>
            </AnimatePresence>
          </Card>
          {reviews.length > 1 && (
            <div className="flex items-center gap-3 mt-5">
              <button type="button" onClick={() => go(-1)} className="p-2 rounded-full text-muted hover:text-fg hover:bg-surface-2 cursor-pointer" aria-label="Previous review">
                <ChevronLeft className="size-4" />
              </button>
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show review ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index % reviews.length ? 'w-6 bg-accent' : 'w-1.5 bg-border'}`}
                />
              ))}
              <button type="button" onClick={() => go(1)} className="p-2 rounded-full text-muted hover:text-fg hover:bg-surface-2 cursor-pointer" aria-label="Next review">
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}

const FAQ = [
  {
    q: 'How do I pay for classes?',
    a: 'Payment is collected in person after each class. A single class is billed right away; a 10-class package is billed once all 10 are complete (or pro-rated if you cancel partway through).',
  },
  {
    q: 'Can I cancel a 10-class package partway through?',
    a: "Yes. You only pay for the classes you've actually completed. Remaining classes are cancelled with nothing owed.",
  },
  {
    q: 'Can I choose my instructor?',
    a: 'Yes. Browse instructors, their experience and student ratings, then book with whoever suits you.',
  },
  {
    q: 'Do I need my own vehicle?',
    a: "Yes. Lessons happen in your own car, so you'll add its make, model and transmission before your first booking.",
  },
]

export function Faq() {
  const m = useMotionProfile()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <SectionHeading title="Common questions" />
        <Reveal className="border-t border-border max-w-3xl">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left py-5 font-medium text-fg cursor-pointer"
                >
                  {item.q}
                  {isOpen ? <Minus className="size-4 text-muted shrink-0" aria-hidden /> : <Plus className="size-4 text-muted shrink-0" aria-hidden />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={m.enabled ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={m.enabled ? { height: 0, opacity: 0 } : undefined}
                      transition={{ duration: m.duration(0.3) }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-muted leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

export function CallToAction() {
  return (
    <section className="px-4 sm:px-6 py-20">
      <Reveal className="max-w-6xl mx-auto">
        <div className="rounded-[var(--radius)] border border-border bg-surface px-6 py-10 sm:px-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">Ready to book your first lesson?</h2>
            <p className="text-muted mt-2 max-w-lg">Creating an account is free, and you pay nothing until after your class.</p>
          </div>
          <div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button size="lg" href="/signup">
                Create an account
              </Button>
              <Button size="lg" variant="ghost" href="/login">
                Log in
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function SectionHeading({ title, subtitle, id }: { title: string; subtitle?: string; id?: string }) {
  return (
    <Reveal className="mb-10">
      <h2 id={id} className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">{title}</h2>
      {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
    </Reveal>
  )
}
