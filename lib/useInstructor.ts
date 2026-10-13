'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuthGate } from './useAuthGate'

type InstructorGate =
  | { status: 'loading' }
  | { status: 'denied'; message: string }
  | { status: 'ready'; instructorId: string; userId: string }

/** Signed-in instructor's `instructors.id`, or a denied state for other accounts. */
export function useInstructor(): InstructorGate {
  const gate = useAuthGate(['instructor'])
  const [result, setResult] = useState<InstructorGate>({ status: 'loading' })
  const userId = gate.status === 'ready' ? gate.userId : null

  useEffect(() => {
    if (!userId) return
    supabase
      .from('instructors')
      .select('id')
      .eq('profile_id', userId)
      .single()
      .then(({ data, error }) => {
        setResult(
          error || !data
            ? { status: 'denied', message: 'This account is not set up as an instructor yet. Ask an admin to finish setting you up.' }
            : { status: 'ready', instructorId: data.id, userId }
        )
      })
  }, [userId])

  if (gate.status === 'denied') return gate
  if (gate.status === 'loading') return { status: 'loading' }
  return result
}
