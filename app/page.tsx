'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Championship, Event } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { FslLogo } from '@/components/ui/FslLogo'

export default function Home() {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [nextEvents, setNextEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [champRes, eventsRes] = await Promise.all([
        supabase.from('championships').select('*, categories(*, series(*))').eq('status', 'active').order('season', { ascending: false }),
        supabase.from('events').select('*, championships(*, categories(*))').eq('status', 'scheduled').gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(4),
      ])
      if (champRes.data) setChampionships(champRes.data)
      if (eventsRes.data) setNextEvents(eventsRes.data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="fsl-grid-bg absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fsl-black/50 to-fsl-black" />
        <div className="relative z-10 text-center px-6 animate-fade-in">
          <div className="flex justify-center mb-10">
            <FslLogo size={140} />
          </div>
          <h1 className="font-serif text-6xl md:text-8xl font-bold text-gold tracking-widest mb-4">FSL</h1>
          <p className="font-condensed text-sm tracking-[8px] text-gold-light/50 uppercase mb-8">
            Federación de Simracing Latinoamericana
          </p>
          <div className="w-24 h-px bg-gold/40 mx-auto mb-8" />
          <p className="text-gold-light/60 font-light text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            El organismo rector del simracing competitivo en América Latina. Monoplazas y Endurance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/campeonatos" className="btn-gold">Ver campeonatos</Link>
            <Link href="/inscribirse" className="btn-outline">Inscribirme</Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-gold/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Series Cards */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="fsl-label text-center mb-3">Nuestras series</div>
        <h2 className="font-serif text-4xl text-gold text-center mb-16">Dos series. Un estándar.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="fsl-card p-10 group hover:border-gold/30 transition-colors">
            <div className="fsl-label mb-4">FSL — M</div>
            <h3 className="font-serif text-3xl text-gold font-semibold mb-4">Monoplazas</h3>
            <p className="text-gold-light/50 text-sm leading-relaxed mb-6 font-light">
              Desde la puerta de entrada en F4 hasta la cima en F1. Un sistema de licencias que premia el mérito y el desarrollo del piloto.
            </p>
            <div className="flex flex-wrap gap-2">
              {['F4', 'F3', 'F2', 'F1'].map(cat => (
                <span key={cat} className="font-condensed text-[10px] tracking-[3px] border border-gold/20 text-gold/60 px-3 py-1">{cat}</span>
              ))}
            </div>
          </div>
          <div className="fsl-card p-10 group hover:border-gold/30 transition-colors">
            <div className="fsl-label mb-4">FSL — E</div>
            <h3 className="font-serif text-3xl text-gold font-semibold mb-4">Endurance</h3>
            <p className="text-gold-light/50 text-sm leading-relaxed mb-6 font-light">
              Resistencia, estrategia y precisión. Desde el TCR hasta el Hypercar, la excelencia del endurance latinoamericano.
            </p>
            <div className="flex flex-wrap gap-2">
              {['TCR', 'GT4', 'GT3', 'LMP2', 'Hypercar'].map(cat => (
                <span key={cat} className="font-condensed text-[10px] tracking-[3px] border border-gold/20 text-gold/60 px-3 py-1">{cat}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Active Championships */}
      {!loading && championships.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="fsl-label mb-3">En curso</div>
              <h2 className="font-serif text-4xl text-gold">Campeonatos activos</h2>
            </div>
            <Link href="/campeonatos" className="btn-outline text-sm">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {championships.slice(0, 6).map(champ => (
              <Link key={champ.id} href={`/campeonatos/${champ.id}`}
                className="fsl-card-hover p-6 block group">
                <div className="fsl-label mb-3">
                  {(champ as any).categories?.series?.short_name || 'FSL'} · {champ.season}
                </div>
                <h3 className="font-serif text-xl text-gold font-semibold mb-2 group-hover:text-gold transition-colors">
                  {champ.name}
                </h3>
                <p className="text-gold-light/40 text-xs font-light">{champ.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="status-active">Activo</span>
                  <span className="font-condensed text-[10px] tracking-[2px] text-gold/40 uppercase">
                    {(champ as any).categories?.short_name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Next Events */}
      {!loading && nextEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="fsl-label mb-3">Agenda</div>
              <h2 className="font-serif text-4xl text-gold">Próximos eventos</h2>
            </div>
            <Link href="/eventos" className="btn-outline text-sm">Ver calendario</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {nextEvents.map(event => {
              const date = new Date(event.scheduled_date)
              return (
                <div key={event.id} className="fsl-card p-6 flex gap-6">
                  <div className="text-center min-w-[60px]">
                    <div className="font-serif text-3xl text-gold font-bold">{date.getDate()}</div>
                    <div className="font-condensed text-[10px] tracking-[2px] text-gold/40 uppercase">
                      {date.toLocaleString('es', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 border-l border-gold/10 pl-6">
                    <div className="fsl-label mb-1">{(event as any).championships?.name}</div>
                    <div className="font-serif text-lg text-gold font-semibold">{event.name}</div>
                    <div className="text-gold-light/40 text-xs mt-1">{event.circuit_name}</div>
                    <div className="mt-3 font-condensed text-[10px] tracking-[2px] text-gold/50 uppercase">
                      {date.toLocaleString('es', { weekday: 'long', hour: '2-digit', minute: '2-digit' })} ARG
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-gold/10 bg-fsl-carbon">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="font-serif text-xl text-gold/50 italic mb-4">
            "Una federación no se construye solo con carreras. Se construye con identidad."
          </div>
          <div className="fsl-label mt-2">FSL — Federación de Simracing Latinoamericana</div>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link href="/inscribirse" className="btn-gold">Unirme a la FSL</Link>
            <Link href="/denuncia" className="btn-outline">Presentar denuncia</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
