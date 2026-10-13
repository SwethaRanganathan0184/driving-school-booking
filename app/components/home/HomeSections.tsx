'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, BadgeIndianRupee, CalendarClock, ChevronLeft, ChevronRight, Gauge, MapPinned, Minus, Plus, Quote, ShieldCheck, Sparkles, UserCheck, Wallet } from 'lucide-react'
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
  const words = settings.tagline.split(' ')

  return (
    <section className="relative px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <motion.span
            initial={m.enabled ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.5) }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
          >
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            Now booking lessons
          </motion.span>

          <h1 className="font-display font-extrabold tracking-tight text-fg text-4xl sm:text-6xl leading-[1.05] mt-6">
            {words.map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                className={`inline-block mr-[0.25em] ${/wheel|road/i.test(w) ? 'text-accent' : ''}`}
                initial={m.enabled ? { opacity: 0, y: 24, filter: 'blur(6px)' } : false}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: m.duration(0.6), delay: m.duration(0.1 + i * 0.06), ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={m.enabled ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.6), delay: m.duration(0.45) }}
            className="text-lg text-muted max-w-xl mt-6"
          >
            Book lessons with a real instructor in your own car. Pick a slot that works, learn at your own pace, and
            pay only after each class.
          </motion.p>

          <motion.div
            initial={m.enabled ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.6), delay: m.duration(0.55) }}
            className="flex flex-col sm:flex-row gap-3 mt-9"
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
            transition={{ duration: m.duration(0.8), delay: m.duration(0.75) }}
            className="grid grid-cols-3 gap-4 mt-12 max-w-md"
          >
            {[
              ['1 hr', 'per lesson'],
              [`₹${settings.pricePerClass}`, 'per class'],
              ['₹0', 'paid upfront'],
            ].map(([value, label]) => (
              <div key={label} className="border-l-2 border-accent/60 pl-3">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-bold text-fg">{value}</dd>
                <dd className="text-xs text-muted">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <SteeringWheel className="w-64 sm:w-80 lg:w-full max-w-md mx-auto aspect-square" />
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
        <SectionHeading eyebrow="Why DriveWise" title="Built around how people actually learn" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.08}>
              <Card interactive className="h-full">
                <span className="grid place-items-center size-11 rounded-[var(--radius)] bg-accent/15 text-accent mb-4">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="font-display font-bold text-fg">{title}</h3>
                <p className="text-muted mt-1.5">{body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Pricing() {
  const { settings } = useSiteTheme()
  const price = settings.pricePerClass
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <SectionHeading eyebrow="Pricing" title="Simple, honest pricing" subtitle="One hour per class. You only pay for lessons you've taken." />
        <div className="grid sm:grid-cols-2 gap-5">
          <Reveal>
            <Card interactive className="h-full p-7">
              <h3 className="font-display font-bold text-fg text-lg">Single class</h3>
              <p className="text-muted mt-1">Try a lesson before committing.</p>
              <p className="font-display text-5xl font-extrabold text-fg mt-6">₹{price.toLocaleString('en-IN')}</p>
              <p className="text-sm text-muted mt-1">paid after the class</p>
              <Button variant="secondary" href="/signup" className="w-full mt-7">
                Book a class
              </Button>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative h-full rounded-[var(--radius)] p-px bg-gradient-to-br from-accent via-accent/30 to-accent/70">
              <Card interactive className="h-full p-7 border-transparent">
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-accent text-accent-fg text-xs font-semibold px-2.5 py-1">
                  <Sparkles className="size-3" aria-hidden /> Most popular
                </span>
                <h3 className="font-display font-bold text-fg text-lg">10-class package</h3>
                <p className="text-muted mt-1">Best value if you&apos;re ready to commit.</p>
                <p className="font-display text-5xl font-extrabold text-fg mt-6">₹{(price * 10).toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted mt-1">paid after all 10, or only for classes taken if you stop early</p>
                <Button href="/signup" icon={BadgeIndianRupee} className="w-full mt-7">
                  Start the package
                </Button>
              </Card>
            </div>
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
      <div className="max-w-3xl mx-auto">
        <SectionHeading eyebrow="Reviews" title="What students say" />
        <Reveal>
          <Card className="relative p-8 sm:p-10 text-center min-h-[220px] flex flex-col justify-center overflow-hidden">
            <Quote className="absolute top-5 left-5 size-10 text-accent/20" aria-hidden />
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
            <div className="flex items-center justify-center gap-3 mt-5">
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
      <div className="max-w-2xl mx-auto">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <Reveal className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className={`rounded-[var(--radius)] border bg-surface transition-colors ${isOpen ? 'border-accent/40' : 'border-border'}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left p-5 font-display font-semibold text-fg cursor-pointer"
                >
                  {item.q}
                  <span className="grid place-items-center size-7 rounded-full bg-surface-2 text-accent shrink-0">
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
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
                      <p className="px-5 pb-5 text-muted">{item.a}</p>
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
      <Reveal className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-accent/30 bg-surface px-6 py-14 sm:px-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_65%)]" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">Ready to take the wheel?</h2>
            <p className="text-muted mt-3 max-w-lg mx-auto">Create a free account and book your first lesson today. No payment until after your class.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button size="lg" href="/signup" icon={ArrowRight} iconRight>
                Create my account
              </Button>
              <Button size="lg" variant="ghost" href="/login">
                I already have an account
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <Reveal className="text-center mb-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-fg mt-3">{title}</h2>
      {subtitle && <p className="text-muted mt-3">{subtitle}</p>}
    </Reveal>
  )
}
