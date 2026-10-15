'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { EyeOff, MessageSquareQuote } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useInstructor } from '@/lib/useInstructor'
import { useMotionProfile } from '@/lib/motion'
import Card from '../../components/ui/Card'
import { Alert, Stars } from '../../components/ui/Feedback'
import { EmptyState, Page, PageLoading, PageMessage } from '../../components/ui/Page'

type Item = { id: string; rating: number; comment: string | null; created_at: string }

export default function InstructorFeedbackPage() {
  const inst = useInstructor()
  const m = useMotionProfile()
  const instructorId = inst.status === 'ready' ? inst.instructorId : null
  const [items, setItems] = useState<Item[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!instructorId) return
    // The view has no customer column, so feedback stays anonymous even at the API level.
    supabase
      .from('instructor_feedback')
      .select('id, rating, comment, created_at')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError('Feedback is not available yet. An admin needs to run the latest database migration.')
        setItems((data ?? []) as Item[])
      })
  }, [instructorId])

  if (inst.status === 'denied') return <PageMessage title="Instructor area">{inst.message}</PageMessage>
  if (inst.status !== 'ready' || !items) return <PageLoading />

  const total = items.length
  const avg = total ? items.reduce((s, i) => s + i.rating, 0) / total : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: items.filter((i) => i.rating === n).length }))

  return (
    <Page
      title="Student feedback"
      subtitle={<span className="inline-flex items-center gap-1.5"><EyeOff className="size-4" aria-hidden />Anonymous: you see ratings and comments, never who wrote them.</span>}
      width="md"
    >
      <Alert>{error}</Alert>
      {total === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No feedback yet">Students can rate a lesson once you mark it completed.</EmptyState>
      ) : (
        <>
          <Card className="mb-6 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="text-center sm:pr-6 sm:border-r border-border">
              <p className="font-display text-4xl font-bold text-fg tabular-nums">{avg.toFixed(1)}</p>
              <Stars value={avg} size="md" />
              <p className="text-sm text-muted mt-1">{total} review{total === 1 ? '' : 's'}</p>
            </div>
            <ul className="space-y-1.5">
              {dist.map(({ n, count }) => (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-muted tabular-nums">{n}★</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      initial={m.enabled ? { width: 0 } : false}
                      animate={{ width: `${(count / total) * 100}%` }}
                      transition={{ duration: m.duration(0.8), delay: m.duration((5 - n) * 0.06) }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </Card>

          <ul className="space-y-3">
            {items.map((f, i) => (
              <motion.li
                key={f.id}
                initial={m.enabled ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: m.duration(Math.min(i, 8) * 0.05) }}
              >
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <Stars value={f.rating} />
                    <time className="text-xs text-muted" dateTime={f.created_at}>{new Date(f.created_at).toLocaleDateString()}</time>
                  </div>
                  <p className={`mt-2 ${f.comment ? 'text-fg' : 'text-muted italic'}`}>{f.comment || 'No comment left.'}</p>
                </Card>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </Page>
  )
}
