'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CRYPTOS } from './useCrypto'

export interface PortfolioRow {
  sym: string
  name: string
  color: string
  totalInv: number
  totalQty: number
  price: number
  curVal: number
  pnl: number
  pnlPct: number
}

export function usePortfolioOverview() {
  const [rows, setRows] = useState<PortfolioRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: purchases } = await supabase.from('purchases').select('sym, amount, qty').eq('user_id', user.id)

    // Agrège par symbole
    const bySym: Record<string, { totalInv: number, totalQty: number }> = {}
    ;(purchases || []).forEach(p => {
      if (!bySym[p.sym]) bySym[p.sym] = { totalInv: 0, totalQty: 0 }
      bySym[p.sym].totalInv += p.amount
      bySym[p.sym].totalQty += p.qty
    })

    const symsWithData = Object.keys(bySym)
    if (!symsWithData.length) { setRows([]); setLoading(false); return }

    // Récupère les prix live en un seul appel batch
    const ids = CRYPTOS.filter(c => symsWithData.includes(c.sym)).map(c => c.id)
    let prices: Record<string, number> = {}
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`)
      const data = await res.json()
      for (const c of CRYPTOS) {
        if (data[c.id]) prices[c.sym] = data[c.id].usd
      }
    } catch {}

    const result: PortfolioRow[] = symsWithData.map(sym => {
      const c = CRYPTOS.find(x => x.sym === sym)
      const { totalInv, totalQty } = bySym[sym]
      const price  = prices[sym] || 0
      const curVal = totalQty * price
      const pnl    = curVal - totalInv
      const pnlPct = totalInv ? (pnl / totalInv) * 100 : 0
      return { sym, name: c?.name || sym, color: c?.color || '#8b949e', totalInv, totalQty, price, curVal, pnl, pnlPct }
    }).sort((a, b) => b.curVal - a.curVal)

    setRows(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  return { rows, loading, refetch: load }
}
