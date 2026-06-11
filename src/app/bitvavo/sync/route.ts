import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { api_key, api_secret } = await req.json()
    if (!api_key || !api_secret) return NextResponse.json({ error: 'Clés manquantes' }, { status: 400 })

    // Appel Bitvavo
    const timestamp = Date.now()
    const method = 'GET'
    const url = '/v2/trades'

    const crypto = await import('crypto')
    const message = timestamp + method + url
    const signature = crypto.createHmac('sha256', api_secret).update(message).digest('hex')

    // Récupère toutes les paires crypto/EUR
    const markets = ['BTC-EUR','ETH-EUR','SOL-EUR','BNB-EUR','XRP-EUR','SUI-EUR']
    const imported: any[] = []

    for (const market of markets) {
      const res = await fetch(`https://api.bitvavo.com/v2/${market}/trades?limit=100`, {
        headers: {
          'Bitvavo-Access-Key': api_key,
          'Bitvavo-Access-Signature': crypto.createHmac('sha256', api_secret).update(timestamp + method + `/v2/${market}/trades`).digest('hex'),
          'Bitvavo-Access-Timestamp': timestamp.toString(),
          'Bitvavo-Access-Window': '10000',
        }
      })

      if (!res.ok) continue
      const trades = await res.json()
      if (!Array.isArray(trades)) continue

      const sym = market.split('-')[0]

      for (const trade of trades) {
        if (trade.side !== 'buy') continue

        const date = new Date(trade.timestamp).toISOString().split('T')[0]
        const price  = parseFloat(trade.price)
        const qty    = parseFloat(trade.amount)
        const amount = price * qty

        // Vérifie si déjà importé (via note avec l'ID Bitvavo)
        const { data: existing } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('sym', sym)
          .eq('note', `bitvavo:${trade.id}`)
          .single()

        if (existing) continue

        await supabase.from('purchases').insert({
          user_id: user.id,
          sym,
          date,
          amount,
          price,
          qty,
          note: `bitvavo:${trade.id}`,
        })

        imported.push({ sym, date, amount, price, qty })
      }
    }

    // Sauvegarde les clés
    await supabase.from('api_keys').upsert({
      user_id: user.id,
      exchange: 'bitvavo',
      api_key,
      api_secret,
    })

    return NextResponse.json({ success: true, imported: imported.length, trades: imported })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}