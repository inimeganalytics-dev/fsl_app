import Link from 'next/link'
import { FslLogo } from './FslLogo'

export function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-fsl-black mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FslLogo size={40} />
              <span className="font-serif text-gold font-bold text-2xl tracking-widest">FSL</span>
            </div>
            <p className="text-gold-light/40 text-sm leading-relaxed font-light">
              Federación de Simracing Latinoamericana. El organismo rector del simracing competitivo en América Latina.
            </p>
          </div>
          <div>
            <div className="fsl-label mb-4">Navegación</div>
            <div className="flex flex-col gap-2">
              {[
                { href: '/campeonatos', label: 'Campeonatos' },
                { href: '/eventos', label: 'Próximos eventos' },
                { href: '/inscribirse', label: 'Inscribirse' },
                { href: '/denuncia', label: 'Presentar denuncia' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-gold-light/50 hover:text-gold text-sm transition-colors font-light">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="fsl-label mb-4">Administración</div>
            <Link href="/admin" className="text-gold-light/50 hover:text-gold text-sm transition-colors font-light block mb-2">
              Panel de administración
            </Link>
            <div className="mt-6 pt-6 border-t border-gold/10">
              <div className="fsl-label mb-2">Temporada</div>
              <div className="font-serif text-gold text-lg">2025</div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gold/10 text-center">
          <span className="font-condensed text-[10px] tracking-[5px] text-gold/20 uppercase">
            FSL — Federación de Simracing Latinoamericana · Todos los derechos reservados
          </span>
        </div>
      </div>
    </footer>
  )
}
