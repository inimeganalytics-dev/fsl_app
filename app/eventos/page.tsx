'use client'
import { useEffect, useState } from 'react'
import { supabase, Event } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import Link from 'next/link'

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  useEffect(() => {
    async function load() {
      let query = supabase.from('events')
        .select('*, championships(name, season, categories(short_name, series(short_name)))')
        .order('scheduled_date', { ascending: true })

      if (filter === 'upcoming') {
        query = query.gte('scheduled_date', new Date().toISOString()).in('status', ['scheduled', 'live'])
      }

      const { data } = await query
      if (data) setEvents(data)
      setLoading(false)
    }
    load()
  }, [filter])

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-16">
          <div className="fsl-label mb-3">Calendario FSL</div>
          <h1 className="font-serif text-5xl text-gold font-bold">Eventos</h1>
          <div className="w-16 h-px bg-gold/40 mt-6" />
        </div>

        <div className="flex gap-2 mb-12">
          {(['upcoming', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-condensed text-xs tracking-[3px] uppercase px-4 py-2 border transition-colors ${
                filter === f ? 'border-gold bg-gold/10 text-gold' : 'border-gold/20 text-gold/40 hover:border-gold/40'
              }`}>
              {f === 'upcoming' ? 'Próximos' : 'Todos'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-24 text-gold/30 font-condensed tracking-widest">Cargando...</div>
        ) : events.length === 0 ? (
          <div className="fsl-card p-16 text-center">
            <div className="font-serif text-2xl text-gold/40 mb-2">No hay eventos próximos</div>
            <p className="text-gold/20 text-sm">Los próximos eventos se anunciarán en el servidor de Discord.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const date = new Date(event.scheduled_date)
              const champ = (event as any).championships
              const isPast = date < new Date()
              return (
                <div key={event.id} className={`fsl-card p-6 flex flex-wrap md:flex-nowrap items-center gap-6 ${
                  event.status === 'live' ? 'border-gold/40' : ''
                }`}>
                  {event.status === 'live' && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold" />
                  )}
                  {/* Date */}
                  <div className="min-w-[72px] text-center border-r border-gold/10 pr-6">
                    <div className="font-serif text-4xl text-gold font-bold leading-none">{date.getDate()}</div>
                    <div className="font-condensed text-[10px] tracking-[2px] text-gold/40 uppercase mt-1">
                      {date.toLocaleString('es', { month: 'short' })} {date.getFullYear()}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="fsl-label mb-1">
                      {champ?.categories?.series?.short_name} · {champ?.name}
                    </div>
                    <div className="font-serif text-xl text-gold font-semibold">{event.name}</div>
                    <div className="text-gold-light/40 text-sm mt-1 font-light">{event.circuit_name}</div>
                  </div>
                  {/* Time */}
                  <div className="text-right min-w-[120px]">
                    <div className="font-condensed text-sm text-gold/60">
                      {date.toLocaleString('es', { hour: '2-digit', minute: '2-digit' })} hs ARG
                    </div>
                    <div className="mt-2">
                      <span className={
                        event.status === 'live' ? 'status-active' :
                        event.status === 'finished' ? 'status-finished' :
                        isPast ? 'status-finished' : 'status-pending'
                      }>
                        {event.status === 'live' ? '🔴 En vivo' :
                         event.status === 'finished' ? 'Finalizado' :
                         isPast ? 'Completado' : 'Programado'}
                      </span>
                    </div>
                  </div>
                  {/* Registration */}
                  {event.registrations_open && !isPast && (
                    <Link href="/inscribirse" className="btn-outline text-xs whitespace-nowrap">
                      Inscribirme
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
