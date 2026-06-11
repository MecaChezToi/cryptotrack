'use client'
import { useState } from 'react'
import { CRYPTOS } from '@/hooks/useCrypto'
import type { CryptoData } from '@/hooks/useCrypto'

interface Props {
  selected: string
  onSelect: (id: string) => void
  data: CryptoData | null
  loading: boolean
}

export default function CryptoSelector({ selected, onSelect, data, loading }: Props) {
  const [open, setOpen] = useState(false)
  const current = CRYPTOS.find(c => c.id === selected) || CRYPTOS[0]

  const fmtPrice = (p: number) => {
    if (!p) return '—'
    if (p < 0.01) return '$' + p.toFixed(6)
    if (p < 10)   return '$' + p.toFixed(4)
    if (p < 1000) return '$' + p.toFixed(2)
    return '$' + p.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', position:'relative' }}>
      <div style={s.btn} onClick={() => setOpen(!open)}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: current.color }} />
        <span style={{ fontWeight:600 }}>{current.sym}</span>
        <span style={{ fontSize:'11px' }}>▾</span>
      </div>

      {open && (
        <>
          <div style={s.overlay} onClick={() => setOpen(false)} />
          <div style={s.modal}>
            {CRYPTOS.map(c => (
              <div key={c.id} style={{ ...s.opt, ...(c.id === selected ? s.optActive : {}) }}
                onClick={() => { onSelect(c.id); setOpen(false) }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: c.color, flexShrink:0 }} />
                <span>{c.name}</span>
                <span style={{ marginLeft:'auto', color:'#8b949e', fontSize:'11px' }}>{c.sym}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:'18px', fontWeight:'700', color:'#f0883e' }}>
          {loading ? '…' : fmtPrice(data?.price || 0)}
        </div>
        <div style={{ fontSize:'11px', color: (data?.change24h || 0) >= 0 ? '#3fb950' : '#f85149' }}>
          {data ? ((data.change24h >= 0 ? '+' : '') + data.change24h.toFixed(2) + '% (24h)') : '—'}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  btn: { background:'#1c2128', border:'1px solid #30363d', borderRadius:'6px', padding:'6px 12px', color:'#e6edf3', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', gap:'7px' },
  overlay: { position:'fixed', inset:0, zIndex:99 },
  modal: { position:'absolute', top:'42px', right:0, background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'6px', zIndex:100, minWidth:'200px', boxShadow:'0 8px 24px rgba(0,0,0,.5)' },
  opt: { display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', cursor:'pointer', borderRadius:'4px', fontSize:'13px', color:'#e6edf3' },
  optActive: { color:'#f0883e', background:'#f0883e11' },
}