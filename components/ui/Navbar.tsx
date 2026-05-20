'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FslLogo } from './FslLogo'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/campeonatos', label: 'Campeonatos' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/inscribirse', label: 'Inscribirse' },
  { href: '/denuncia', label: 'Denuncias' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-fsl-black/95 backdrop-blur-sm border-b border-gold/10">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <FslLogo size={36} />
          <span className="font-serif text-gold font-bold text-xl tracking-widest hidden sm:block">FSL</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-condensed text-xs tracking-[3px] uppercase transition-colors ${
                pathname === link.href
                  ? 'text-gold'
                  : 'text-gold-light/50 hover:text-gold'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-gold"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-fsl-carbon border-t border-gold/10">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-6 py-4 font-condensed text-xs tracking-[3px] uppercase border-b border-gold/[0.06] transition-colors ${
                pathname === link.href ? 'text-gold' : 'text-gold-light/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
