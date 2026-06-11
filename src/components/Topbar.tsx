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
  return (
    <div style={s.topbar}>
      <div>
        <h1 style={s.title}>{title}</h1>
        <p style={s.sub}>{subtitle}</p>
      </div>
      <CryptoSelector
        selected={cryptoId}
        onSelect={onCryptoChange}
        data={cryptoData}
        loading={cryptoLoading}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  topbar: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px 12px', borderBottom:'1px solid #30363d', flexShrink:0, gap:'12px' },
  title: { fontSize:'22px', fontWeight:'600', color:'#e6edf3', lineHeight:'1.2' },
  sub: { fontSize:'12px', color:'#8b949e', marginTop:'3px' },
}