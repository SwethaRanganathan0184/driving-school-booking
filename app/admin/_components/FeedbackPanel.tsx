'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { MessageSquareQuote, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useMotionProfile } from '@/lib/motion'
import Card from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/Dialog'
import { Alert, Stars } from '../../components/ui/Feedback'
import { EmptyState, PageLoading } from '../../components/ui/Page'

type Row = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  instructor_id: string
  customer_id: string
}

type Data = { rows: Row[]; customerNames: Record<string, string>; instructorNames: Record<string, string> }

/** Admin view of every review, including who wrote it (instructors only ever see these anonymously). */
async function fetchFeedback(): Promise<Data | { error: string }> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, rating, comment, created_at, instructor_id, customer_id')
    .order('created_at', { ascending: false })
  if (error) return { error: 'Feedback table not found. Run the latest SQL migration in Supabase.' }

  const rows = (data ?? []) as Row[]
  const { data: profiles } = await supabase.from('profiles').select('id, full_name')
  const { data: instructors } = await supabase.from('instructors').select('id, profile_id')
  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unnamed']))
  return {
    rows,
    customerNames: nameById,
    instructorNames: Object.fromEntries((instructors ?? []).map((i) => [i.id, nameById[i.profile_id] ?? 'Instructor'])),
  }
}

export default function FeedbackPanel() {
  const m = useMotionProfile()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [instructorFilter, setInstructorFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [busy, setBusy] = useState(false)

  const apply = useCallback((d: Data | { error: string }) => {
    if ('error' in d) {
      setError(d.error)
      setData({ rows: [], customerNames: {}, instructorNames: {} })
    } else setData(d)
  }, [])

  useEffect(() => {
    let active = true
    fetchFeedback().then((d) => active && apply(d))
    return () => {
      active = false
    }
  }, [apply])

  const filtered = useMemo(
    () =>
      (data?.rows ?? []).filter(
        (r) => (instructorFilter === 'all' || r.instructor_id === instructorFilter) && (ratingFilter === 'all' || r.rating === Number(ratingFilter))
      ),
    [data, instructorFilter, ratingFilter]
  )

  const handleDelete = async () => {
    if (!deleting) return
    setBusy(true)
    const { error: e } = await supabase.from('feedback').delete().eq('id', deleting.id)
    setBusy(false)
    setDeleting(null)
    if (e) setError(e.message)
    else apply(await fetchFeedback())
  }

  if (!data) return <PageLoading />

  const instructorOptions = Object.entries(data.instructorNames).filter(([id]) => data.rows.some((r) => r.instructor_id === id))
  const avg = filtered.length ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length : null
  const select = 'rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:border-accent'

  return (
    <div>
      <Alert>{error}</Alert>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)} aria-label="Filter by instructor" className={select}>
          <option value="all">All instructors</option>
          {instructorOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} aria-label="Filter by rating" className={select}>
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        {avg !== null && (
          <span className="ml-auto flex items-center gap-2 text-sm text-muted">
            <Stars value={avg} /> {avg.toFixed(1)} average · {filtered.length} review{filtered.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No feedback yet">Students can rate lessons once instructors mark them completed.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r, i) => (
            <motion.li key={r.id} initial={m.enabled ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: m.duration(Math.min(i, 10) * 0.04) }}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} />
                      <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      <span className="text-fg font-medium">{data.customerNames[r.customer_id] ?? 'Unknown student'}</span> rated{' '}
                      <span className="text-fg font-medium">{data.instructorNames[r.instructor_id] ?? 'Instructor'}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleting(r)}
                    className="p-2 rounded-[var(--radius)] text-muted hover:text-danger hover:bg-danger/10 cursor-pointer"
                    aria-label="Delete this feedback"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {r.comment && <p className="text-fg mt-3">&ldquo;{r.comment}&rdquo;</p>}
              </Card>
            </motion.li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this feedback?"
        message="It will be removed from the instructor's rating and the public reviews. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
