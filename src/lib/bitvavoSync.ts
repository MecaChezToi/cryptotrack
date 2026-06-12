import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Lot { qty: number; price: number; date: string; id: string }

export async function syncBitvavoForUser(
  supabase: SupabaseClient,
  userId: string,
  apiKey: string,
  apiSecret: string
) {
  // Taux EUR/USD live via CoinGecko
  const fxRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=euro&vs_currencies=usd')
  const fxData = await fxRes.json()
  const eurToUsd = fxData?.euro?.usd || 1.08

  // Récupère les balances
  const timestamp = Date.now().toString()
  const balancePath = '/v2/balance'
  const signature = crypto.createHmac('sha256', apiSecret)
    .update(timestamp + 'GET' + balancePath)
    .digest('hex')

  const balanceRes = await fetch(`https://api.bitvavo.com${balancePath}`, {
    headers: {
      'Bitvavo-Access-Key': apiKey,
      'Bitvavo-Access-Signature': signature,
      'Bitvavo-Access-Timestamp': timestamp,
      'Bitvavo-Access-Window': '10000',
    }
  })

  const balances = await balanceRes.json()
  if (!balanceRes.ok) {
    return { success: false, error: 'Erreur auth Bitvavo', details: balances }
  }

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

    const ts2 = Date.now().toString()
    const tradePath = `/v2/trades?market=${market}&limit=1000`
    const tradeSig = crypto.createHmac('sha256', apiSecret)
      .update(ts2 + 'GET' + tradePath)
      .digest('hex')

    const tradesRes = await fetch(`https://api.bitvavo.com${tradePath}`, {
      headers: {
        'Bitvavo-Access-Key': apiKey,
        'Bitvavo-Access-Signature': tradeSig,
        'Bitvavo-Access-Timestamp': ts2,
        'Bitvavo-Access-Window': '10000',
      }
    })

    if (!tradesRes.ok) continue
    const trades = await tradesRes.json()
    if (!Array.isArray(trades)) continue

    const sorted = [...trades].sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))
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

    // Préserve les lignes manuelles (sans note bitvavo:) — supprime seulement les imports précédents
    await supabase.from('purchases').delete()
      .eq('user_id', userId).eq('sym', sym).like('note', 'bitvavo:%')

    let importedQty = 0, importedAmount = 0
    for (const lot of lots) {
      const priceUSD  = lot.price * eurToUsd
      const amountUSD = priceUSD * lot.qty
      await supabase.from('purchases').insert({
        user_id: userId,
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
      sym, market,
      tradesScanned: trades.length,
      netLots: lots.length,
      netQty: importedQty,
      netInvestedUSD: importedAmount,
      bitvavoBalance: currentQty,
    })
  }

  return { success: true, imported: totalImported, cryptosFound, eurToUsd, summary }
}
