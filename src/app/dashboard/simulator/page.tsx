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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [monthly,  setMonthly]  = useState(200)
  const [duration, setDuration] = useState(12)
  const [bull,     setBull]     = useState('')
  const [base,     setBase]     = useState('')
  const [bear,     setBear]     = useState('')

  const chartRef  = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)

  useEffect(() => { if(!price) return; setBase(Math.round(price).toString()); setBull(Math.round(price*2.5).toString()); setBear(Math.round(price*0.4).toString()) }, [price])
  useEffect(() => { updateChart() }, [monthly, duration, bull, base, bear, price])

  function calcSeries(target: number): number[] {
    if(!target||!price) return Array(duration).fill(0)
    const growth = Math.pow(target/price, 1/duration)-1
    let qty=0
    return Array.from({ length:duration }, (_,i) => { const p=price*Math.pow(1+growth,i+1); qty+=monthly/p; return+(qty*p).toFixed(2) })
  }

  function updateChart() {
    if(!chartRef.current) return
    if(chartInst.current) chartInst.current.destroy()
    const labels = Array.from({ length:duration }, (_,i) => 'M'+(i+1))
    chartInst.current = new Chart(chartRef.current, {
      type:'line',
      data:{ labels, datasets:[
        { label:'Haussier', data:calcSeries(parseFloat(bull)), borderColor:'#3fb950', borderWidth:2, pointRadius:0, tension:0.3, fill:false },
        { label:'Base',     data:calcSeries(parseFloat(base)), borderColor:'#58a6ff', borderWidth:2, pointRadius:0, tension:0.3, fill:false },
        { label:'Baissier', data:calcSeries(parseFloat(bear)), borderColor:'#f85149', borderWidth:2, pointRadius:0, tension:0.3, fill:false },
        { label:'Investi',  data:Array.from({ length:duration },(_,i)=>monthly*(i+1)), borderColor:'#8b949e', borderWidth:1.5, pointRadius:0, borderDash:[4,4], fill:false },
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#8b949e', font:{ size:10 }, boxWidth:10 } } },
        scales:{ x:{ ticks:{ color:'#8b949e', font:{ size:isMobile?8:10 }, maxTicksLimit:isMobile?6:12 }, grid:{ color:'#30363d55' } },
                 y:{ ticks:{ color:'#8b949e', font:{ size:10 }, callback:v=>'$'+Math.round(Number(v)).toLocaleString() }, grid:{ color:'#30363d55' } } } }
    })
  }

  const fmtUSD   = (n: number) => '$'+Math.round(n).toLocaleString('fr-FR')
  const totalInv = monthly*duration
  const roi      = (f: number) => f ? ((f-totalInv)/totalInv*100).toFixed(1)+'%' : '—'
  const bf  = calcSeries(parseFloat(bull)).at(-1)||0
  const bf2 = calcSeries(parseFloat(base)).at(-1)||0
  const bf3 = calcSeries(parseFloat(bear)).at(-1)||0
  const pad = isMobile ? '12px 14px' : '16px 22px'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Simulateur" subtitle="Projetez la valeur selon différents scénarios"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:pad, flex:1, overflowY:'auto' }}>
        <div style={{ ...s.card, marginBottom:'10px' }}>
          <div style={s.sectionTitle}>Paramètres ({sym})</div>
          <div style={s.sliderWrap}>
            <div style={s.sliderLabel}><span>Investissement mensuel</span><span style={{ color:'#f0883e', fontWeight:600 }}>${monthly.toLocaleString()}</span></div>
            <input type="range" min={10} max={5000} step={10} value={monthly} onChange={e=>setMonthly(parseInt(e.target.value))} style={{ width:'100%', accentColor:'#f0883e' }} />
            <div style={s.sliderRange}><span>$10</span><span>$5 000</span></div>
          </div>
          <div style={s.sliderWrap}>
            <div style={s.sliderLabel}><span>Durée</span><span style={{ color:'#f0883e', fontWeight:600 }}>{duration} mois</span></div>
            <input type="range" min={3} max={60} step={1} value={duration} onChange={e=>setDuration(parseInt(e.target.value))} style={{ width:'100%', accentColor:'#f0883e' }} />
            <div style={s.sliderRange}><span>3 mois</span><span>60 mois</span></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
            <div><div style={{ ...s.formLabel, color:'#3fb950' }}>Haussier ($)</div><input style={s.input} type="number" value={bull} onChange={e=>setBull(e.target.value)} /></div>
            <div><div style={{ ...s.formLabel, color:'#58a6ff' }}>Base ($)</div><input style={s.input} type="number" value={base} onChange={e=>setBase(e.target.value)} /></div>
            <div><div style={{ ...s.formLabel, color:'#f85149' }}>Baissier ($)</div><input style={s.input} type="number" value={bear} onChange={e=>setBear(e.target.value)} /></div>
          </div>
        </div>

        <div style={{ ...s.card, marginBottom:'10px' }}>
          <div style={s.sectionTitle}>Projection ({sym})</div>
          <div style={{ position:'relative', height:isMobile?'180px':'220px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
          <div style={s.resultCard}><div style={s.resultLabel}>Haussier</div><div style={{ ...s.resultVal, color:'#3fb950', fontSize:isMobile?'14px':'18px' }}>{bf?fmtUSD(bf):'—'}</div><div style={s.resultSub}>ROI: {roi(bf)}</div></div>
          <div style={s.resultCard}><div style={s.resultLabel}>Base</div><div style={{ ...s.resultVal, color:'#58a6ff', fontSize:isMobile?'14px':'18px' }}>{bf2?fmtUSD(bf2):'—'}</div><div style={s.resultSub}>ROI: {roi(bf2)}</div></div>
          <div style={s.resultCard}><div style={s.resultLabel}>Baissier</div><div style={{ ...s.resultVal, color:'#f85149', fontSize:isMobile?'14px':'18px' }}>{bf3?fmtUSD(bf3):'—'}</div><div style={s.resultSub}>ROI: {roi(bf3)}</div></div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'12px' },
  sliderWrap:  { marginBottom:'14px' },
  sliderLabel: { display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#e6edf3', marginBottom:'5px' },
  sliderRange: { display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#6e7681', marginTop:'3px' },
  formLabel:   { fontSize:'11px', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'8px 10px', color:'#e6edf3', fontSize:'12px', outline:'none', boxSizing:'border-box' },
  resultCard:  { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'11px 8px', textAlign:'center' },
  resultLabel: { fontSize:'10px', color:'#8b949e', marginBottom:'4px' },
  resultVal:   { fontWeight:'700', marginBottom:'3px' },
  resultSub:   { fontSize:'10px', color:'#6e7681' },
}
