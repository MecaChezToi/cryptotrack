'use client'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/components/AppShell'
import { usePurchases } from '@/hooks/usePurchases'
import Topbar from '@/components/Topbar'
import PortfolioOverview from '@/components/PortfolioOverview'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default function DashboardPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const { purchases } = usePurchases(cryptoData?.sym || 'BTC')
  const chartPortRef  = useRef<HTMLCanvasElement>(null)
  const chart7dRef    = useRef<HTMLCanvasElement>(null)
  const portChart     = useRef<Chart | null>(null)
  const price7dChart  = useRef<Chart | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const sym      = cryptoData?.sym || 'BTC'
  const price    = cryptoData?.price || 0
  const totalInv = purchases.reduce((s, p) => s + p.amount, 0)
  const totalQty = purchases.reduce((s, p) => s + p.qty, 0)
  const curVal   = totalQty * price
  const pnl      = curVal - totalInv
  const pnlPct   = totalInv ? (pnl / totalInv) * 100 : 0
  const avgPrice = totalQty ? totalInv / totalQty : 0
  const fmtUSD   = (n: number, d = 2) => '$' + n.toLocaleString('fr-FR', { minimumFractionDigits:d, maximumFractionDigits:d })
  const fmtPct   = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
  const green = '#3fb950', red = '#f85149'
  const decPrice = price < 10 ? 4 : price < 1000 ? 2 : 0

  useEffect(() => {
    if (!chart7dRef.current || !cryptoData?.price7d.length) return
    if (price7dChart.current) price7dChart.current.destroy()
    price7dChart.current = new Chart(chart7dRef.current, {
      type:'line',
      data:{ labels:cryptoData.price7d.map(()=>''), datasets:[{ data:cryptoData.price7d, borderColor:'#f0883e', borderWidth:2, pointRadius:0, tension:0.4, fill:true, backgroundColor:'rgba(240,136,62,0.07)' }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ display:false }, y:{ display:true, grid:{ color:'#30363d55' }, ticks:{ color:'#8b949e', font:{ size:10 }, callback:v=>'$'+Math.round(Number(v)).toLocaleString() } } } }
    })
    return () => { price7dChart.current?.destroy() }
  }, [cryptoData?.price7d])

  useEffect(() => {
    if (!chartPortRef.current) return
    if (portChart.current) portChart.current.destroy()
    const sorted = [...purchases].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
    let cumInv=0, cumQty=0
    const labels:string[]=[], vals:number[]=[], invLine:number[]=[]
    sorted.forEach(p=>{ cumInv+=p.amount; cumQty+=p.qty; labels.push(p.date); vals.push(+(cumQty*price).toFixed(2)); invLine.push(+cumInv.toFixed(2)) })
    portChart.current = new Chart(chartPortRef.current, {
      type:'line',
      data:{ labels, datasets:[
        { label:'Valeur', data:vals, borderColor:'#f0883e', borderWidth:2, pointRadius:2, tension:0.4, fill:false },
        { label:'Investi', data:invLine, borderColor:'#8b949e', borderWidth:1.5, pointRadius:0, borderDash:[4,4], fill:false }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#8b949e', font:{ size:10 }, boxWidth:10 } } }, scales:{ x:{ ticks:{ color:'#8b949e', font:{ size:8 }, maxTicksLimit:4 }, grid:{ color:'#30363d55' } }, y:{ ticks:{ color:'#8b949e', font:{ size:9 }, callback:v=>'$'+Math.round(Number(v)).toLocaleString() }, grid:{ color:'#30363d55' } } } }
    })
    return () => { portChart.current?.destroy() }
  }, [purchases, price])

  const pad = isMobile ? '12px 14px' : '16px 22px'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Dashboard" subtitle="Vue d'ensemble de votre portefeuille"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:pad, flex:1, overflowY:'auto' }}>
        <PortfolioOverview />

        {/* MÉTRIQUES 2x2 sur mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'8px', marginBottom:'10px' }}>
          <div style={s.card}>
            <div style={s.label}>Portefeuille</div>
            <div style={{ ...s.val, fontSize:isMobile?'15px':'20px' }}>{fmtUSD(curVal)}</div>
            <div style={{ fontSize:'10px', color:'#8b949e', marginTop:'2px' }}>{totalInv?'Investi: '+fmtUSD(totalInv):'Aucun achat'}</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Profit / Perte</div>
            <div style={{ ...s.val, fontSize:isMobile?'15px':'20px', color:pnl>=0?green:red }}>{(pnl>=0?'+':'')+fmtUSD(Math.abs(pnl))}</div>
            <div style={{ fontSize:'10px', color:pnlPct>=0?green:red, marginTop:'2px' }}>{fmtPct(pnlPct)}</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Total {sym}</div>
            <div style={{ ...s.val, fontSize:isMobile?'13px':'20px', color:'#f0883e' }}>{totalQty.toFixed(isMobile?4:6)}</div>
            <div style={{ fontSize:'10px', color:'#8b949e', marginTop:'2px' }}>{sym}</div>
          </div>
          <div style={s.card}>
            <div style={s.label}>Prix moyen</div>
            <div style={{ ...s.val, fontSize:isMobile?'13px':'20px' }}>{avgPrice?fmtUSD(avgPrice,decPrice):'$0'}</div>
            <div style={{ fontSize:'10px', marginTop:'2px', color:avgPrice&&price?(price>=avgPrice?green:red):'#8b949e' }}>
              {avgPrice&&price?'vs live: '+(((price-avgPrice)/avgPrice)*100>=0?'+':'')+(((price-avgPrice)/avgPrice)*100).toFixed(1)+'%':'vs live'}
            </div>
          </div>
        </div>

        {/* GRAPHIQUES */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(2,minmax(0,1fr))', gap:'8px', marginBottom:'10px' }}>
          <div style={s.card}>
            <div style={s.cardTitle}>Évolution du portefeuille</div>
            <div style={{ position:'relative', height:isMobile?'120px':'160px' }}>
              <canvas ref={chartPortRef} />
            </div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Prix {sym} – 7j</div>
            <div style={{ position:'relative', height:isMobile?'120px':'160px' }}>
              <canvas ref={chart7dRef} />
            </div>
          </div>
        </div>

        {/* VARIATIONS */}
        <div style={s.card}>
          <div style={s.cardTitle}>Variations {sym}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
            {[{ label:'24h', val:cryptoData?.change24h },{ label:'7j', val:cryptoData?.change7d },{ label:'30j', val:cryptoData?.change30d }].map(({ label, val }) => (
              <div key={label} style={{ textAlign:'center', padding:'8px 4px' }}>
                <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px' }}>{label}</div>
                <div style={{ fontSize:isMobile?'16px':'20px', fontWeight:'700', color:val!=null?(val>=0?green:red):'#8b949e' }}>
                  {val!=null?fmtPct(val):'—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:     { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'11px 13px', marginBottom:'0' },
  label:    { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  val:      { fontWeight:'600', color:'#e6edf3', lineHeight:'1.2' },
  cardTitle:{ fontSize:'12px', fontWeight:'600', color:'#e6edf3', marginBottom:'8px' },
}
