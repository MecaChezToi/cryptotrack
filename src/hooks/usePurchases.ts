'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Purchase {
  id: string
  sym: string
  date: string
  amount: number
  price: number
  qty: number
  note: string
  created_at: string
}

export function usePurchases(sym: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('sym', sym)
      .order('date', { ascending: false })
    setPurchases(data || [])
    setLoading(false)
  }, [sym])

  useEffect(() => { load() }, [load])

  async function addPurchase(p: Omit<Purchase, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('purchases').insert({ ...p, user_id: user.id }).select().single()
    if (data) setPurchases(prev => [data, ...prev])
  }

  async function deletePurchase(id: string) {
    await supabase.from('purchases').delete().eq('id', id)
    setPurchases(prev => prev.filter(p => p.id !== id))
  }

  return { purchases, loading, addPurchase, deletePurchase, refetch: load }
}