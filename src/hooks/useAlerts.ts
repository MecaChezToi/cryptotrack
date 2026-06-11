'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Alert {
  id: string
  sym: string
  type: 'above' | 'below' | 'avg' | 'reminder'
  value: number
  label: string
  triggered: boolean
  created_at: string
}

export function useAlerts(sym: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('alerts').select('*').eq('sym', sym).order('created_at', { ascending: false })
    setAlerts(data || [])
  }, [sym])

  useEffect(() => { load() }, [load])

  async function addAlert(a: Omit<Alert, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('alerts').insert({ ...a, user_id: user.id }).select().single()
    if (data) setAlerts(prev => [data, ...prev])
  }

  async function deleteAlert(id: string) {
    await supabase.from('alerts').delete().eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  async function triggerAlert(id: string) {
    await supabase.from('alerts').update({ triggered: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, triggered: true } : a))
  }

  return { alerts, addAlert, deleteAlert, triggerAlert, refetch: load }
}