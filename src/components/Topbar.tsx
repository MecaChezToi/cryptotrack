'use client'
import { useState, useEffect } from 'react'
import CryptoSelector from './CryptoSelector'
import type { CryptoData } from '@/hooks/useCrypto'

interface Props {
  title: string
  subtitle: string
  cryptoId: string
  onCryptoChange: (id: string) => void
  cryptoData: CryptoData | null
  cryptoLoading: boolean
}

export default function Topbar({ title, subtitle, cryptoId, onCryptoChange, cryptoData, cryptoLoading }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding: isMobile ? '12px 14px 10px' : '16px 24px 12px',
      borderBottom:'1px solid #30363d', flexShrink:0, gap:'8px'
    }}>
      <div>
        <h1 style={{ fontSize:isMobile?'17px':'22px', fontWeight:'600', color:'#e6edf3', lineHeight:'1.2' }}>{title}</h1>
        {!isMobile && <p style={{ fontSize:'12px', color:'#8b949e', marginTop:'3px' }}>{subtitle}</p>}
      </div>
      <CryptoSelector selected={cryptoId} onSelect={onCryptoChange} data={cryptoData} loading={cryptoLoading} />
    </div>
  )
}
