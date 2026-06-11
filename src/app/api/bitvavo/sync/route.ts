import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { api_key, api_secret } = await req.json()
    if (!api_key || !api_secret) return NextResponse.json({ error: 'Clés manquantes' }, { status: 400 })

    // D'abord récupère tous les marchés disponibles sur ton compte
    const timestamp = Date.now().toString()
    const method = 'GET'
    const path = '/v2/balance'
    const signature = crypto.createHmac('sha256', api_secret)
      .update(timestamp + method + path + '')
      .digest('hex')

    const balanceRes = await fetch('https://api.bitvavo.com/v2/balance', {
      headers: {
        'Bitvavo-Access-Key': api_key,
        'Bitvavo-Access-Signature': signature,
        'Bitvavo-Access-Timestamp': timestamp,
        'Bitvavo-Access-Window': '10000',
      }
    })

    const balances = await balanceRes.json()
    console.log('Balances:', JSON.stringify(balances))

    if (!balanceRes.ok) {
      return NextResponse.json({ error: 'Erreur Bitvavo auth', details: balances }, { status: 400 })
    }

    // Pour chaque crypto avec un solde, récupère les trades
    const imported: any[] = []
    const cryptosFound: string[] = []

    for (const balance of balances) {
      const sym = balance.symbol
      if (sym === 'EUR') continue
      if (parseFloat(balance.available) === 0 && parseFloat(balance.inOrder) === 0) continue

      cryptosFound.push(sym)
      const market = `${sym}-EUR`
      const ts2 = Date.now().toString()
      const tradePath = `/v2/${market}/trades`
      const tradeSig = crypto.createHmac('sha256', api_secret)
        .update(ts2 + 'GET' + tradePath + '')
        .digest('hex')

      const tradesRes = await fetch(`https://api.bitvavo.com${tradePath}?limit=100`, {
        headers: {
          'Bitvavo-Access-Key': api_key,
          'Bitvavo-Access-Signature': tradeSig,
          'Bitvavo-Access-Timestamp': ts2,
          'Bitvavo-Access-Window': '10000',
        }
      })

      if (!tradesRes.ok) { console.log(`Skip ${market}:`, tradesRes.status); continue }
      const trades = await tradesRes.json()
      console.log(`Trades ${market}:`, trades?.length || 0)

      if (!Array.isArray(trades)) continue

      for (const trade of trades) {
        if (trade.side !== 'buy') continue
        const date   = new Date(parseInt(trade.timestamp)).toISOString().split('T')[0]
        const price  = parseFloat(trade.price)
        const qty    = parseFloat(trade.amount)
        const amount = price * qty

        const { data: existing } = await supabase.from('purchases').select('id')
          .eq('user_id', user.id).eq('sym', sym).eq('note', `bitvavo:${trade.id}`).single()
        if (existing) continue

        await supabase.from('purchases').insert({ user_id:user.id, sym, date, amount, price, qty, note:`bitvavo:${trade.id}` })
        imported.push({ sym, date, amount, price, qty })
      }
    }

    // Sauvegarde les clés
    await supabase.from('api_keys').upsert({ user_id:user.id, exchange:'bitvavo', api_key, api_secret })

    return NextResponse.json({ success:true, imported:imported.length, cryptosFound, trades:imported })
  } catch (e: any) {
    console.error('Sync error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}