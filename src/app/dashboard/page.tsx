'use client'
import { useEffect, useRef } from 'react'
import { useApp } from '@/components/AppShell'
import { usePurchases } from '@/hooks/usePurchases'
import Topbar from '@/components/Topbar'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default function DashboardPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const { purchases } = usePurchases(cryptoData?.sym || 'BTC')
  const chartPortRef = useRef<HTMLCanvasElement>(null)
  const chart7dRef   = useRef<HTMLCanvasElement>(null)
  const portChart    = useRef<Chart | null>(null)
  const price7dChart = useRef<Chart | null>(null)

  const sym      = cryptoData?.sym || 'BTC'
  const price    = cryptoData?.price || 0
  const totalInv = purchases.reduce((s, p) => s + p.amount, 0)
  const totalQty = purchases.reduce((s, p) => s + p.qty, 0)
  const curVal   = totalQty * price
  const pnl      = curVal - totalInv
  const pnlPct   = totalInv ? (pnl / totalInv) * 100 : 0
  const avgPrice = totalQty ? totalInv / totalQty : 0

  const fmtUSD = (n: number, d = 2) => '$' + n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
  const green  = '#3fb950'
  const red    = '#f85149'

  // Chart 7j
  useEffect(() => {
    if (!chart7dRef.current || !cryptoData?.price7d.length) return
    if (price7dChart.current) price7dChart.current.destroy()
    price7dChart.current = new Chart(chart7dRef.current, {
      type: 'line',
      data: {
        labels: cryptoData.price7d.map(() => ''),
        datasets: [{ data: cryptoData.price7d, borderColor: '#f0883e', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: 'rgba(240,136,62,0.07)' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: true, grid: { color: '#30363d55' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: (v) => '$' + Math.round(Number(v)).toLocaleString() } } } }
    })
    return () => { price7dChart.current?.destroy() }
  }, [cryptoData?.price7d])

  // Chart portfolio
  useEffect(() => {
    if (!chartPortRef.current) return
    if (portChart.current) portChart.current.destroy()
    const sorted = [...purchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let cumInv = 0, cumQty = 0
    const labels: string[] = [], vals: number[] = [], invLine: number[] = []
    sorted.forEach(p => { cumInv += p.amount; cumQty += p.qty; labels.push(p.date); vals.push(+(cumQty * price).toFixed(2)); invLine.push(+cumInv.toFixed(2)) })
    portChart.current = new Chart(chartPortRef.current, {
      type: 'line',
      data: { labels, datasets: [
        { label: 'Valeur', data: vals, borderColor: '#f0883e', borderWidth: 2, pointRadius: 2, tension: 0.4, fill: false },
        { label: 'Investi', data: invLine, borderColor: '#8b949e', borderWidth: 1.5, pointRadius: 0, borderDash: [4, 4], fill: false }
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { color: '#8b949e', font: { size: 11 }, boxWidth: 12 } } },
        scales: { x: { ticks: { color: '#8b949e', font: { size: 9 }, maxTicksLimit: 6 }, grid: { color: '#30363d55' } },
                  y: { ticks: { color: '#8b949e', font: { size: 10 }, callback: v => '$' + Math.round(Number(v)).toLocaleString() }, grid: { color: '#30363d55' } } } }
    })
    return () => { portChart.current?.destroy() }
  }, [purchases, price])

  const decPrice = price < 10 ? 4 : price < 1000 ? 2 : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Dashboard" subtitle="Vue d'ensemble de votre portefeuille"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:'16px 22px', flex:1, overflowY:'auto' }}>
        {/* MÉTRIQUES */}
        <div style={s.grid4}>
          <div style={s.card}>
            <div style={s.metricLabel}>Valeur du portefeuille</div>
            <div style={s.metricVal}>{fmtUSD(curVal)}</div>
            <div style={{ ...s.metricSub, color:'#8b949e' }}>{totalInv ? 'Investi : '+fmtUSD(totalInv) : 'Aucun achat'}</div>
          </div>
          <div style={s.card}>
            <div style={s.metricLabel}>Profit / Perte</div>
            <div style={{ ...s.metricVal, color: pnl >= 0 ? green : red }}>{(pnl>=0?'+':'')+fmtUSD(Math.abs(pnl))}</div>
            <div style={{ ...s.metricSub, color: pnlPct >= 0 ? green : red }}>{fmtPct(pnlPct)}</div>
          </div>
          <div style={s.card}>
            <div style={s.metricLabel}>Total {sym}</div>
            <div style={{ ...s.metricVal, color:'#f0883e' }}>{totalQty.toFixed(6)}</div>
            <div style={{ ...s.metricSub, color:'#8b949e' }}>{sym}</div>
          </div>
          <div style={s.card}>
            <div style={s.metricLabel}>Prix moyen d'achat</div>
            <div style={s.metricVal}>{avgPrice ? fmtUSD(avgPrice, decPrice) : '$0'}</div>
            <div style={{ ...s.metricSub, color: avgPrice && price ? (price >= avgPrice ? green : red) : '#8b949e' }}>
              {avgPrice && price ? 'vs live : ' + (((price-avgPrice)/avgPrice)*100 >= 0 ? '+' : '') + (((price-avgPrice)/avgPrice)*100).toFixed(1)+'%' : 'vs prix live'}
            </div>
          </div>
        </div>

        {/* GRAPHIQUES */}
        <div style={s.grid2}>
          <div style={s.card}>
            <div style={s.cardTitle}>Évolution du portefeuille</div>
            <div style={{ position:'relative', height:'160px' }}>
              <canvas ref={chartPortRef} />
            </div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>Prix {sym} – 7 jours</div>
            <div style={{ position:'relative', height:'160px' }}>
              <canvas ref={chart7dRef} />
            </div>
          </div>
        </div>

        {/* VARIATIONS */}
        <div style={s.card}>
          <div style={s.cardTitle}>Variations du prix {sym}</div>
          <div style={s.grid3}>
            {[
              { label:'24 heures', val: cryptoData?.change24h },
              { label:'7 jours',   val: cryptoData?.change7d },
              { label:'30 jours',  val: cryptoData?.change30d },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign:'center', padding:'10px' }}>
                <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'6px' }}>{label}</div>
                <div style={{ fontSize:'20px', fontWeight:'700', color: val != null ? (val >= 0 ? green : red) : '#8b949e' }}>
                  {val != null ? fmtPct(val) : '—'}
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
  grid4:      { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'10px', marginBottom:'12px' },
  grid2:      { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'10px', marginBottom:'12px' },
  grid3:      { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'10px' },
  card:       { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px' },
  metricLabel:{ fontSize:'11px', color:'#8b949e', marginBottom:'5px' },
  metricVal:  { fontSize:'20px', fontWeight:'600', color:'#e6edf3', lineHeight:'1.2' },
  metricSub:  { fontSize:'11px', marginTop:'3px' },
  cardTitle:  { fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'10px' },
}