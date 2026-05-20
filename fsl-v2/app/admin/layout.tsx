'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FslLogo } from '@/components/ui/FslLogo'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/admin/campeonatos', label: 'Campeonatos', icon: '🏆' },
  { href: '/admin/eventos', label: 'Eventos', icon: '📅' },
  { href: '/admin/pilotos', label: 'Pilotos', icon: '👤' },
  { href: '/admin/resultados', label: 'Resultados', icon: '🏁' },
  { href: '/admin/sanciones', label: 'Sanciones', icon: '⚑' },
  { href: '/admin/inscripciones', label: 'Inscripciones', icon: '📋' },
  { href: '/admin/denuncias', label: 'Denuncias', icon: '⚠' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && pathname !== '/admin') router.replace('/admin')
      setChecking(false)
    })
  }, [pathname, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-fsl-black flex items-center justify-center">
        <div className="font-condensed tracking-widest text-gold/30">Verificando acceso...</div>
      </div>
    )
  }

  if (pathname === '/admin') return <>{children}</>

  return (
    <div className="min-h-screen bg-fsl-black flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-fsl-carbon border-r border-gold/10 flex flex-col transform transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-5 border-b border-gold/10 flex items-center gap-3">
          <FslLogo size={32} />
          <div>
            <div className="font-serif text-gold font-bold tracking-widest">FSL</div>
            <div className="fsl-label" style={{ fontSize: '8px' }}>Administración</div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 text-xs font-condensed tracking-[2px] uppercase transition-colors ${
                pathname.startsWith(item.href)
                  ? 'text-gold bg-gold/5 border-r-2 border-gold'
                  : 'text-gold/40 hover:text-gold hover:bg-gold/[0.03]'
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gold/10 space-y-2">
          <Link href="/" target="_blank"
            className="block text-center text-gold/30 text-xs font-condensed tracking-widest hover:text-gold transition-colors py-2">
            Ver sitio público →
          </Link>
          <button onClick={handleLogout}
            className="w-full font-condensed text-xs tracking-widest uppercase text-red-400/60 hover:text-red-400 transition-colors py-2 border border-red-500/10 hover:border-red-500/30">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-fsl-black/90 backdrop-blur border-b border-gold/10 px-6 h-14 flex items-center justify-between">
          <button className="lg:hidden text-gold" onClick={() => setOpen(!open)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="fsl-label">
            {navItems.find(n => pathname.startsWith(n.href))?.label || 'Admin'}
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
