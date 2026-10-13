'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, IndianRupee, Search, UserRound, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatSlot } from '@/lib/instructors'
import Card from '../../components/ui/Card'
import { Badge } from '../../components/ui/Feedback'
import { EmptyState, PageLoading } from '../../components/ui/Page'

type Profile = { id: string; full_name: string | null; role: string }

type AdminBookingRow = {
  id: string
  packageId: string
  slotStart: string
  bookingStatus: string
  customerName: string
  instructorName: string
  packageType: string
  paymentAmount: number | null
  paymentStatus: string | null
}

export default function OverviewPanel() {
  const [rows, setRows] = useState<AdminBookingRow[] | null>(null)
  const [counts, setCounts] = useState({ customers: 0, instructors: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role')
      const allProfiles = (data ?? []) as Profile[]
      setCounts({
        customers: allProfiles.filter((p) => p.role === 'customer').length,
        instructors: allProfiles.filter((p) => p.role === 'instructor').length,
      })

      const { data: bookingRows } = await supabase
        .from('bookings')
        .select('id, slot_start, status, package_id')
        .order('slot_start', { ascending: false })
      const bookings = bookingRows ?? []
      if (bookings.length === 0) {
        setRows([])
        return
      }

      const packageIds = [...new Set(bookings.map((b) => b.package_id))]
      const [{ data: packageRows }, { data: paymentRows }] = await Promise.all([
        supabase.from('packages').select('id, package_type, customer_id, instructor_id').in('id', packageIds),
        supabase.from('payments').select('package_id, amount, status').in('package_id', packageIds),
      ])
      const packageMap = Object.fromEntries((packageRows ?? []).map((p) => [p.id, p]))
      const paymentMap = Object.fromEntries((paymentRows ?? []).map((p) => [p.package_id, p]))

      const instructorIds = [...new Set((packageRows ?? []).map((p) => p.instructor_id))]
      const { data: instructorRows } = await supabase.from('instructors').select('id, profile_id').in('id', instructorIds)
      const instructorProfile = Object.fromEntries((instructorRows ?? []).map((i) => [i.id, i.profile_id]))
      const nameById = Object.fromEntries(allProfiles.map((p) => [p.id, p.full_name ?? 'Unnamed']))

      setRows(
        bookings.map((b) => {
          const pkg = packageMap[b.package_id]
          const payment = paymentMap[b.package_id]
          return {
            id: b.id,
            packageId: b.package_id,
            slotStart: b.slot_start,
            bookingStatus: b.status,
            customerName: pkg ? nameById[pkg.customer_id] ?? 'Unknown' : 'Unknown',
            instructorName: pkg ? nameById[instructorProfile[pkg.instructor_id]] ?? 'Unknown' : 'Unknown',
            packageType: pkg?.package_type === 'ten_pack' ? '10-class' : 'Single',
            paymentAmount: payment?.amount ?? null,
            paymentStatus: payment?.status ?? null,
          }
        })
      )
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) =>
        (status === 'all' || r.bookingStatus === status) &&
        (!q || r.customerName.toLowerCase().includes(q) || r.instructorName.toLowerCase().includes(q))
    )
  }, [rows, search, status])

  if (!rows) return <PageLoading />

  const upcoming = rows.filter((r) => r.bookingStatus === 'confirmed' && new Date(r.slotStart).getTime() > now).length
  // Payments are per package, and a package can have many bookings: count each pending payment once.
  const pendingTotal = Object.values(
    Object.fromEntries(rows.filter((r) => r.paymentStatus === 'pending').map((r) => [r.packageId, r.paymentAmount ?? 0]))
  ).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: UserRound, label: 'Students', value: counts.customers },
          { icon: Users, label: 'Instructors', value: counts.instructors },
          { icon: CalendarClock, label: 'Upcoming lessons', value: upcoming },
          { icon: IndianRupee, label: 'Pending payments', value: `₹${pendingTotal.toLocaleString('en-IN')}` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-4">
            <Icon className="size-4 text-accent mb-2" aria-hidden />
            <p className="font-display text-2xl font-bold text-fg">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or instructor…"
            aria-label="Search bookings"
            className="w-full rounded-[var(--radius)] border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-fg focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-sm text-fg focus:outline-none focus:border-accent"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No bookings found" />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-fg">{formatSlot(r.slotStart)}</td>
                  <td className="px-4 py-3 text-fg">{r.customerName}</td>
                  <td className="px-4 py-3 text-fg">{r.instructorName}</td>
                  <td className="px-4 py-3 text-muted">{r.packageType}</td>
                  <td className="px-4 py-3"><Badge status={r.bookingStatus} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.paymentAmount !== null ? <Badge status={r.paymentStatus ?? 'pending'}>₹{r.paymentAmount} · {r.paymentStatus}</Badge> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
