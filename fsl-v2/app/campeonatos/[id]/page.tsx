'use client'
import { useEffect, useState } from 'react'
import { supabase, Championship, RaceResult, Event, Sanction } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import Link from 'next/link'

interface Standing {
  pilotId: string
  name: string
  country: string
  number: number
  points: number
  wins: number
  podiums: number
  fastestLaps: number
  lp: number
}

export default function ChampionshipDetail({ params }: { params: { id: string } }) {
  const [championship, setChampionship] = useState<Championship | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [sanctions, setSanctions] = useState<Sanction[]>([])
  const [activeTab, setActiveTab] = useState<'clasificacion' | 'eventos' | 'sanciones'>('clasificacion')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [champRes, eventsRes, resultsRes, sanctRes] = await Promise.all([
        supabase.from('championships').select('*, categories(*, series(*))').eq('id', params.id).single(),
        supabase.from('events').select('*').eq('championship_id', params.id).order('scheduled_date'),
        supabase.from('race_results').select('*, pilots(*, users(*)), events!inner(championship_id)').eq('events.championship_id', params.id),
        supabase.from('sanctions').select('*, pilots(*, users(*))').order('issued_at', { ascending: false }).limit(20),
      ])

      if (champRes.data) setChampionship(champRes.data)
      if (eventsRes.data) setEvents(eventsRes.data)
      if (sanctRes.data) setSanctions(sanctRes.data)

      // Build standings from results
      if (resultsRes.data) {
        const map: Record<string, Standing> = {}
        resultsRes.data.forEach((r: any) => {
          const pid = r.pilot_id
          if (!map[pid]) {
            map[pid] = {
              pilotId: pid,
              name: r.pilots?.users?.real_name || r.pilots?.users?.steam_name || 'Desconocido',
              country: r.pilots?.users?.country_code || '',
              number: r.pilots?.pilot_number || 0,
              points: 0, wins: 0, podiums: 0, fastestLaps: 0,
              lp: r.pilots?.lp || 0,
            }
          }
          if (!r.dsq && !r.dnf) {
            map[pid].points += r.points_earned || 0
            if (r.finish_position === 1) map[pid].wins++
            if (r.finish_position <= 3) map[pid].podiums++
            if (r.has_fastest_lap) map[pid].fastestLaps++
          }
        })
        setStandings(Object.values(map).sort((a, b) => b.points - a.points))
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-fsl-black flex items-center justify-center">
        <div className="font-condensed tracking-widest text-gold/30">Cargando...</div>
      </div>
    )
  }

  if (!championship) return null

  const cat = (championship as any).categories
  const series = cat?.series

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />

      {/* Header */}
      <div className="border-b border-gold/10 bg-fsl-carbon">
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-10">
          <Link href="/campeonatos" className="fsl-label hover:text-gold transition-colors mb-4 inline-block">
            ← Volver a campeonatos
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="fsl-label mb-2">{series?.short_name} · {cat?.short_name} · Temporada {championship.season}</div>
              <h1 className="font-serif text-4xl md:text-5xl text-gold font-bold">{championship.name}</h1>
            </div>
            <span className={championship.status === 'active' ? 'status-active' : 'status-finished'}>
              {championship.status === 'active' ? 'En curso' : 'Finalizado'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-gold/10 bg-fsl-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 divide-x divide-gold/10">
            {[
              { label: 'Pilotos', value: standings.length },
              { label: 'Fechas', value: events.length },
              { label: 'Completadas', value: events.filter(e => e.status === 'finished').length },
            ].map(s => (
              <div key={s.label} className="py-6 px-4 text-center">
                <div className="font-serif text-3xl text-gold font-bold">{s.value}</div>
                <div className="fsl-label mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-24">
        <div className="flex gap-0 mb-8 border-b border-gold/10">
          {(['clasificacion', 'eventos', 'sanciones'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`font-condensed text-xs tracking-[3px] uppercase px-6 py-4 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gold/40 hover:text-gold/60'
              }`}>
              {tab === 'clasificacion' ? 'Clasificación' : tab === 'eventos' ? 'Calendario' : 'Sanciones'}
            </button>
          ))}
        </div>

        {/* Standings */}
        {activeTab === 'clasificacion' && (
          <div>
            {standings.length === 0 ? (
              <div className="fsl-card p-12 text-center">
                <div className="font-serif text-xl text-gold/40">No hay resultados todavía</div>
                <p className="text-gold-light/30 text-sm mt-2">Los resultados se mostrarán una vez completada la primera fecha.</p>
              </div>
            ) : (
              <div className="fsl-card overflow-hidden">
                <table className="fsl-table">
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>#</th>
                      <th>Piloto</th>
                      <th>País</th>
                      <th className="text-center">Victorias</th>
                      <th className="text-center">Podios</th>
                      <th className="text-center">V. Rápidas</th>
                      <th className="text-right">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr key={s.pilotId} className={i < 3 ? 'bg-gold/[0.02]' : ''}>
                        <td>
                          <span className="font-serif text-lg font-bold text-gold">{i + 1}°</span>
                        </td>
                        <td>
                          <span className="font-condensed text-gold/60">{s.number || '—'}</span>
                        </td>
                        <td>
                          <span className="text-gold-light font-medium">{s.name}</span>
                        </td>
                        <td>
                          <span className="text-gold/40 font-condensed text-xs tracking-widest uppercase">{s.country}</span>
                        </td>
                        <td className="text-center text-gold/60">{s.wins}</td>
                        <td className="text-center text-gold/60">{s.podiums}</td>
                        <td className="text-center text-gold/60">{s.fastestLaps}</td>
                        <td className="text-right">
                          <span className="font-condensed text-lg font-bold text-gold">{s.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Events */}
        {activeTab === 'eventos' && (
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="fsl-card p-12 text-center">
                <div className="font-serif text-xl text-gold/40">No hay fechas programadas</div>
              </div>
            ) : events.map((event, i) => {
              const date = new Date(event.scheduled_date)
              return (
                <div key={event.id} className="fsl-card p-5 flex items-center gap-6">
                  <div className="font-condensed text-sm text-gold/30 min-w-[32px]">F{i + 1}</div>
                  <div className="min-w-[64px] text-center">
                    <div className="font-serif text-2xl text-gold font-bold">{date.getDate()}</div>
                    <div className="font-condensed text-[9px] tracking-[2px] text-gold/40 uppercase">
                      {date.toLocaleString('es', { month: 'short' })}
                    </div>
                  </div>
                  <div className="border-l border-gold/10 pl-6 flex-1">
                    <div className="font-serif text-lg text-gold font-semibold">{event.name}</div>
                    <div className="text-gold-light/40 text-sm mt-1">{event.circuit_name}</div>
                  </div>
                  <div className="ml-auto">
                    <span className={
                      event.status === 'finished' ? 'status-finished' :
                      event.status === 'live' ? 'status-active' :
                      'status-pending'
                    }>
                      {event.status === 'finished' ? 'Finalizada' : event.status === 'live' ? 'En vivo' : 'Programada'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sanctions */}
        {activeTab === 'sanciones' && (
          <div>
            {sanctions.length === 0 ? (
              <div className="fsl-card p-12 text-center">
                <div className="font-serif text-xl text-gold/40">Sin sanciones registradas</div>
              </div>
            ) : (
              <div className="fsl-card overflow-hidden">
                <table className="fsl-table">
                  <thead>
                    <tr>
                      <th>Piloto</th>
                      <th>Tipo</th>
                      <th>Sanción</th>
                      <th>LP</th>
                      <th>Motivo</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctions.map(s => (
                      <tr key={s.id}>
                        <td className="text-gold-light">{(s as any).pilots?.users?.real_name || '—'}</td>
                        <td>
                          <span className="font-condensed text-xs tracking-widest text-gold/60">{s.sanction_type}</span>
                        </td>
                        <td>
                          {s.dsq ? (
                            <span className="text-red-400 font-condensed font-semibold">DSQ</span>
                          ) : s.time_penalty ? (
                            <span className="text-gold font-condensed">+{s.time_penalty}s</span>
                          ) : s.suspension_races ? (
                            <span className="text-orange-400 font-condensed">{s.suspension_races} fecha(s)</span>
                          ) : '—'}
                        </td>
                        <td>
                          {s.lp_penalty ? (
                            <span className="text-red-400 font-condensed">−{s.lp_penalty} LP</span>
                          ) : '—'}
                        </td>
                        <td className="text-gold-light/40 text-xs max-w-xs truncate">{s.reason}</td>
                        <td className="text-gold/30 text-xs font-condensed">
                          {new Date(s.issued_at).toLocaleDateString('es')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
