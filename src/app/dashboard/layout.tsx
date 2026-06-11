'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AppShell from '@/components/AppShell'

const PAGES = [
  { path:'/dashboard',           icon:'⊞', label:'Dashboard' },
  { path:'/dashboard/dca',       icon:'↗', label:'DCA' },
  { path:'/dashboard/simulator', icon:'⊟', label:'Simulateur' },
  { path:'/dashboard/alerts',    icon:'🔔', label:'Alertes' },
  { path:'/dashboard/stats',     icon:'↑', label:'Stats' },
  { path:'/dashboard/pricing',   icon:'★', label:'Pro' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser]       = useState<any>(null)
  const [plan, setPlan]       = useState<'free'|'pro'>('free')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      supabase.from('subscriptions').select('plan').eq('user_id', data.user.id).single()
        .then(({ data: sub }) => { if (sub) setPlan(sub.plan as 'free'|'pro') })
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AppShell>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0d1117' }}>

        {/* SIDEBAR desktop */}
        {!isMobile && (
          <div style={s.sidebar}>
            <div style={s.logo}>
              <div style={s.logoIcon}>D</div>
              <div>
                <div style={s.logoTitle}>DCA Tracker</div>
                <div style={s.logoSub}>Multi-Crypto Portfolio</div>
              </div>
            </div>
            <nav style={{ flex:1 }}>
              {PAGES.map(p => (
                <Link key={p.path} href={p.path} style={{
                  ...s.navItem,
                  ...(pathname === p.path ? s.navActive : {}),
                  ...(p.path === '/dashboard/pricing' ? s.navPro : {}),
                }}>
                  <span>{p.icon}</span>
                  {p.label}
                  {p.path === '/dashboard/pricing' && (
                    <span style={{ ...s.proBadge, ...(plan==='pro' ? { background:'#3fb95022', color:'#3fb950' } : {}) }}>
                      {plan === 'pro' ? 'PRO' : 'FREE'}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div style={s.sidebarBottom}>
              <div style={{ fontSize:'11px', color:'#8b949e', marginBottom:'8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.email}
              </div>
              <button style={s.logoutBtn} onClick={handleLogout}>Déconnexion</button>
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', paddingBottom: isMobile ? '65px' : '0' }}>
          {children}
        </div>

        {/* BOTTOM NAV mobile */}
        {isMobile && (
          <div style={s.bottomNav}>
            {PAGES.map(p => (
              <Link key={p.path} href={p.path} style={{
                ...s.bottomNavItem,
                ...(pathname === p.path ? s.bottomNavActive : {}),
              }}>
                <span style={{ fontSize:'18px' }}>{p.icon}</span>
                <span style={{ fontSize:'9px', marginTop:'2px' }}>{p.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

const s: Record<string, React.CSSProperties> = {
  sidebar:       { width:'190px', minWidth:'190px', background:'#161b22', borderRight:'1px solid #30363d', display:'flex', flexDirection:'column', padding:'12px 0' },
  logo:          { display:'flex', alignItems:'center', gap:'9px', padding:'10px 14px 14px', borderBottom:'1px solid #30363d', marginBottom:'8px' },
  logoIcon:      { width:'30px', height:'30px', background:'#f0883e', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'700', color:'#000', flexShrink:0 },
  logoTitle:     { fontSize:'14px', fontWeight:'600', color:'#f0883e' },
  logoSub:       { fontSize:'10px', color:'#8b949e' },
  navItem:       { display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', borderRadius:'6px', margin:'1px 6px', color:'#8b949e', fontSize:'12.5px', textDecoration:'none' },
  navActive:     { background:'#f0883e22', color:'#f0883e' },
  navPro:        { marginTop:'8px', borderTop:'1px solid #30363d', paddingTop:'16px' },
  proBadge:      { marginLeft:'auto', background:'#f0883e22', color:'#f0883e', fontSize:'9px', fontWeight:'700', padding:'2px 6px', borderRadius:'4px' },
  sidebarBottom: { padding:'12px 14px', borderTop:'1px solid #30363d', marginTop:'auto' },
  logoutBtn:     { width:'100%', background:'transparent', border:'1px solid #30363d', borderRadius:'6px', padding:'6px', color:'#8b949e', fontSize:'12px', cursor:'pointer' },
  bottomNav:     { position:'fixed', bottom:0, left:0, right:0, height:'65px', background:'#161b22', borderTop:'1px solid #30363d', display:'flex', alignItems:'center', justifyContent:'space-around', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' },
  bottomNavItem: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#8b949e', textDecoration:'none', flex:1, height:'100%' },
  bottomNavActive:{ color:'#f0883e' },
}
