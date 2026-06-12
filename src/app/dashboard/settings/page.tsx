'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/components/AppShell'
import Topbar from '@/components/Topbar'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const [apiKey,    setApiKey]    = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [syncing,   setSyncing]   = useState(false)
  const [result,    setResult]    = useState<any>(null)
  const [error,     setError]     = useState('')
  const [hasSaved,  setHasSaved]  = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
  supabase.from('api_keys').select('api_key, api_secret').eq('user_id', data.user.id).eq('exchange', 'bitvavo').maybeSingle()
  .then(({ data: keys }) => {
    if (keys) { setApiKey(keys.api_key); setApiSecret(keys.api_secret); setHasSaved(true) }
  })
    })
  }, [])

  async function handleSync() {
    if (!apiKey || !apiSecret) { setError('Clés API requises'); return }
    setSyncing(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/bitvavo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
      setHasSaved(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  const green = '#3fb950', red = '#f85149'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Paramètres" subtitle="Gérez vos connexions et préférences"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:'16px 22px', flex:1, overflowY:'auto' }}>

        <div style={s.card}>
          <div style={s.sectionTitle}>
            <span style={{ fontSize:'18px' }}>🔗</span> Sync Bitvavo
          </div>
          <p style={{ fontSize:'12px', color:'#8b949e', marginBottom:'16px', lineHeight:'1.6' }}>
            Connecte ton compte Bitvavo pour importer automatiquement tes trades dans le suivi DCA.
            Tes clés API sont stockées de façon sécurisée et ne sont jamais partagées.
          </p>

          <div style={s.infoBox}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#58a6ff', marginBottom:'6px' }}>Comment obtenir tes clés API Bitvavo ?</div>
            <ol style={{ fontSize:'11px', color:'#8b949e', paddingLeft:'16px', lineHeight:'1.8' }}>
              <li>Va sur <strong style={{ color:'#e6edf3' }}>bitvavo.com</strong> → Account → API</li>
              <li>Clique sur <strong style={{ color:'#e6edf3' }}>Create API key</strong></li>
              <li>Active uniquement <strong style={{ color:'#e6edf3' }}>Read access</strong> (jamais Trade/Withdraw)</li>
              <li>Copie la clé et le secret ci-dessous</li>
            </ol>
          </div>

          <div style={{ marginBottom:'12px' }}>
            <div style={s.formLabel}>API Key</div>
            <input style={s.input} type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={apiKey} onChange={e=>setApiKey(e.target.value)} />
          </div>
          <div style={{ marginBottom:'16px' }}>
            <div style={s.formLabel}>API Secret</div>
            <input style={s.input} type="password" placeholder="••••••••••••••••••••••••••••••••"
              value={apiSecret} onChange={e=>setApiSecret(e.target.value)} />
          </div>

          {error && (
            <div style={s.errorBox}>{error}</div>
          )}

{result && (
  <div style={s.successBox}>
    <div style={{ fontWeight:600, color:green, marginBottom:'8px' }}>
      ✓ {result.imported} position{result.imported>1?'s':''} synchronisée{result.imported>1?'s':''}
    </div>
    {result.summary?.map((s: any, i: number) => (
      <div key={i} style={{ fontSize:'11px', color:'#8b949e', marginBottom:'4px', paddingBottom:'4px', borderBottom: i<result.summary.length-1?'1px solid #30363d':'none' }}>
        <strong style={{ color:'#e6edf3' }}>{s.sym}</strong> — {s.tradesScanned} trades scannés → solde net {s.netQty.toFixed(6)} {s.sym}
        {' '}({s.netLots} lot{s.netLots>1?'s':''}, investi ${s.netInvestedUSD.toFixed(2)})
        <br/>Balance Bitvavo actuelle: {s.bitvavoBalance.toFixed(6)} {s.sym}
      </div>
    ))}
  </div>
)}

          <button style={{ ...s.btn, width:'100%', justifyContent:'center', marginTop:'4px' }} onClick={handleSync} disabled={syncing}>
            {syncing ? '⏳ Synchronisation en cours…' : hasSaved ? '🔄 Re-synchroniser Bitvavo' : '🔗 Connecter et importer'}
          </button>
        </div>

        <div style={{ ...s.card, marginTop:'12px' }}>
          <div style={s.sectionTitle}><span style={{ fontSize:'18px' }}>ℹ️</span> Sécurité</div>
          <div style={{ fontSize:'12px', color:'#8b949e', lineHeight:'1.7' }}>
            <p>• Les clés API sont stockées dans Supabase avec Row Level Security — seul toi y as accès.</p>
            <p style={{ marginTop:'6px' }}>• Utilise uniquement des clés en <strong style={{ color:'#e6edf3' }}>lecture seule</strong> — l'app n'a jamais besoin de droits de trading ou de retrait.</p>
            <p style={{ marginTop:'6px' }}>• Tu peux révoquer tes clés à tout moment depuis Bitvavo sans impact sur tes données.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'16px 18px' },
  sectionTitle:{ fontSize:'14px', fontWeight:'600', color:'#e6edf3', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' },
  formLabel:   { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'9px 12px', color:'#e6edf3', fontSize:'13px', outline:'none', boxSizing:'border-box' },
  btn:         { background:'#f0883e', border:'none', borderRadius:'6px', padding:'10px 16px', color:'#000', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' },
  infoBox:     { background:'#58a6ff11', border:'1px solid #58a6ff22', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px' },
  errorBox:    { background:'#f8514922', border:'1px solid #f8514944', borderRadius:'6px', padding:'10px 12px', color:'#f85149', fontSize:'12px', marginBottom:'12px' },
  successBox:  { background:'#3fb95022', border:'1px solid #3fb95044', borderRadius:'6px', padding:'10px 12px', marginBottom:'12px' },
}