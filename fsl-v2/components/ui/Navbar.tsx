'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FslLogo } from './FslLogo'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/campeonatos', label: 'Campeonatos' },
  { href: '/eventos', label: 'Calendario' },
  { href: '/pilotos', label: 'Pilotos' },
  { href: '/denuncia', label: 'Denuncias' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-fsl-dark border-b-2 border-gold">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

        {/* Logo + Wordmark */}
        <Link href="/" className="flex items-center gap-3">
          <FslLogo size={34} />
          <div className="hidden sm:block w-px h-7 bg-fsl-border" />
          <div className="hidden sm:block">
            <div className="font-condensed font-black text-[17px] text-white tracking-[3px] leading-none">FSL</div>
            <div className="font-condensed text-[8px] tracking-[4px] uppercase text-gold leading-none mt-1">
              Federación de Simracing Latinoamericana
            </div>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`font-condensed text-[11px] tracking-[3px] uppercase px-4 h-14 flex items-center border-b-2 -mb-0.5 transition-colors ${
                pathname === link.href
                  ? 'text-white border-gold'
                  : 'text-fsl-muted border-transparent hover:text-white'
              }`}>
              {link.label}
            </Link>
          ))}
          <Link href="/inscribirse"
            className="ml-4 bg-gold text-fsl-dark font-condensed font-bold text-[10px] tracking-[3px] uppercase px-5 py-2 hover:bg-gold-hover transition-colors">
            Inscribirme
          </Link>
        </div>

        {/* Mobile burger */}
        <button className="md:hidden text-gold" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-fsl-carbon border-t border-fsl-border">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className={`block px-6 py-4 font-condensed text-[11px] tracking-[3px] uppercase border-b border-fsl-border/40 transition-colors ${
                pathname === link.href ? 'text-gold' : 'text-fsl-muted'
              }`}>
              {link.label}
            </Link>
          ))}
          <Link href="/inscribirse" onClick={() => setOpen(false)}
            className="block px-6 py-4 bg-gold text-fsl-dark font-condensed font-bold text-[11px] tracking-[3px] uppercase text-center">
            Inscribirme
          </Link>
        </div>
      )}
    </nav>
  )
}
