'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, MessageSquareQuote, Paintbrush, Users } from 'lucide-react'
import { useAuthGate } from '@/lib/useAuthGate'
import { Page, PageLoading, PageMessage } from '../components/ui/Page'
import { Tabs } from '../components/ui/Tabs'
import OverviewPanel from './_components/OverviewPanel'
import InstructorsPanel from './_components/InstructorsPanel'
import FeedbackPanel from './_components/FeedbackPanel'
import StudioPanel from './_components/StudioPanel'

type Tab = 'overview' | 'instructors' | 'feedback' | 'studio'
const TABS: Tab[] = ['overview', 'instructors', 'feedback', 'studio']

function AdminDashboard() {
  const gate = useAuthGate(['admin'])
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const requested = params.get('tab') as Tab | null
  const tab: Tab = requested && TABS.includes(requested) ? requested : 'overview'

  if (gate.status === 'denied') return <PageMessage title="Admins only">This account does not have admin access.</PageMessage>
  if (gate.status !== 'ready') return <PageLoading />

  // Keep the tab in the URL so refreshes and shared links land in the same place.
  const setTab = (t: Tab) => router.replace(t === 'overview' ? pathname : `${pathname}?tab=${t}`, { scroll: false })
  const token = gate.session.access_token

  return (
    <Page title="Admin" subtitle="Run the school: bookings, instructors, feedback and the site's look." width="xl">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'instructors', label: 'Instructors', icon: Users },
          { id: 'feedback', label: 'Feedback', icon: MessageSquareQuote },
          { id: 'studio', label: 'Studio', icon: Paintbrush },
        ]}
      />
      {tab === 'overview' && <OverviewPanel />}
      {tab === 'instructors' && <InstructorsPanel accessToken={token} />}
      {tab === 'feedback' && <FeedbackPanel />}
      {tab === 'studio' && <StudioPanel accessToken={token} />}
    </Page>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminDashboard />
    </Suspense>
  )
}
