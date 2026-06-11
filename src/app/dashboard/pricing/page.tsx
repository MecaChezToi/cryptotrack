'use client'
import { useState } from 'react'
import { useApp } from '@/components/AppShell'
import { usePlan } from '@/hooks/usePlan'
import Topbar from '@/components/Topbar'

const FREE_FEATURES = [
  '2 cryptos suivies',
  '10 transactions max',
  'Prix live',
  'Dashboard basique',
]

const PRO_FEATURES = [
  'Toutes les cryptos (BTC, ETH, SOL, BNB, XRP, SUI, ONDO, HYPE)',
  'Transactions illimitées',
  'Simulateur DCA',
  'Alertes de prix',
  'Statistiques avancées',
  'Données temps réel',
  'Support prioritaire',
]

export default function PricingPage() {
  const { cryptoId, setCryptoId, cryptoData, cryptoLoading } = useApp()
  const { plan, isPro } = usePlan()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      alert('Erreur lors de la redirection vers Stripe')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      alert('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <Topbar title="Abonnement" subtitle="Gérez votre plan et accédez aux fonctionnalités Pro"
        cryptoId={cryptoId} onCryptoChange={setCryptoId} cryptoData={cryptoData} cryptoLoading={cryptoLoading} />

      <div style={{ padding:'24px 22px', flex:1, overflowY:'auto' }}>

        {isPro && (
          <div style={s.proBanner}>
            <span style={{ fontSize:'16px' }}>✓</span>
            <div>
              <div style={{ fontWeight:600, color:'#3fb950' }}>Vous êtes Pro !</div>
              <div style={{ fontSize:'12px', color:'#8b949e', marginTop:'2px' }}>Toutes les fonctionnalités sont débloquées</div>
            </div>
            <button style={s.portalBtn} onClick={handlePortal} disabled={loading}>
              Gérer l'abonnement
            </button>
          </div>
        )}

        <div style={s.grid2}>
          {/* FREE */}
          <div style={s.card}>
            <div style={s.planName}>Free</div>
            <div style={s.planPrice}>$0<span style={s.planPer}>/mois</span></div>
            <div style={s.planSub}>Pour découvrir l'application</div>

            <div style={s.divider} />

            <div style={s.featureList}>
              {FREE_FEATURES.map(f => (
                <div key={f} style={s.feature}>
                  <span style={{ color:'#8b949e' }}>✓</span>
                  <span style={{ color:'#8b949e' }}>{f}</span>
                </div>
              ))}
            </div>

            <button style={s.currentBtn} disabled>
              {plan === 'free' ? 'Plan actuel' : 'Plan de base'}
            </button>
          </div>

          {/* PRO */}
          <div style={{ ...s.card, ...s.cardPro }}>
            <div style={s.proBadge}>Recommandé</div>
            <div style={s.planName}>Pro</div>
            <div style={{ ...s.planPrice, color:'#f0883e' }}>
              4,99€<span style={s.planPer}>/mois</span>
            </div>
            <div style={s.planSub}>Pour les investisseurs sérieux</div>

            <div style={s.divider} />

            <div style={s.featureList}>
              {PRO_FEATURES.map(f => (
                <div key={f} style={s.feature}>
                  <span style={{ color:'#f0883e' }}>✓</span>
                  <span style={{ color:'#e6edf3' }}>{f}</span>
                </div>
              ))}
            </div>

            {isPro ? (
              <button style={s.currentBtn} disabled>Plan actuel ✓</button>
            ) : (
              <button style={s.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
                {loading ? 'Redirection…' : 'Passer Pro →'}
              </button>
            )}
          </div>
        </div>

        <div style={s.faq}>
          <div style={s.faqTitle}>Questions fréquentes</div>
          {[
            { q:'Puis-je annuler à tout moment ?', r:'Oui, vous pouvez annuler votre abonnement à tout moment depuis le portail de gestion.' },
            { q:'Les données sont-elles sécurisées ?', r:'Oui, toutes les données sont stockées de manière sécurisée avec Supabase et chaque utilisateur ne voit que ses propres données.' },
            { q:'Quels moyens de paiement sont acceptés ?', r:'Carte bancaire (Visa, Mastercard, Amex) via Stripe, le leader mondial du paiement en ligne.' },
          ].map(({ q, r }) => (
            <div key={q} style={s.faqItem}>
              <div style={s.faqQ}>{q}</div>
              <div style={s.faqR}>{r}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid2:      { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:'16px', marginBottom:'24px', maxWidth:'800px' },
  card:       { background:'#1c2128', border:'1px solid #30363d', borderRadius:'12px', padding:'24px', position:'relative' },
  cardPro:    { border:'1px solid #f0883e44' },
  proBanner:  { display:'flex', alignItems:'center', gap:'12px', background:'#3fb95011', border:'1px solid #3fb95033', borderRadius:'8px', padding:'14px 16px', marginBottom:'20px' },
  proBadge:   { position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#f0883e', color:'#000', fontSize:'11px', fontWeight:'700', padding:'3px 12px', borderRadius:'20px', whiteSpace:'nowrap' },
  planName:   { fontSize:'18px', fontWeight:'700', color:'#e6edf3', marginBottom:'8px', marginTop:'8px' },
  planPrice:  { fontSize:'32px', fontWeight:'700', color:'#e6edf3', lineHeight:'1' },
  planPer:    { fontSize:'14px', fontWeight:'400', color:'#8b949e' },
  planSub:    { fontSize:'12px', color:'#8b949e', marginTop:'6px' },
  divider:    { height:'1px', background:'#30363d', margin:'16px 0' },
  featureList:{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' },
  feature:    { display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px' },
  upgradeBtn: { width:'100%', background:'#f0883e', border:'none', borderRadius:'8px', padding:'12px', color:'#000', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  currentBtn: { width:'100%', background:'transparent', border:'1px solid #30363d', borderRadius:'8px', padding:'12px', color:'#8b949e', fontSize:'14px', cursor:'not-allowed' },
  portalBtn:  { marginLeft:'auto', background:'transparent', border:'1px solid #3fb950', borderRadius:'6px', padding:'6px 12px', color:'#3fb950', fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap' },
  faq:        { maxWidth:'800px' },
  faqTitle:   { fontSize:'15px', fontWeight:'600', color:'#e6edf3', marginBottom:'14px' },
  faqItem:    { background:'#1c2128', border:'1px solid #30363d', borderRadius:'8px', padding:'14px 16px', marginBottom:'8px' },
  faqQ:       { fontSize:'13px', fontWeight:'600', color:'#e6edf3', marginBottom:'6px' },
  faqR:       { fontSize:'12px', color:'#8b949e', lineHeight:'1.6' },
}