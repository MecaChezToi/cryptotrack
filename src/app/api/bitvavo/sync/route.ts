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

    // Taux EUR/USD live via CoinGecko
    const fxRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=euro&vs_currencies=usd')
    const fxData = await fxRes.json()
    const eurToUsd = fxData?.euro?.usd || 1.08
    console.log('EUR/USD rate:', eurToUsd)

    // Récupère les balances
    const timestamp = Date.now().toString()
    const signature = crypto.createHmac('sha256', api_secret)
      .update(timestamp + 'GET' + '/v2/balance' + '')
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
    if (!balanceRes.ok) return NextResponse.json({ error: 'Erreur auth Bitvavo', details: balances }, { status: 400 })

    const imported: any[] = []
    const cryptosFound: string[] = []

    for (const balance of balances) {
      const sym = balance.symbol
      if (sym === 'EUR') continue
      if (parseFloat(balance.available) === 0 && parseFloat(balance.inOrder) === 0) continue

      cryptosFound.push(sym)
      const market = `${sym}-EUR`
      const ts2    = Date.now().toString()
      const tradeSig = crypto.createHmac('sha256', api_secret)
        .update(ts2 + 'GET' + `/v2/${market}/trades` + '')
        .digest('hex')

      const tradesRes = await fetch(`https://api.bitvavo.com/v2/${market}/trades?limit=100`, {
        headers: {
          'Bitvavo-Access-Key': api_key,
          'Bitvavo-Access-Signature': tradeSig,
          'Bitvavo-Access-Timestamp': ts2,
          'Bitvavo-Access-Window': '10000',
        }
      })

      if (!tradesRes.ok) continue
      const trades = await tradesRes.json()
      if (!Array.isArray(trades)) continue

      console.log(`${market}: ${trades.length} trades`)

      for (const trade of trades) {
        if (trade.side !== 'buy') continue

        const date      = new Date(parseInt(trade.timestamp)).toISOString().split('T')[0]
        const priceEUR  = parseFloat(trade.price)
        const qty       = parseFloat(trade.amount)
        // Conversion EUR → USD
        const priceUSD  = priceEUR * eurToUsd
        const amountUSD = priceUSD * qty

        const { data: existing } = await supabase.from('purchases').select('id')
          .eq('user_id', user.id).eq('sym', sym).eq('note', `bitvavo:${trade.id}`).single()
        if (existing) continue

        await supabase.from('purchases').insert({
          user_id: user.id,
          sym,
          date,
          amount:  amountUSD,
          price:   priceUSD,
          qty,
          note:    `bitvavo:${trade.id}`,
        })

        imported.push({ sym, date, amount:amountUSD, price:priceUSD, qty, priceEUR })
      }
    }

    await supabase.from('api_keys').upsert({
      user_id: user.id, exchange:'bitvavo', api_key, api_secret
    })

    return NextResponse.json({
      success: true,
      imported: imported.length,
      cryptosFound,
      eurToUsd,
      trades: imported
    })
  } catch (e: any) {
    console.error('Sync error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}