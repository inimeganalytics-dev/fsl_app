import Link from 'next/link'
import { FslLogo } from './FslLogo'

export function Footer() {
  return (
    <footer className="bg-fsl-dark border-t border-fsl-border">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FslLogo size={22} />
          <span className="font-condensed text-[9px] tracking-[4px] uppercase text-fsl-dim">
            FSL · Federación de Simracing Latinoamericana
          </span>
        </div>
        <div className="flex gap-6">
          {[
            { href: '/campeonatos', label: 'Campeonatos' },
            { href: '/eventos', label: 'Calendario' },
            { href: '/denuncia', label: 'Denuncias' },
            { href: '/admin', label: 'Admin' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="font-condensed text-[9px] tracking-[3px] uppercase text-fsl-dim hover:text-gold transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
