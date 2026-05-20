'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import Link from 'next/link'

function msToTime(ms: number): string {
  if (!ms || ms <= 0) return '—'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = String(ms % 1000).padStart(3, '0')
  return `${minutes}:${String(seconds).padStart(2, '0')}.${millis}`
}

function getLicenseClass(lp: number): { letter: string; label: string; color: string } {
  if (lp >= 400) return { letter: 'A', label: 'Profesional', color: 'text-gold' }
  if (lp >= 200) return { letter: 'B', label: 'Semiprofesional', color: 'text-gold' }
  if (lp >= 80) return { letter: 'C', label: 'Amateur', color: 'text-gold-light' }
  return { letter: 'D', label: 'Rookie', color: 'text-gold-light/60' }
}

export default function PilotProfile({ params }: { params: { steamId: string } }) {
  const [pilot, setPilot] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      // Buscar user por steam_id
      const { data: user } = await supabase.from('users')
        .select('*').eq('steam_id', params.steamId).single()

      if (!user) { setNotFound(true); setLoading(false); return }

      // Buscar pilot
      const { data: pilotData } = await supabase.from('pilots')
        .select('*').eq('user_id', user.id).single()

      if (!pilotData) { setNotFound(true); setLoading(false); return }

      setPilot({ ...pilotData, users: user })

      // Resultados de todas las carreras
      const { data: resData } = await supabase.from('race_results')
        .select('*, events(name, scheduled_date, circuit_name, championship_id, championships(name, season, categories(short_name, series(short_name))))')
        .eq('pilot_id', pilotData.id)
        .order('created_at', { ascending: false })
      if (resData) setResults(resData)

      // Campeonatos enrollados
      const { data: enrollData } = await supabase.from('championship_enrollments')
        .select('*, championships(name, season, status, categories(short_name, series(short_name)))')
        .eq('pilot_id', pilotData.id)
      if (enrollData) setEnrollments(enrollData)

      setLoading(false)
    }
    load()
  }, [params.steamId])

  if (loading) return (
    <div className="min-h-screen bg-fsl-black flex items-center justify-center">
      <div className="font-condensed tracking-widest text-gold/30">Cargando...</div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="fsl-card p-16">
          <div className="font-serif text-5xl text-gold mb-4">?</div>
          <h2 className="font-serif text-3xl text-gold font-bold mb-4">Piloto no encontrado</h2>
          <p className="text-gold-light/40 mb-8">Steam ID: <span className="font-condensed tracking-widest">{params.steamId}</span></p>
          <Link href="/" className="btn-outline">Volver al inicio</Link>
        </div>
      </div>
      <Footer />
    </div>
  )

  const user = pilot?.users
  const lp = pilot?.lp || 0
  const license = getLicenseClass(lp)
  const totalPoints = results.reduce((acc, r) => acc + (r.points_earned || 0), 0)
  const fastestLaps = results.filter(r => r.has_fastest_lap).length
  const poles = results.filter(r => r.pole_position).length

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />

      {/* Header piloto */}
      <div className="border-b border-gold/10 bg-fsl-carbon">
        <div className="max-w-5xl mx-auto px-6 pt-28 pb-10">
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <div className="fsl-label mb-2">Perfil de piloto</div>
              <h1 className="font-serif text-4xl md:text-5xl text-gold font-bold">
                {user?.real_name || user?.steam_name}
              </h1>
              {user?.nickname && (
                <div className="text-gold/40 text-xl font-serif italic mt-1">"{user.nickname}"</div>
              )}
              <div className="flex items-center gap-4 mt-3">
                {pilot?.pilot_number && (
                  <span className="font-condensed text-2xl text-gold/60">#{pilot.pilot_number}</span>
                )}
                <span className="font-condensed text-xs tracking-[3px] text-gold/40 uppercase">{user?.country_code}</span>
                <span className="font-condensed text-[10px] tracking-[3px] text-gold/30 uppercase">
                  {user?.steam_id}
                </span>
              </div>
            </div>
            {/* Licencia */}
            <div className="ml-auto text-center fsl-card px-8 py-5">
              <div className={`font-serif text-6xl font-bold ${license.color}`}>{license.letter}</div>
              <div className="fsl-label mt-1">{license.label}</div>
              <div className="font-condensed text-xl text-gold mt-2">{lp} LP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="border-b border-gold/10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-5 divide-x divide-gold/10">
            {[
              { label: 'Carreras', value: pilot?.total_races || 0 },
              { label: 'Victorias', value: pilot?.total_wins || 0 },
              { label: 'Podios', value: pilot?.total_podiums || 0 },
              { label: 'V. Rápidas', value: fastestLaps },
              { label: 'Puntos totales', value: totalPoints },
            ].map(s => (
              <div key={s.label} className="py-6 px-4 text-center">
                <div className="font-serif text-3xl text-gold font-bold">{s.value}</div>
                <div className="fsl-label mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* Campeonatos inscripto */}
        {enrollments.length > 0 && (
          <div>
            <div className="fsl-label mb-4">Campeonatos</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {enrollments.map(e => (
                <Link key={e.id} href={`/campeonatos/${e.championship_id}`}
                  className="fsl-card-hover p-5 block">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="fsl-label mb-1">
                        {e.championships?.categories?.series?.short_name} · {e.championships?.categories?.short_name}
                      </div>
                      <div className="font-serif text-lg text-gold">{e.championships?.name}</div>
                      <div className="text-gold/30 text-xs mt-1">Temporada {e.championships?.season}</div>
                    </div>
                    <span className={e.championships?.status === 'active' ? 'status-active' : 'status-finished'}>
                      {e.championships?.status === 'active' ? 'Activo' : 'Finalizado'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Historial de resultados */}
        <div>
          <div className="fsl-label mb-4">Historial de carreras</div>
          {results.length === 0 ? (
            <div className="fsl-card p-12 text-center text-gold/30 font-serif text-xl">Sin resultados todavía</div>
          ) : (
            <div className="fsl-card overflow-hidden">
              <table className="fsl-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Campeonato</th>
                    <th>Fecha</th>
                    <th className="text-center">Pos.</th>
                    <th>Mejor vuelta</th>
                    <th className="text-center">FL</th>
                    <th className="text-right">Pts</th>
                    <th className="text-right">LP</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => {
                    const champ = r.events?.championships
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="text-gold-light">{r.events?.name}</div>
                          <div className="text-gold/30 text-xs">{r.events?.circuit_name}</div>
                        </td>
                        <td>
                          <div className="fsl-label">{champ?.categories?.series?.short_name} · {champ?.categories?.short_name}</div>
                          <div className="text-gold/50 text-xs">{champ?.name}</div>
                        </td>
                        <td className="text-gold/40 text-xs font-condensed whitespace-nowrap">
                          {new Date(r.events?.scheduled_date).toLocaleDateString('es')}
                        </td>
                        <td className="text-center">
                          <span className="font-serif text-xl font-bold text-gold">
                            {r.dsq ? 'DSQ' : r.dnf ? 'DNF' : `${r.finish_position}°`}
                          </span>
                        </td>
                        <td className="font-condensed text-gold/60">
                          {r.best_lap_ms ? msToTime(r.best_lap_ms) : r.best_lap_time || '—'}
                        </td>
                        <td className="text-center">{r.has_fastest_lap ? <span className="text-purple-400 font-bold">★</span> : '—'}</td>
                        <td className="text-right font-condensed font-bold text-gold">{r.points_earned}</td>
                        <td className="text-right font-condensed text-emerald-400/70">+{r.lp_earned}</td>
                        <td>
                          <span className={r.result_status === 'final' ? 'status-finished text-[9px]' : 'status-pending text-[9px]'}>
                            {r.result_status === 'final' ? 'Final' : 'Preliminar'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
