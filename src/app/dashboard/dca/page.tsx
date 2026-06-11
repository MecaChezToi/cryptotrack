'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/components/AppShell'
import { usePurchases } from '@/hooks/usePurchases'
import { useSells } from '@/hooks/useSells'
import Topbar from '@/components/Topbar'

export default function DCAPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const sym   = cryptoData?.sym || 'BTC'
  const price = cryptoData?.price || 0
  const { purchases, addPurchase, deletePurchase } = usePurchases(sym)
  const { sells, addSell } = useSells(sym)
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

  const [showSellModal, setShowSellModal] = useState(false)
  const [sellPrice,     setSellPrice]     = useState('')
  const [sellDate,      setSellDate]      = useState(new Date().toISOString().split('T')[0])
  const [sellNote,      setSellNote]      = useState('')
  const [selling,       setSelling]       = useState(false)
  const [tab, setTab] = useState<'buys'|'sells'>('buys')

  const totalInv = purchases.reduce((s, p) => s + p.amount, 0)
  const totalQty = purchases.reduce((s, p) => s + p.qty, 0)
  const avgPrice = totalQty ? totalInv / totalQty : 0
  const curVal   = totalQty * price
  const pnlLive  = curVal - totalInv
  const totalProfit = sells.reduce((s, sell) => s + sell.profit, 0)

  const fmtUSD = (n: number, d = 2) => '$' + n.toLocaleString('fr-FR', { minimumFractionDigits:d, maximumFractionDigits:d })
  const green = '#3fb950', red = '#f85149'
  const decP  = (p: number) => p < 10 ? 4 : p < 1000 ? 2 : 0

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

  async function handleSell() {
    if(!sellPrice||!purchases.length) return
    setSelling(true)
    const sp      = parseFloat(sellPrice)
    const profit  = (sp - avgPrice) * totalQty
    const roi     = avgPrice ? ((sp - avgPrice) / avgPrice * 100) : 0
    await addSell({ sym, date:sellDate, sell_price:sp, qty_sold:totalQty, amount_invested:totalInv, profit, roi, note:sellNote })
    for (const p of purchases) await deletePurchase(p.id)
    setShowSellModal(false)
    setSellPrice(''); setSellNote('')
    setSelling(false)
    setTab('sells')
  }

  const pad = isMobile ? '12px 14px' : '16px 22px'
  const spNum = parseFloat(sellPrice) || 0
  const previewProfit = (spNum - avgPrice) * totalQty

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

        {/* FORM ACHAT */}
        <div style={{ ...s.card, marginBottom:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={s.sectionTitle}>+ Ajouter un achat ({sym})</div>
            {purchases.length > 0 && (
              <button style={s.sellBtn} onClick={()=>{ setSellPrice(price.toString()); setShowSellModal(true) }}>
                💰 Clôturer
              </button>
            )}
          </div>

          {isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div><div style={s.formLabel}>Date</div><input style={s.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
                <div><div style={s.formLabel}>Montant ($)</div><input style={s.input} type="number" placeholder="100" value={amount} onChange={e=>onAmountChange(e.target.value)} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div>
                  <div style={{ ...s.formLabel, display:'flex', gap:'5px', alignItems:'center' }}>Prix ($)<button style={s.liveBadge} onClick={fillLive}>Live</button></div>
                  <input style={s.input} type="number" value={buyPrice} onChange={e=>onPriceChange(e.target.value)} />
                </div>
                <div><div style={s.formLabel}>Quantité</div><input style={s.input} type="number" placeholder="auto" value={qty} onChange={e=>setQty(e.target.value)} /></div>
              </div>
              <div><div style={s.formLabel}>Notes</div><input style={s.input} type="text" placeholder="Optionnel" value={note} onChange={e=>setNote(e.target.value)} /></div>
              <button style={{ ...s.btn, width:'100%', justifyContent:'center' }} onClick={handleAdd} disabled={saving}>{saving?'Ajout…':'+ Ajouter'}</button>
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

        {/* TABS */}
        <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'10px' }}>
          <button style={{ ...s.tabBtn, ...(tab==='buys'?s.tabActive:{}) }} onClick={()=>setTab('buys')}>Achats ({purchases.length})</button>
          <button style={{ ...s.tabBtn, ...(tab==='sells'?s.tabActive:{}) }} onClick={()=>setTab('sells')}>Ventes ({sells.length})</button>
          {sells.length > 0 && (
            <div style={{ marginLeft:'auto', fontSize:'12px' }}>
              <span style={{ color:'#8b949e' }}>Profit réalisé: </span>
              <span style={{ color:totalProfit>=0?green:red, fontWeight:700 }}>{totalProfit>=0?'+':''}{fmtUSD(totalProfit)}</span>
            </div>
          )}
        </div>

        {/* LISTE ACHATS */}
        {tab === 'buys' && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Historique des achats</div>
            {!purchases.length ? (
              <div style={s.empty}><div style={{ fontSize:'28px', marginBottom:'8px', opacity:.4 }}>📋</div><p>Aucun achat pour {sym}</p></div>
            ) : isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'10px' }}>
                {purchases.map(p => {
                  const pnl=(price-p.price)*p.qty, pct=price?((price-p.price)/p.price*100):0
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
              <div style={{ overflowX:'auto', marginTop:'10px' }}>
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
        )}

        {/* LISTE VENTES */}
        {tab === 'sells' && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Historique des ventes</div>
            {!sells.length ? (
              <div style={s.empty}><div style={{ fontSize:'28px', marginBottom:'8px', opacity:.4 }}>💰</div><p>Aucune vente enregistrée pour {sym}</p></div>
            ) : isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'10px' }}>
                {sells.map(sell => (
                  <div key={sell.id} style={{ background:'#21262d', borderRadius:'8px', padding:'12px', border:`1px solid ${sell.profit>=0?'#3fb95033':'#f8514933'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#e6edf3' }}>{sell.date}</span>
                      <span style={{ fontSize:'13px', fontWeight:700, color:sell.profit>=0?green:red }}>
                        {sell.profit>=0?'+':''}{fmtUSD(sell.profit)} ({sell.roi.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', fontSize:'11px', color:'#8b949e' }}>
                      <span>Prix vente: <span style={{ color:'#e6edf3' }}>{fmtUSD(sell.sell_price,decP(sell.sell_price))}</span></span>
                      <span>Qté: <span style={{ color:'#f0883e' }}>{sell.qty_sold.toFixed(4)} {sym}</span></span>
                      <span>Investi: <span style={{ color:'#e6edf3' }}>{fmtUSD(sell.amount_invested)}</span></span>
                    </div>
                    {sell.note && <div style={{ fontSize:'11px', color:'#8b949e', marginTop:'6px' }}>{sell.note}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX:'auto', marginTop:'10px' }}>
                <table style={s.table}>
                  <thead><tr>{['Date','Prix vente','Quantité','Investi','Profit réalisé','ROI','Notes'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sells.map(sell => (
                      <tr key={sell.id}>
                        <td style={s.td}>{sell.date}</td>
                        <td style={s.td}>{fmtUSD(sell.sell_price,decP(sell.sell_price))}</td>
                        <td style={s.td}>{sell.qty_sold.toFixed(6)} {sym}</td>
                        <td style={s.td}>{fmtUSD(sell.amount_invested)}</td>
                        <td style={{ ...s.td, color:sell.profit>=0?green:red }}>{sell.profit>=0?'+':''}{fmtUSD(sell.profit)}</td>
                        <td style={{ ...s.td, color:sell.profit>=0?green:red }}>{sell.roi.toFixed(2)}%</td>
                        <td style={{ ...s.td, color:'#8b949e' }}>{sell.note||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL VENTE */}
      {showSellModal && (
        <div style={s.modalOverlay} onClick={()=>setShowSellModal(false)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            <div style={s.modalTitle}>💰 Clôturer position {sym}</div>
            <div style={{ background:'#21262d', borderRadius:'8px', padding:'12px', marginBottom:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'12px' }}>
                <div><span style={{ color:'#8b949e' }}>Quantité totale</span><div style={{ color:'#f0883e', fontWeight:600, marginTop:'2px' }}>{totalQty.toFixed(6)} {sym}</div></div>
                <div><span style={{ color:'#8b949e' }}>Prix moyen d'achat</span><div style={{ color:'#e6edf3', fontWeight:600, marginTop:'2px' }}>{fmtUSD(avgPrice,decP(avgPrice))}</div></div>
                <div><span style={{ color:'#8b949e' }}>Total investi</span><div style={{ color:'#e6edf3', fontWeight:600, marginTop:'2px' }}>{fmtUSD(totalInv)}</div></div>
                <div><span style={{ color:'#8b949e' }}>P&L latent</span><div style={{ color:pnlLive>=0?green:red, fontWeight:600, marginTop:'2px' }}>{pnlLive>=0?'+':''}{fmtUSD(pnlLive)}</div></div>
              </div>
            </div>

            {sellPrice && (
              <div style={{ background:previewProfit>=0?'#3fb95011':'#f8514911', border:`1px solid ${previewProfit>=0?'#3fb95033':'#f8514933'}`, borderRadius:'8px', padding:'10px 12px', marginBottom:'14px' }}>
                <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px' }}>Profit réalisé estimé</div>
                <div style={{ fontSize:'20px', fontWeight:700, color:previewProfit>=0?green:red }}>
                  {previewProfit>=0?'+':''}{fmtUSD(previewProfit)}
                  <span style={{ fontSize:'13px', marginLeft:'8px', color:'#8b949e' }}>({avgPrice?((spNum-avgPrice)/avgPrice*100).toFixed(1):0}%)</span>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
              <div>
                <div style={{ ...s.formLabel, display:'flex', gap:'6px', alignItems:'center' }}>
                  Prix de vente ($)
                  <button style={s.liveBadge} onClick={()=>setSellPrice(price.toString())}>Live</button>
                </div>
                <input style={s.input} type="number" placeholder={price.toString()} value={sellPrice} onChange={e=>setSellPrice(e.target.value)} autoFocus />
              </div>
              <div>
                <div style={s.formLabel}>Date de vente</div>
                <input style={s.input} type="date" value={sellDate} onChange={e=>setSellDate(e.target.value)} />
              </div>
              <div>
                <div style={s.formLabel}>Notes (optionnel)</div>
                <input style={s.input} type="text" placeholder="ex: target atteint, stop loss..." value={sellNote} onChange={e=>setSellNote(e.target.value)} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <button style={s.cancelBtn} onClick={()=>setShowSellModal(false)}>Annuler</button>
              <button style={{ ...s.confirmBtn, opacity:(!sellPrice||selling)?0.6:1 }} onClick={handleSell} disabled={selling||!sellPrice}>
                {selling ? 'En cours…' : '✓ Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px', marginBottom:'0' },
  label:       { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  val:         { fontWeight:'600', color:'#e6edf3' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3' },
  formLabel:   { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'8px 10px', color:'#e6edf3', fontSize:'12px', outline:'none', boxSizing:'border-box' },
  liveBadge:   { background:'#f0883e33', color:'#f0883e', fontSize:'10px', fontWeight:'700', padding:'2px 6px', borderRadius:'4px', border:'none', cursor:'pointer' },
  btn:         { background:'#f0883e', border:'none', borderRadius:'6px', padding:'8px 16px', color:'#000', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' },
  sellBtn:     { background:'#3fb95022', border:'1px solid #3fb95044', borderRadius:'6px', padding:'6px 12px', color:'#3fb950', fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' },
  tabBtn:      { background:'transparent', border:'1px solid #30363d', borderRadius:'6px', padding:'6px 14px', color:'#8b949e', fontSize:'12px', cursor:'pointer' },
  tabActive:   { background:'#f0883e22', borderColor:'#f0883e', color:'#f0883e' },
  empty:       { textAlign:'center', padding:'32px', color:'#6e7681', fontSize:'12px' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:'12px' },
  th:          { color:'#8b949e', fontWeight:'500', textAlign:'left', padding:'7px 9px', borderBottom:'1px solid #30363d', whiteSpace:'nowrap' },
  td:          { padding:'8px 9px', whiteSpace:'nowrap', color:'#e6edf3', borderBottom:'1px solid #30363d22' },
  deleteBtn:   { background:'none', border:'none', color:'#6e7681', cursor:'pointer', fontSize:'13px', padding:'2px 6px' },
  modalOverlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
  modal:       { background:'#1c2128', border:'1px solid #30363d', borderRadius:'12px', padding:'20px', width:'100%', maxWidth:'420px', maxHeight:'90vh', overflowY:'auto' },
  modalTitle:  { fontSize:'16px', fontWeight:'700', color:'#e6edf3', marginBottom:'16px' },
  cancelBtn:   { background:'transparent', border:'1px solid #30363d', borderRadius:'8px', padding:'10px', color:'#8b949e', fontSize:'13px', cursor:'pointer' },
  confirmBtn:  { background:'#3fb950', border:'none', borderRadius:'8px', padding:'10px', color:'#000', fontSize:'13px', fontWeight:'700', cursor:'pointer' },
}
