'use client'
import { useState, useEffect, useCallback } from 'react'

export const CRYPTOS = [
  { id:'bitcoin',      sym:'BTC',  name:'Bitcoin',     color:'#f7931a' },
  { id:'ethereum',     sym:'ETH',  name:'Ethereum',    color:'#627eea' },
  { id:'solana',       sym:'SOL',  name:'Solana',      color:'#9945ff' },
  { id:'binancecoin',  sym:'BNB',  name:'BNB',         color:'#f3ba2f' },
  { id:'ripple',       sym:'XRP',  name:'XRP',         color:'#346aa9' },
  { id:'sui',          sym:'SUI',  name:'Sui',         color:'#4da2ff' },
  { id:'ondo-finance', sym:'ONDO', name:'Ondo',        color:'#1a56db' },
  { id:'hyperliquid',  sym:'HYPE', name:'Hyperliquid', color:'#00ff85' },
]

export interface CryptoData {
  id: string
  sym: string
  name: string
  color: string
  price: number
  change24h: number
  change7d: number
  change30d: number
  price7d: number[]
}

export function useCrypto(cryptoId: string) {
  const [data, setData] = useState<CryptoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const crypto = CRYPTOS.find(c => c.id === cryptoId) || CRYPTOS[0]

  const fetch7d = useCallback(async () => {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=7`)
      const d = await r.json()
      return (d.prices as number[][]).map(p => p[1])
    } catch { return [] }
  }, [cryptoId])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [coinRes, price7d] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}?localization=false&tickers=false&community_data=false&developer_data=false`),
        fetch7d()
      ])
      if (!coinRes.ok) throw new Error('API error')
      const coin = await coinRes.json()
      const md = coin.market_data
      setData({
        ...crypto,
        price:     md.current_price.usd,
        change24h: md.price_change_percentage_24h || 0,
        change7d:  md.price_change_percentage_7d  || 0,
        change30d: md.price_change_percentage_30d || 0,
        price7d,
      })
      setError(null)
    } catch (e) {
      setError('Erreur API CoinGecko')
    } finally {
      setLoading(false)
    }
  }, [cryptoId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}