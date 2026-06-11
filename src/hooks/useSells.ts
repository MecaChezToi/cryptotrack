'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Sell {
  id: string
  sym: string
  date: string
  sell_price: number
  qty_sold: number
  amount_invested: number
  profit: number
  roi: number
  note: string
  created_at: string
}

export function useSells(sym: string) {
  const [sells, setSells] = useState<Sell[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sells')
      .select('*')
      .eq('sym', sym)
      .order('date', { ascending: false })
    setSells(data || [])
    setLoading(false)
  }, [sym])

  useEffect(() => { load() }, [load])

  async function addSell(s: Omit<Sell, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('sells').insert({ ...s, user_id: user.id }).select().single()
    if (data) setSells(prev => [data, ...prev])
  }

  return { sells, loading, addSell, refetch: load }
}
