'use client'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/components/AppShell'
import { usePurchases } from '@/hooks/usePurchases'
import Topbar from '@/components/Topbar'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default function StatsPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const sym   = cryptoData?.sym || 'BTC'
  const price = cryptoData?.price || 0
  const { purchases } = usePurchases(sym)
  const chartRef  = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const totalInv = purchases.reduce((s,p)=>s+p.amount,0)
  const totalQty = purchases.reduce((s,p)=>s+p.qty,0)
  const curVal   = totalQty*price
  const roi      = totalInv?((curVal-totalInv)/totalInv*100):0
  const sorted   = [...purchases].sort((a,b)=>a.price-b.price)
  const best     = sorted[0], worst = sorted[sorted.length-1]
  const fmtUSD   = (n:number,d=2) => '$'+n.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d})
  const fmtPct   = (n:number) => (n>=0?'+':'')+n.toFixed(2)+'%'
  const green='#3fb950', red='#f85149'
  const dec=(p:number)=>p<10?4:p<1000?2:0
  const pad = isMobile ? '12px 14px' : '16px 22px'

  useEffect(() => {
    if(!chartRef.current||!purchases.length) return
    if(chartInst.current) chartInst.current.destroy()
    const byMonth:Record<string,number>={}
    purchases.forEach(p=>{ const m=p.date.slice(0,7); byMonth[m]=(byMonth[m]||0)+p.amount })
    const months=Object.keys(byMonth).sort()
    chartInst.current = new Chart(chartRef.current, {
      type:'bar',
      data:{ labels:months, datasets:[{ data:months.map(m=>byMonth[m]), backgroundColor:'rgba(240,136,62,0.5)', borderColor:'#f0883e', borderWidth:1.5, borderRadius:4 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
        scales:{ x:{ ticks:{ color:'#8b949e', font:{ size:isMobile?8:10 } }, grid:{ display:false } },
                 y:{ ticks:{ color:'#8b949e', font:{ size:10 }, callback:v=>'$'+Math.round(Number(v)).toLocaleString() }, grid:{ color:'#30363d55' } } } }
    })
    return () => { chartInst.current?.destroy() }
  }, [purchases, isMobile])

  if(!purchases.length) return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Statistiques" subtitle="Analyse détaillée de votre stratégie DCA"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'10px', color:'#6e7681' }}>
        <div style={{ fontSize:'32px', opacity:.4 }}>📊</div>
        <p style={{ fontSize:'13px', textAlign:'center', padding:'0 20px' }}>Aucune donnée — ajoutez des achats dans le suivi DCA</p>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Statistiques" subtitle="Analyse détaillée de votre stratégie DCA"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:pad, flex:1, overflowY:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'8px', marginBottom:'10px' }}>
          <div style={s.statCard}><div style={s.lbl}>Meilleur achat</div><div style={{ ...s.val, color:green, fontSize:isMobile?'13px':'18px' }}>{best?fmtUSD(best.price,dec(best.price)):'—'}</div><div style={s.sub}>{best?.date}</div></div>
          <div style={s.statCard}><div style={s.lbl}>Pire achat</div><div style={{ ...s.val, color:red, fontSize:isMobile?'13px':'18px' }}>{worst?fmtUSD(worst.price,dec(worst.price)):'—'}</div><div style={s.sub}>{worst?.date}</div></div>
          <div style={s.statCard}><div style={s.lbl}>Transactions</div><div style={{ ...s.val, fontSize:isMobile?'13px':'18px' }}>{purchases.length}</div></div>
          <div style={s.statCard}><div style={s.lbl}>Total investi</div><div style={{ ...s.val, fontSize:isMobile?'13px':'18px' }}>{fmtUSD(totalInv)}</div></div>
          <div style={s.statCard}><div style={s.lbl}>Valeur actuelle</div><div style={{ ...s.val, fontSize:isMobile?'13px':'18px' }}>{fmtUSD(curVal)}</div></div>
          <div style={s.statCard}><div style={s.lbl}>ROI total</div><div style={{ ...s.val, color:roi>=0?green:red, fontSize:isMobile?'13px':'18px' }}>{fmtPct(roi)}</div></div>
        </div>

        <div style={{ ...s.card, marginBottom:'10px' }}>
          <div style={s.sectionTitle}>Achats mensuels</div>
          <div style={{ position:'relative', height:isMobile?'130px':'160px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>Transactions</div>
          {isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {[...purchases].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(p => {
                const pnl=(price-p.price)*p.qty, pct=price?((price-p.price)/p.price*100):0
                return (
                  <div key={p.id} style={{ background:'#21262d', borderRadius:'8px', padding:'10px 12px', border:'1px solid #30363d' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#e6edf3' }}>{p.date}</span>
                      <span style={{ fontSize:'12px', color:pnl>=0?green:red, fontWeight:600 }}>{pnl>=0?'+':''}{fmtUSD(Math.abs(pnl))} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', fontSize:'11px', color:'#8b949e' }}>
                      <span>Montant: <span style={{ color:'#e6edf3' }}>{fmtUSD(p.amount)}</span></span>
                      <span>Prix: <span style={{ color:'#e6edf3' }}>{fmtUSD(p.price,dec(p.price))}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={s.table}>
                <thead><tr>{['Date','Montant','Prix achat','Quantité','P&L actuel'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...purchases].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(p=>{
                    const pnl=(price-p.price)*p.qty, pct=price?((price-p.price)/p.price*100):0
                    return <tr key={p.id}>
                      <td style={s.td}>{p.date}</td><td style={s.td}>{fmtUSD(p.amount)}</td>
                      <td style={s.td}>{fmtUSD(p.price,dec(p.price))}</td><td style={s.td}>{p.qty.toFixed(6)} {sym}</td>
                      <td style={{ ...s.td, color:pnl>=0?green:red }}>{pnl>=0?'+':''}{fmtUSD(Math.abs(pnl))} ({pct.toFixed(1)}%)</td>
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
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'12px' },
  statCard:    { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'11px 10px', textAlign:'center', marginBottom:'0' },
  lbl:         { fontSize:'10px', color:'#8b949e', marginBottom:'4px' },
  val:         { fontWeight:'700', color:'#e6edf3' },
  sub:         { fontSize:'10px', color:'#6e7681', marginTop:'2px' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:'12px' },
  th:          { color:'#8b949e', fontWeight:'500', textAlign:'left', padding:'7px 9px', borderBottom:'1px solid #30363d', whiteSpace:'nowrap' },
  td:          { padding:'8px 9px', whiteSpace:'nowrap', color:'#e6edf3', borderBottom:'1px solid #30363d22' },
}
