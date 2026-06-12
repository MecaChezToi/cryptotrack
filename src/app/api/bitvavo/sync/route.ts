import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

interface Lot { qty: number; price: number; date: string; id: string }

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

    // Récupère les balances
    const timestamp = Date.now().toString()
    const balancePath = '/v2/balance'
    const signature = crypto.createHmac('sha256', api_secret)
      .update(timestamp + 'GET' + balancePath)
      .digest('hex')

    const balanceRes = await fetch(`https://api.bitvavo.com${balancePath}`, {
      headers: {
        'Bitvavo-Access-Key': api_key,
        'Bitvavo-Access-Signature': signature,
        'Bitvavo-Access-Timestamp': timestamp,
        'Bitvavo-Access-Window': '10000',
      }
    })

    const balances = await balanceRes.json()
    if (!balanceRes.ok) return NextResponse.json({
      error: 'Erreur auth Bitvavo',
      details: balances,
      status: balanceRes.status
    }, { status: 400 })

    const cryptosFound: string[] = []
    const summary: any[] = []
    let totalImported = 0

    for (const balance of balances) {
      const sym = balance.symbol
      if (sym === 'EUR') continue

      const currentQty = parseFloat(balance.available) + parseFloat(balance.inOrder)
      if (currentQty <= 0) continue

      cryptosFound.push(sym)
      const market = `${sym}-EUR`

      // Récupère TOUS les trades (jusqu'à 1000) pour ce marché
      const ts2 = Date.now().toString()
      const tradePath = `/v2/trades?market=${market}&limit=1000`
      const tradeSig = crypto.createHmac('sha256', api_secret)
        .update(ts2 + 'GET' + tradePath)
        .digest('hex')

      const tradesRes = await fetch(`https://api.bitvavo.com${tradePath}`, {
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

      // Trie par date croissante (les plus anciens d'abord)
      const sorted = [...trades].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))

      // FIFO: file des lots achetés
      const lots: Lot[] = []

      for (const trade of sorted) {
        const qty   = parseFloat(trade.amount)
        const price = parseFloat(trade.price)
        const date  = new Date(parseInt(trade.timestamp)).toISOString().split('T')[0]

        if (trade.side === 'buy') {
          lots.push({ qty, price, date, id: trade.id })
        } else if (trade.side === 'sell') {
          let remaining = qty
          while (remaining > 0 && lots.length > 0) {
            const lot = lots[0]
            if (lot.qty <= remaining) {
              remaining -= lot.qty
              lots.shift()
            } else {
              lot.qty -= remaining
              remaining = 0
            }
          }
        }
      }

      // `lots` contient maintenant uniquement la position nette restante (FIFO)
      // Supprime les anciens imports bitvavo pour ce symbole, puis réinsère les lots actuels
      await supabase.from('purchases').delete()
        .eq('user_id', user.id).eq('sym', sym).like('note', 'bitvavo:%')

      let importedQty = 0, importedAmount = 0
      for (const lot of lots) {
        const priceUSD  = lot.price * eurToUsd
        const amountUSD = priceUSD * lot.qty
        await supabase.from('purchases').insert({
          user_id: user.id,
          sym,
          date: lot.date,
          amount: amountUSD,
          price: priceUSD,
          qty: lot.qty,
          note: `bitvavo:${lot.id}`,
        })
        importedQty += lot.qty
        importedAmount += amountUSD
        totalImported++
      }

      summary.push({
        sym,
        market,
        tradesScanned: trades.length,
        netLots: lots.length,
        netQty: importedQty,
        netInvestedUSD: importedAmount,
        bitvavoBalance: currentQty,
      })
    }

    await supabase.from('api_keys').upsert({
      user_id: user.id, exchange:'bitvavo', api_key, api_secret
    })

    return NextResponse.json({
      success: true,
      imported: totalImported,
      cryptosFound,
      eurToUsd,
      summary,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
