'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePlan() {
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('subscriptions').select('plan').eq('user_id', data.user.id).single()
        .then(({ data: sub }) => {
          if (sub) setPlan(sub.plan as 'free' | 'pro')
          setLoading(false)
        })
    })
  }, [])

  return { plan, loading, isPro: plan === 'pro' }
}
