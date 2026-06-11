'use client'
import { useState } from 'react'
import { useApp } from '@/components/AppShell'
import { usePurchases } from '@/hooks/usePurchases'
import Topbar from '@/components/Topbar'

export default function DCAPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const sym = cryptoData?.sym || 'BTC'
  const price = cryptoData?.price || 0
  const { purchases, addPurchase, deletePurchase } = usePurchases(sym)

  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [qty, setQty]       = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  const totalInv = purchases.reduce((s, p) => s + p.amount, 0)
  const totalQty = purchases.reduce((s, p) => s + p.qty, 0)
  const avgPrice = totalQty ? totalInv / totalQty : 0

  const fmtUSD = (n: number, d = 2) => '$' + n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
  const green = '#3fb950', red = '#f85149'

  function fillLive() {
    setBuyPrice(price.toString())
    if (amount && price) setQty((parseFloat(amount) / price).toFixed(8))
  }

  function onAmountChange(v: string) {
    setAmount(v)
    if (v && buyPrice) setQty((parseFloat(v) / parseFloat(buyPrice)).toFixed(8))
  }

  function onPriceChange(v: string) {
    setBuyPrice(v)
    if (amount && v) setQty((parseFloat(amount) / parseFloat(v)).toFixed(8))
  }

  async function handleAdd() {
    if (!amount || !buyPrice) return
    setSaving(true)
    await addPurchase({
      sym,
      date,
      amount: parseFloat(amount),
      price: parseFloat(buyPrice),
      qty: parseFloat(qty) || parseFloat(amount) / parseFloat(buyPrice),
      note,
    })
    setAmount(''); setBuyPrice(''); setQty(''); setNote('')
    setSaving(false)
  }

  const decPrice = (p: number) => p < 10 ? 4 : p < 1000 ? 2 : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Suivi DCA" subtitle="Enregistrez et suivez vos achats périodiques"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:'16px 22px', flex:1, overflowY:'auto' }}>
        {/* STATS */}
        <div style={s.grid3}>
          <div style={s.card}>
            <div style={s.label}>Total investi</div>
            <div style={s.val}>{fmtUSD(totalInv)}</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Total {sym} accumulé</div>
            <div style={{ ...s.val, color:'#f0883e' }}>{totalQty.toFixed(6)} {sym}</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Prix moyen pondéré</div>
            <div style={s.val}>{avgPrice ? fmtUSD(avgPrice, decPrice(avgPrice)) : '$0'}</div>
          </div>
        </div>

        {/* FORM */}
        <div style={{ ...s.card, marginBottom:'12px' }}>
          <div style={s.sectionTitle}>+ Ajouter un achat ({sym})</div>
          <div style={s.formRow}>
            <div>
              <div style={s.formLabel}>Date</div>
              <input style={s.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <div style={s.formLabel}>Montant ($)</div>
              <input style={s.input} type="number" placeholder="100" value={amount} onChange={e => onAmountChange(e.target.value)} />
            </div>
            <div>
              <div style={{ ...s.formLabel, display:'flex', alignItems:'center', gap:'6px' }}>
                Prix ($)
                <button style={s.liveBadge} onClick={fillLive}>Live</button>
              </div>
              <input style={s.input} type="number" value={buyPrice} onChange={e => onPriceChange(e.target.value)} />
            </div>
            <div>
              <div style={s.formLabel}>Quantité</div>
              <input style={s.input} type="number" placeholder="auto" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div>
              <div style={s.formLabel}>Notes</div>
              <input style={s.input} type="text" placeholder="Optionnel" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div style={{ paddingTop:'18px' }}>
              <button style={s.btn} onClick={handleAdd} disabled={saving}>
                {saving ? '…' : '+'}
              </button>
            </div>
          </div>
        </div>

        {/* HISTORIQUE */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Historique des transactions ({purchases.length})</div>
          {!purchases.length ? (
            <div style={s.empty}>
              <div style={{ fontSize:'28px', marginBottom:'8px', opacity:.4 }}>📋</div>
              <p>Aucun achat enregistré pour {sym}<br/>Ajoutez votre premier achat DCA ci-dessus</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>{['Date','Montant','Prix achat','Quantité','P&L','Notes',''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {purchases.map(p => {
                    const pnl = (price - p.price) * p.qty
                    const pct = price ? ((price - p.price) / p.price * 100) : 0
                    return (
                      <tr key={p.id} style={{ borderBottom:'1px solid #30363d22' }}>
                        <td style={s.td}>{p.date}</td>
                        <td style={s.td}>{fmtUSD(p.amount)}</td>
                        <td style={s.td}>{fmtUSD(p.price, decPrice(p.price))}</td>
                        <td style={s.td}>{p.qty.toFixed(6)} {sym}</td>
                        <td style={{ ...s.td, color: pnl >= 0 ? green : red }}>
                          {pnl >= 0 ? '+' : ''}{fmtUSD(Math.abs(pnl))} ({pct.toFixed(1)}%)
                        </td>
                        <td style={{ ...s.td, color:'#8b949e' }}>{p.note || '—'}</td>
                        <td style={s.td}>
                          <button style={s.deleteBtn} onClick={() => deletePurchase(p.id)}>✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid3:       { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'10px', marginBottom:'12px' },
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px', marginBottom:'12px' },
  label:       { fontSize:'11px', color:'#8b949e', marginBottom:'5px' },
  val:         { fontSize:'20px', fontWeight:'600', color:'#e6edf3' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'12px' },
  formRow:     { display:'grid', gridTemplateColumns:'130px 110px 150px 120px 1fr 40px', gap:'8px', alignItems:'end' },
  formLabel:   { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'8px 10px', color:'#e6edf3', fontSize:'12px', outline:'none', boxSizing:'border-box' },
  liveBadge:   { background:'#f0883e33', color:'#f0883e', fontSize:'10px', fontWeight:'700', padding:'2px 6px', borderRadius:'4px', border:'none', cursor:'pointer' },
  btn:         { width:'40px', height:'36px', background:'#f0883e', border:'none', borderRadius:'6px', color:'#000', fontSize:'18px', fontWeight:'700', cursor:'pointer' },
  empty:       { textAlign:'center', padding:'32px', color:'#6e7681', fontSize:'12px', lineHeight:'1.6' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:'12px' },
  th:          { color:'#8b949e', fontWeight:'500', textAlign:'left', padding:'7px 9px', borderBottom:'1px solid #30363d', whiteSpace:'nowrap' },
  td:          { padding:'8px 9px', whiteSpace:'nowrap', color:'#e6edf3' },
  deleteBtn:   { background:'none', border:'none', color:'#6e7681', cursor:'pointer', fontSize:'13px', padding:'2px 6px', borderRadius:'4px' },
}