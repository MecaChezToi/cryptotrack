'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister() {
    setLoading(true)
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); setLoading(false); return }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min)'); setLoading(false); return }

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    router.push('/dashboard')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>D</div>
          <div>
            <div style={styles.logoTitle}>DCA Tracker</div>
            <div style={styles.logoSub}>Multi-Crypto Portfolio</div>
          </div>
        </div>

        <h1 style={styles.title}>Créer un compte</h1>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Mot de passe</label>
          <input style={styles.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Confirmer le mot de passe</label>
          <input style={styles.input} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
        </div>

        <button style={styles.btn} onClick={handleRegister} disabled={loading}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>

        <p style={styles.switch}>
          Déjà un compte ?{' '}
          <Link href="/login" style={styles.link}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:'12px', padding:'36px', width:'100%', maxWidth:'400px' },
  logo: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' },
  logoIcon: { width:'36px', height:'36px', background:'#f0883e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'700', color:'#000' },
  logoTitle: { fontSize:'16px', fontWeight:'600', color:'#f0883e' },
  logoSub: { fontSize:'11px', color:'#8b949e' },
  title: { fontSize:'22px', fontWeight:'600', color:'#e6edf3', marginBottom:'24px' },
  error: { background:'#f8514922', border:'1px solid #f85149', borderRadius:'6px', padding:'10px 12px', color:'#f85149', fontSize:'13px', marginBottom:'16px' },
  field: { marginBottom:'16px' },
  label: { display:'block', fontSize:'12px', color:'#8b949e', marginBottom:'6px' },
  input: { width:'100%', background:'#21262d', border:'1px solid #30363d', borderRadius:'6px', padding:'10px 12px', color:'#e6edf3', fontSize:'14px', outline:'none', boxSizing:'border-box' },
  btn: { width:'100%', background:'#f0883e', border:'none', borderRadius:'6px', padding:'11px', color:'#000', fontSize:'14px', fontWeight:'600', cursor:'pointer', marginTop:'8px' },
  switch: { textAlign:'center', fontSize:'13px', color:'#8b949e', marginTop:'20px' },
  link: { color:'#f0883e', textDecoration:'none' },
}