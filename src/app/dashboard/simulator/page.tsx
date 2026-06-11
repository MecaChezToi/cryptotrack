'use client'
import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export default function SimulatorPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const sym   = cryptoData?.sym || 'BTC'
  const price = cryptoData?.price || 0

  const [monthly,  setMonthly]  = useState(200)
  const [duration, setDuration] = useState(12)
  const [bull,     setBull]     = useState('')
  const [base,     setBase]     = useState('')
  const [bear,     setBear]     = useState('')

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)

  // Init prices quand le prix live arrive
  useEffect(() => {
    if (!price) return
    setBase(Math.round(price).toString())
    setBull(Math.round(price * 2.5).toString())
    setBear(Math.round(price * 0.4).toString())
  }, [price])

  useEffect(() => { updateChart() }, [monthly, duration, bull, base, bear, price])

  function calcSeries(target: number): number[] {
    if (!target || !price) return Array(duration).fill(0)
    const growth = Math.pow(target / price, 1 / duration) - 1
    let qty = 0
    return Array.from({ length: duration }, (_, i) => {
      const p = price * Math.pow(1 + growth, i + 1)
      qty += monthly / p
      return +(qty * p).toFixed(2)
    })
  }

  function updateChart() {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()
    const labels  = Array.from({ length: duration }, (_, i) => 'M' + (i + 1))
    const bullS   = calcSeries(parseFloat(bull))
    const baseS   = calcSeries(parseFloat(base))
    const bearS   = calcSeries(parseFloat(bear))
    const invS    = Array.from({ length: duration }, (_, i) => monthly * (i + 1))

    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels, datasets: [
        { label:'Scénario haussier', data:bullS, borderColor:'#3fb950', borderWidth:2, pointRadius:0, tension:0.3, fill:false },
        { label:'Scénario base',     data:baseS, borderColor:'#58a6ff', borderWidth:2, pointRadius:0, tension:0.3, fill:false },
        { label:'Scénario baissier', data:bearS, borderColor:'#f85149', borderWidth:2, pointRadius:0, tension:0.3, fill:false },
        { label:'Investi',           data:invS,  borderColor:'#8b949e', borderWidth:1.5, pointRadius:0, borderDash:[4,4], fill:false },
      ]},
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#8b949e', font:{ size:11 }, boxWidth:12 } } },
        scales:{ x:{ ticks:{ color:'#8b949e', font:{ size:10 } }, grid:{ color:'#30363d55' } },
                 y:{ ticks:{ color:'#8b949e', font:{ size:10 }, callback: v => '$'+Math.round(Number(v)).toLocaleString() }, grid:{ color:'#30363d55' } } } }
    })
  }

  const fmtUSD = (n: number) => '$' + Math.round(n).toLocaleString('fr-FR')
  const roi    = (final: number) => {
    const inv = monthly * duration
    return final ? ((final - inv) / inv * 100).toFixed(1) + '%' : '—'
  }

  const bullFinal = calcSeries(parseFloat(bull)).at(-1) || 0
  const baseFinal = calcSeries(parseFloat(base)).at(-1) || 0
  const bearFinal = calcSeries(parseFloat(bear)).at(-1) || 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Simulateur" subtitle="Projetez la valeur selon différents scénarios"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:'16px 22px', flex:1, overflowY:'auto' }}>

        {/* PARAMS */}
        <div style={{ ...s.card, marginBottom:'12px' }}>
          <div style={s.sectionTitle}>Paramètres de simulation ({sym})</div>

          <div style={s.sliderWrap}>
            <div style={s.sliderLabel}>
              <span>Investissement mensuel</span>
              <span style={{ color:'#f0883e', fontWeight:600 }}>${monthly.toLocaleString()}</span>
            </div>
            <input type="range" min={10} max={5000} step={10} value={monthly}
              onChange={e => setMonthly(parseInt(e.target.value))}
              style={{ width:'100%', accentColor:'#f0883e' }} />
            <div style={s.sliderRange}><span>$10</span><span>$5 000</span></div>
          </div>

          <div style={s.sliderWrap}>
            <div style={s.sliderLabel}>
              <span>Durée</span>
              <span style={{ color:'#f0883e', fontWeight:600 }}>{duration} mois</span>
            </div>
            <input type="range" min={3} max={60} step={1} value={duration}
              onChange={e => setDuration(parseInt(e.target.value))}
              style={{ width:'100%', accentColor:'#f0883e' }} />
            <div style={s.sliderRange}><span>3 mois</span><span>60 mois</span></div>
          </div>

          <div style={s.grid3}>
            <div>
              <div style={{ ...s.formLabel, color:'#3fb950' }}>Prix haussier ($)</div>
              <input style={s.input} type="number" value={bull} onChange={e => setBull(e.target.value)} />
            </div>
            <div>
              <div style={{ ...s.formLabel, color:'#58a6ff' }}>Prix base ($)</div>
              <input style={s.input} type="number" value={base} onChange={e => setBase(e.target.value)} />
            </div>
            <div>
              <div style={{ ...s.formLabel, color:'#f85149' }}>Prix baissier ($)</div>
              <input style={s.input} type="number" value={bear} onChange={e => setBear(e.target.value)} />
            </div>
          </div>
        </div>

        {/* CHART */}
        <div style={{ ...s.card, marginBottom:'12px' }}>
          <div style={s.sectionTitle}>Projection de la valeur ({sym})</div>
          <div style={{ position:'relative', height:'220px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* RÉSULTATS */}
        <div style={s.grid3}>
          <div style={s.resultCard}>
            <div style={s.resultLabel}>Scénario haussier</div>
            <div style={{ ...s.resultVal, color:'#3fb950' }}>{bullFinal ? fmtUSD(bullFinal) : '—'}</div>
            <div style={s.resultSub}>ROI : {roi(bullFinal)}</div>
          </div>
          <div style={s.resultCard}>
            <div style={s.resultLabel}>Scénario base</div>
            <div style={{ ...s.resultVal, color:'#58a6ff' }}>{baseFinal ? fmtUSD(baseFinal) : '—'}</div>
            <div style={s.resultSub}>ROI : {roi(baseFinal)}</div>
          </div>
          <div style={s.resultCard}>
            <div style={s.resultLabel}>Scénario baissier</div>
            <div style={{ ...s.resultVal, color:'#f85149' }}>{bearFinal ? fmtUSD(bearFinal) : '—'}</div>
            <div style={s.resultSub}>ROI : {roi(bearFinal)}</div>
          </div>
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'12px' },
  grid3:       { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:'10px' },
  sliderWrap:  { marginBottom:'14px' },
  sliderLabel: { display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#e6edf3', marginBottom:'5px' },
  sliderRange: { display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#6e7681', marginTop:'3px' },
  formLabel:   { fontSize:'11px', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'8px 10px', color:'#e6edf3', fontSize:'12px', outline:'none', boxSizing:'border-box' },
  resultCard:  { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px', textAlign:'center' },
  resultLabel: { fontSize:'11px', color:'#8b949e', marginBottom:'6px' },
  resultVal:   { fontSize:'20px', fontWeight:'700', marginBottom:'4px' },
  resultSub:   { fontSize:'11px', color:'#6e7681' },
}