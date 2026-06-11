'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/components/AppShell'
import { usePurchases } from '@/hooks/usePurchases'
import Topbar from '@/components/Topbar'

export default function DCAPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const sym   = cryptoData?.sym || 'BTC'
  const price = cryptoData?.price || 0
  const { purchases, addPurchase, deletePurchase } = usePurchases(sym)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
  const [amount,   setAmount]   = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [qty,      setQty]      = useState('')
  const [note,     setNote]     = useState('')
  const [saving,   setSaving]   = useState(false)

  const totalInv = purchases.reduce((s, p) => s + p.amount, 0)
  const totalQty = purchases.reduce((s, p) => s + p.qty, 0)
  const avgPrice = totalQty ? totalInv / totalQty : 0

  const fmtUSD = (n: number, d = 2) => '$' + n.toLocaleString('fr-FR', { minimumFractionDigits:d, maximumFractionDigits:d })
  const green = '#3fb950', red = '#f85149'

  function fillLive() { setBuyPrice(price.toString()); if(amount&&price) setQty((parseFloat(amount)/price).toFixed(8)) }
  function onAmountChange(v: string) { setAmount(v); if(v&&buyPrice) setQty((parseFloat(v)/parseFloat(buyPrice)).toFixed(8)) }
  function onPriceChange(v: string)  { setBuyPrice(v); if(amount&&v) setQty((parseFloat(amount)/parseFloat(v)).toFixed(8)) }

  async function handleAdd() {
    if(!amount||!buyPrice) return
    setSaving(true)
    await addPurchase({ sym, date, amount:parseFloat(amount), price:parseFloat(buyPrice), qty:parseFloat(qty)||parseFloat(amount)/parseFloat(buyPrice), note })
    setAmount(''); setBuyPrice(''); setQty(''); setNote('')
    setSaving(false)
  }

  const decP = (p: number) => p < 10 ? 4 : p < 1000 ? 2 : 0
  const pad  = isMobile ? '12px 14px' : '16px 22px'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Suivi DCA" subtitle="Enregistrez et suivez vos achats périodiques"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:pad, flex:1, overflowY:'auto' }}>
        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'8px', marginBottom:'12px' }}>
          <div style={s.card}><div style={s.label}>Investi</div><div style={{ ...s.val, fontSize:isMobile?'13px':'18px' }}>{fmtUSD(totalInv)}</div></div>
          <div style={s.card}><div style={s.label}>{sym} accumulé</div><div style={{ ...s.val, fontSize:isMobile?'12px':'18px', color:'#f0883e' }}>{totalQty.toFixed(4)}</div></div>
          <div style={s.card}><div style={s.label}>Prix moyen</div><div style={{ ...s.val, fontSize:isMobile?'12px':'18px' }}>{avgPrice?fmtUSD(avgPrice,decP(avgPrice)):'$0'}</div></div>
        </div>

        {/* FORM */}
        <div style={{ ...s.card, marginBottom:'12px' }}>
          <div style={s.sectionTitle}>+ Ajouter un achat ({sym})</div>
          {isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div><div style={s.formLabel}>Date</div><input style={s.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
                <div><div style={s.formLabel}>Montant ($)</div><input style={s.input} type="number" placeholder="100" value={amount} onChange={e=>onAmountChange(e.target.value)} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div>
                  <div style={{ ...s.formLabel, display:'flex', gap:'5px', alignItems:'center' }}>
                    Prix ($) <button style={s.liveBadge} onClick={fillLive}>Live</button>
                  </div>
                  <input style={s.input} type="number" value={buyPrice} onChange={e=>onPriceChange(e.target.value)} />
                </div>
                <div><div style={s.formLabel}>Quantité</div><input style={s.input} type="number" placeholder="auto" value={qty} onChange={e=>setQty(e.target.value)} /></div>
              </div>
              <div><div style={s.formLabel}>Notes</div><input style={s.input} type="text" placeholder="Optionnel" value={note} onChange={e=>setNote(e.target.value)} /></div>
              <button style={{ ...s.btn, width:'100%', justifyContent:'center' }} onClick={handleAdd} disabled={saving}>
                {saving ? 'Ajout en cours…' : '+ Ajouter'}
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'130px 110px 150px 120px 1fr 40px', gap:'8px', alignItems:'end' }}>
              <div><div style={s.formLabel}>Date</div><input style={s.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
              <div><div style={s.formLabel}>Montant ($)</div><input style={s.input} type="number" placeholder="100" value={amount} onChange={e=>onAmountChange(e.target.value)} /></div>
              <div>
                <div style={{ ...s.formLabel, display:'flex', gap:'6px', alignItems:'center' }}>Prix ($)<button style={s.liveBadge} onClick={fillLive}>Live</button></div>
                <input style={s.input} type="number" value={buyPrice} onChange={e=>onPriceChange(e.target.value)} />
              </div>
              <div><div style={s.formLabel}>Quantité</div><input style={s.input} type="number" placeholder="auto" value={qty} onChange={e=>setQty(e.target.value)} /></div>
              <div><div style={s.formLabel}>Notes</div><input style={s.input} type="text" placeholder="Optionnel" value={note} onChange={e=>setNote(e.target.value)} /></div>
              <div style={{ paddingTop:'17px' }}><button style={{ ...s.btn, width:'40px', height:'36px', padding:'0', justifyContent:'center' }} onClick={handleAdd} disabled={saving}>{saving?'…':'+'}</button></div>
            </div>
          )}
        </div>

        {/* HISTORIQUE */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Historique ({purchases.length})</div>
          {!purchases.length ? (
            <div style={s.empty}><div style={{ fontSize:'28px', marginBottom:'8px', opacity:.4 }}>📋</div><p>Aucun achat pour {sym}</p></div>
          ) : isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {purchases.map(p => {
                const pnl = (price - p.price) * p.qty
                const pct = price ? ((price - p.price) / p.price * 100) : 0
                return (
                  <div key={p.id} style={{ background:'#21262d', borderRadius:'8px', padding:'10px 12px', border:'1px solid #30363d' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#e6edf3' }}>{p.date}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontSize:'12px', color:pnl>=0?green:red, fontWeight:600 }}>{pnl>=0?'+':''}{fmtUSD(Math.abs(pnl))} ({pct.toFixed(1)}%)</span>
                        <button style={s.deleteBtn} onClick={()=>deletePurchase(p.id)}>✕</button>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'4px', fontSize:'11px', color:'#8b949e' }}>
                      <span>Montant: <span style={{ color:'#e6edf3' }}>{fmtUSD(p.amount)}</span></span>
                      <span>Prix: <span style={{ color:'#e6edf3' }}>{fmtUSD(p.price,decP(p.price))}</span></span>
                      <span>Qté: <span style={{ color:'#f0883e' }}>{p.qty.toFixed(4)}</span></span>
                    </div>
                    {p.note && <div style={{ fontSize:'11px', color:'#8b949e', marginTop:'4px' }}>{p.note}</div>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={s.table}>
                <thead><tr>{['Date','Montant','Prix achat','Quantité','P&L','Notes',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {purchases.map(p => {
                    const pnl=(price-p.price)*p.qty, pct=price?((price-p.price)/p.price*100):0
                    return <tr key={p.id}>
                      <td style={s.td}>{p.date}</td><td style={s.td}>{fmtUSD(p.amount)}</td>
                      <td style={s.td}>{fmtUSD(p.price,decP(p.price))}</td><td style={s.td}>{p.qty.toFixed(6)} {sym}</td>
                      <td style={{ ...s.td, color:pnl>=0?green:red }}>{pnl>=0?'+':''}{fmtUSD(Math.abs(pnl))} ({pct.toFixed(1)}%)</td>
                      <td style={{ ...s.td, color:'#8b949e' }}>{p.note||'—'}</td>
                      <td style={s.td}><button style={s.deleteBtn} onClick={()=>deletePurchase(p.id)}>✕</button></td>
                    </tr>
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
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px', marginBottom:'0' },
  label:       { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  val:         { fontWeight:'600', color:'#e6edf3' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'12px' },
  formLabel:   { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'8px 10px', color:'#e6edf3', fontSize:'12px', outline:'none', boxSizing:'border-box' },
  liveBadge:   { background:'#f0883e33', color:'#f0883e', fontSize:'10px', fontWeight:'700', padding:'2px 6px', borderRadius:'4px', border:'none', cursor:'pointer' },
  btn:         { background:'#f0883e', border:'none', borderRadius:'6px', padding:'8px 16px', color:'#000', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' },
  empty:       { textAlign:'center', padding:'32px', color:'#6e7681', fontSize:'12px' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:'12px' },
  th:          { color:'#8b949e', fontWeight:'500', textAlign:'left', padding:'7px 9px', borderBottom:'1px solid #30363d', whiteSpace:'nowrap' },
  td:          { padding:'8px 9px', whiteSpace:'nowrap', color:'#e6edf3', borderBottom:'1px solid #30363d22' },
  deleteBtn:   { background:'none', border:'none', color:'#6e7681', cursor:'pointer', fontSize:'13px', padding:'2px 6px' },
}
