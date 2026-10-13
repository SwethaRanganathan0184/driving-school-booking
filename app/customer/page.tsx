'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Briefcase, Languages, MapPin, Search, Users } from 'lucide-react'
import { useAuthGate } from '@/lib/useAuthGate'
import { fetchInstructors, type InstructorCard } from '@/lib/instructors'
import { useMotionProfile } from '@/lib/motion'
import InstructorAvatar from '../components/InstructorAvatar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Stars } from '../components/ui/Feedback'
import { EmptyState, Page, PageLoading } from '../components/ui/Page'

export default function CustomerHomePage() {
  const gate = useAuthGate()
  const m = useMotionProfile()
  const [instructors, setInstructors] = useState<InstructorCard[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (gate.status !== 'ready') return
    fetchInstructors().then(setInstructors)
  }, [gate.status])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!instructors || !q) return instructors ?? []
    return instructors.filter((i) =>
      [i.full_name, i.service_area ?? '', ...i.languages, ...i.specialties].some((v) => v.toLowerCase().includes(q))
    )
  }, [instructors, query])

  if (gate.status !== 'ready' || !instructors) return <PageLoading />

  return (
    <Page title="Choose your instructor" subtitle="Compare experience and student ratings, then book a slot that suits you." width="xl">
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, area, language…"
          aria-label="Search instructors"
          className="w-full rounded-[var(--radius)] border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={instructors.length ? 'No instructors match your search' : 'No instructors available yet'}>
          {instructors.length ? 'Try a different name, area or language.' : 'Check back soon. New instructors are being added.'}
        </EmptyState>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i, idx) => (
            <motion.li
              key={i.id}
              initial={m.enabled ? { opacity: 0, y: m.revealDistance } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: m.duration(0.45), delay: m.duration(Math.min(idx, 8) * 0.06) }}
            >
              <Card interactive className="h-full flex flex-col">
                <div className="flex items-center gap-4">
                  <InstructorAvatar name={i.full_name} url={i.photo_url} />
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-fg truncate">{i.full_name}</h2>
                    {i.rating !== null ? (
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <Stars value={i.rating} />
                        <span className="text-fg font-medium">{i.rating.toFixed(1)}</span>
                        <span className="text-muted">({i.review_count})</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted mt-1">New instructor · no reviews yet</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted mt-4 line-clamp-3 flex-1">{i.bio || 'No bio yet.'}</p>

                <ul className="mt-4 space-y-1.5 text-sm text-fg/80">
                  {i.experience_years !== null && (
                    <li className="flex items-center gap-2"><Briefcase className="size-4 text-accent" aria-hidden />{i.experience_years} yrs experience</li>
                  )}
                  {i.service_area && <li className="flex items-center gap-2"><MapPin className="size-4 text-accent" aria-hidden />{i.service_area}</li>}
                  {i.languages.length > 0 && (
                    <li className="flex items-center gap-2"><Languages className="size-4 text-accent" aria-hidden />{i.languages.join(', ')}</li>
                  )}
                </ul>

                {i.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {i.specialties.map((s) => (
                      <span key={s} className="text-xs rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-muted">{s}</span>
                    ))}
                  </div>
                )}

                <Button href={`/customer/instructor/${i.id}`} icon={ArrowRight} iconRight className="w-full mt-5">
                  Book a class
                </Button>
              </Card>
            </motion.li>
          ))}
        </ul>
      )}
    </Page>
  )
}
