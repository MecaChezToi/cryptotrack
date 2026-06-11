'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/components/AppShell'
import { useAlerts } from '@/hooks/useAlerts'
import Topbar from '@/components/Topbar'

const ALERT_TYPES = [
  { key:'above',    label:'Prix au-dessus',    color:'#3fb950' },
  { key:'below',    label:'Prix en-dessous',   color:'#f85149' },
  { key:'avg',      label:'Prix moyen atteint',color:'#f0883e' },
  { key:'reminder', label:'Rappel DCA',        color:'#58a6ff' },
]

export default function AlertsPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const sym   = cryptoData?.sym || 'BTC'
  const price = cryptoData?.price || 0
  const { alerts, addAlert, deleteAlert, triggerAlert } = useAlerts(sym)

  const [type,  setType]  = useState('above')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  // Check alertes déclenchées
  useEffect(() => {
    if (!price) return
    alerts.forEach(a => {
      if (a.triggered) return
      if (a.type === 'above' && price >= a.value) triggerAlert(a.id)
      if (a.type === 'below' && price <= a.value) triggerAlert(a.id)
    })
  }, [price, alerts])

  async function handleAdd() {
    if (!value) return
    setSaving(true)
    await addAlert({
      sym,
      type: type as any,
      value: parseFloat(value),
      label: label || ALERT_TYPES.find(t => t.key === type)!.label,
      triggered: false,
    })
    setValue(''); setLabel('')
    setSaving(false)
  }

  const typeLabel: Record<string, string> = {
    above:'Au-dessus de', below:'En-dessous de', avg:'Prix moyen à', reminder:'Rappel DCA à'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Alertes" subtitle="Configurez vos alertes de prix et rappels DCA"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:'16px 22px', flex:1, overflowY:'auto' }}>

        {/* FORM */}
        <div style={{ ...s.card, marginBottom:'12px' }}>
          <div style={s.sectionTitle}>+ Nouvelle alerte ({sym})</div>

          {/* TYPE SELECTOR */}
          <div style={s.typeGrid}>
            {ALERT_TYPES.map(t => (
              <div key={t.key}
                style={{ ...s.typeBtn, ...(type === t.key ? { borderColor: t.color, background: t.color+'11' } : {}) }}
                onClick={() => setType(t.key)}>
                <div style={{ fontSize:'11px', color: type === t.key ? t.color : '#8b949e', fontWeight: type === t.key ? 600 : 400 }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>

          <div style={s.formRow}>
            <div>
              <div style={s.formLabel}>Valeur ($)</div>
              <input style={s.input} type="number" placeholder="ex: 75000"
                value={value} onChange={e => setValue(e.target.value)} />
            </div>
            <div>
              <div style={s.formLabel}>Label (optionnel)</div>
              <input style={s.input} type="text" placeholder="Mon alerte"
                value={label} onChange={e => setLabel(e.target.value)} />
            </div>
            <div style={{ paddingTop:'18px' }}>
              <button style={s.btn} onClick={handleAdd} disabled={saving}>
                {saving ? '…' : '+ Ajouter'}
              </button>
            </div>
          </div>
        </div>

        {/* LISTE */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Mes alertes ({alerts.length})</div>
          {!alerts.length ? (
            <div style={s.empty}>
              <div style={{ fontSize:'28px', marginBottom:'8px', opacity:.4 }}>🔔</div>
              <p>Aucune alerte configurée pour {sym}<br/>Créez votre première alerte ci-dessus</p>
            </div>
          ) : (
            alerts.map(a => (
              <div key={a.id} style={{ ...s.alertItem, ...(a.triggered ? { borderColor:'#3fb95044' } : {}) }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ ...s.badge, ...(a.triggered ? s.badgeGreen : s.badgeOrange) }}>
                    {a.triggered ? '✓ Déclenchée' : 'En attente'}
                  </span>
                  <span style={{ fontSize:'13px', fontWeight:500, color:'#e6edf3' }}>{a.label}</span>
                  <span style={{ fontSize:'11px', color:'#8b949e' }}>
                    {typeLabel[a.type]} ${a.value.toLocaleString()}
                  </span>
                </div>
                <button style={s.deleteBtn} onClick={() => deleteAlert(a.id)}>✕</button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:        { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'13px 15px', marginBottom:'12px' },
  sectionTitle:{ fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'12px' },
  typeGrid:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' },
  typeBtn:     { background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'10px 8px', textAlign:'center', cursor:'pointer', transition:'all .15s' },
  formRow:     { display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'8px', alignItems:'end' },
  formLabel:   { fontSize:'11px', color:'#8b949e', marginBottom:'4px' },
  input:       { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'8px 10px', color:'#e6edf3', fontSize:'12px', outline:'none', boxSizing:'border-box' },
  btn:         { background:'#f0883e', border:'none', borderRadius:'6px', padding:'8px 16px', color:'#000', fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' },
  empty:       { textAlign:'center', padding:'32px', color:'#6e7681', fontSize:'12px', lineHeight:'1.6' },
  alertItem:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#21262d', borderRadius:'6px', marginBottom:'6px', border:'1px solid #30363d' },
  badge:       { display:'inline-flex', alignItems:'center', padding:'2px 7px', borderRadius:'4px', fontSize:'10px', fontWeight:'600' },
  badgeGreen:  { background:'#3fb95022', color:'#3fb950' },
  badgeOrange: { background:'#f0883e22', color:'#f0883e' },
  deleteBtn:   { background:'none', border:'none', color:'#6e7681', cursor:'pointer', fontSize:'13px', padding:'2px 6px' },
}