'use client'
import { useState, useEffect } from 'react'
import { usePortfolioOverview } from '@/hooks/usePortfolioOverview'
import { useApp } from './AppShell'

export default function PortfolioOverview() {
  const { rows, loading } = usePortfolioOverview()
  const { setCryptoId } = useApp()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fmtUSD = (n: number, d = 2) => '$' + n.toLocaleString('fr-FR', { minimumFractionDigits:d, maximumFractionDigits:d })
  const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
  const green = '#3fb950', red = '#f85149'

  const totalInv = rows.reduce((s, r) => s + r.totalInv, 0)
  const totalVal = rows.reduce((s, r) => s + r.curVal, 0)
  const totalPnl = totalVal - totalInv
  const totalPct = totalInv ? (totalPnl / totalInv * 100) : 0

  // CRYPTOS map for icons mapping (sym -> coingecko id) is not needed here, color is enough

  if (loading) {
    return (
      <div style={s.card}>
        <div style={{ fontSize:'12px', color:'#8b949e', textAlign:'center', padding:'12px' }}>Chargement du portefeuille…</div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div style={s.card}>
        <div style={{ fontSize:'12px', color:'#6e7681', textAlign:'center', padding:'12px' }}>
          Aucune crypto en portefeuille — ajoute des achats dans le Suivi DCA
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...s.card, marginBottom:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <div style={s.cardTitle}>Vue globale du portefeuille</div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:isMobile?'14px':'17px', fontWeight:700, color:'#e6edf3' }}>{fmtUSD(totalVal)}</div>
          <div style={{ fontSize:'11px', color: totalPnl>=0?green:red, fontWeight:600 }}>
            {totalPnl>=0?'+':''}{fmtUSD(totalPnl)} ({fmtPct(totalPct)})
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : `repeat(${Math.min(rows.length,4)},1fr)`, gap:'8px' }}>
        {rows.map(r => (
          <div key={r.sym} style={s.cryptoCard} onClick={() => setCryptoId(CRYPTOS_BY_SYM[r.sym] || 'bitcoin')}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:r.color, flexShrink:0 }} />
              <span style={{ fontSize:'12px', fontWeight:700, color:'#e6edf3' }}>{r.sym}</span>
            </div>
            <div style={{ fontSize:isMobile?'13px':'15px', fontWeight:700, color:'#e6edf3' }}>{fmtUSD(r.curVal)}</div>
            <div style={{ fontSize:'11px', color:r.pnl>=0?green:red, marginTop:'2px' }}>
              {r.pnl>=0?'+':''}{fmtUSD(r.pnl)} ({fmtPct(r.pnlPct)})
            </div>
            <div style={{ fontSize:'10px', color:'#6e7681', marginTop:'2px' }}>{r.totalQty.toFixed(4)} {r.sym}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Map symbole -> coingecko id pour la navigation au clic
const CRYPTOS_BY_SYM: Record<string,string> = {
  BTC:'bitcoin', ETH:'ethereum', SOL:'solana', BNB:'binancecoin',
  XRP:'ripple', SUI:'sui', ONDO:'ondo-finance', HYPE:'hyperliquid',
  USDC:'usd-coin',
}

const s: Record<string, React.CSSProperties> = {
  card:      { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px' },
  cardTitle: { fontSize:'13px', fontWeight:'600', color:'#e6edf3' },
  cryptoCard:{ background:'#21262d', border:'1px solid #30363d', borderRadius:'8px', padding:'10px 12px', cursor:'pointer', transition:'border-color .15s' },
}
