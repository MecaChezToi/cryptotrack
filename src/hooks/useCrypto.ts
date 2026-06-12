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

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCache(key: string): any | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCache(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

export function useCrypto(cryptoId: string) {
  const [data, setData] = useState<CryptoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const crypto = CRYPTOS.find(c => c.id === cryptoId) || CRYPTOS[0]

  const fetch7d = useCallback(async () => {
    const cacheKey = `crypto7d_${cryptoId}`
    const cached = getCache(cacheKey)
    if (cached) return cached
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=7`)
      const d = await r.json()
      const prices = (d.prices as number[][]).map(p => p[1])
      if (prices.length) setCache(cacheKey, prices)
      return prices
    } catch { return [] }
  }, [cryptoId])

  const fetchData = useCallback(async (force = false) => {
    const cacheKey = `crypto_${cryptoId}`

    if (!force) {
      const cached = getCache(cacheKey)
      if (cached) {
        setData({ ...crypto, ...cached })
        setLoading(false)
        setError(null)
        return
      }
    }

    try {
      setLoading(true)
      const [coinRes, price7d] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}?localization=false&tickers=false&community_data=false&developer_data=false`),
        fetch7d()
      ])
      if (!coinRes.ok) throw new Error('API error')
      const coin = await coinRes.json()
      const md = coin.market_data
      const fresh = {
        price:     md.current_price.usd,
        change24h: md.price_change_percentage_24h || 0,
        change7d:  md.price_change_percentage_7d  || 0,
        change30d: md.price_change_percentage_30d || 0,
        price7d,
      }
      setCache(cacheKey, fresh)
      setData({ ...crypto, ...fresh })
      setError(null)
    } catch (e) {
      // En cas d'erreur (rate limit), garde les données en cache même expirées
      const stale = getCache(cacheKey)
      if (stale) {
        setData({ ...crypto, ...stale })
        setError(null)
      } else {
        setError('Erreur API CoinGecko')
      }
    } finally {
      setLoading(false)
    }
  }, [cryptoId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), CACHE_TTL)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: () => fetchData(true) }
}
