'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// Formatea milisegundos a MM:SS.mmm
function msToTime(ms: number): string {
  if (!ms || ms <= 0) return '—'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = String(ms % 1000).padStart(3, '0')
  return `${minutes}:${String(seconds).padStart(2, '0')}.${millis}`
}

// Calcula LP automáticamente según reglas FSL
function calcLP(pos: number, totalDrivers: number, hasFastestLap: boolean, totalCuts: number, hasPenalty: boolean, dsq: boolean, dnf: boolean): number {
  if (dsq) return 0
  let lp = 0
  if (!dnf) {
    lp += 3 // Completar carrera
    lp += 1 // Clasificarse y presentarse
    if (totalCuts === 0 && !hasPenalty) lp += 5 // Sin incidentes
    if (pos <= Math.ceil(totalDrivers / 2)) lp += 2 // Top 50%
    if (pos === 1) lp += 3 // Victoria
    else if (pos <= 3) lp += 2 // Podio
    if (hasFastestLap) lp += 1 // Vuelta rápida
  }
  return lp
}

interface ACResult {
  DriverGuid: string
  DriverName: string
  CarModel: string
  BestLap: number
  TotalTime: number
  HasPenalty: boolean
  PenaltyTime: number
  Disqualified: boolean
}

interface ACLap {
  DriverGuid: string
  DriverName: string
  LapTime: number
  Cuts: number
}

interface ParsedResult {
  position: number
  driverGuid: string
  driverName: string
  carModel: string
  bestLapMs: number
  totalTimeMs: number
  gapMs: number
  hasPenalty: boolean
  dsq: boolean
  totalCuts: number
  lapsCompleted: number
  // Resuelto
  pilotId: string | null
  pilotName: string | null
  pilotNumber: number | null
  // Calculado
  points: number
  lp: number
  hasFastestLap: boolean
}

export default function AdminResultados() {
  const [events, setEvents] = useState<any[]>([])
  const [championships, setChampionships] = useState<any[]>([])
  const [pilots, setPilots] = useState<any[]>([]) // con steam_id
  const [selectedEvent, setSelectedEvent] = useState('')
  const [filterChamp, setFilterChamp] = useState('')
  const [existingResults, setExistingResults] = useState<any[]>([])
  const [parsed, setParsed] = useState<ParsedResult[]>([])
  const [sessionType, setSessionType] = useState('')
  const [trackName, setTrackName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [e, c, p] = await Promise.all([
      supabase.from('events').select('*, championships(name, season, categories(short_name, points_system, series(short_name)))').order('scheduled_date', { ascending: false }),
      supabase.from('championships').select('*, categories(short_name, series(short_name))').order('season', { ascending: false }),
      supabase.from('pilots').select('*, users(real_name, steam_name, steam_id, country_code)'),
    ])
    if (e.data) setEvents(e.data)
    if (c.data) setChampionships(c.data)
    if (p.data) setPilots(p.data)
  }

  useEffect(() => { load() }, [])

  async function loadExisting() {
    if (!selectedEvent) return
    const { data } = await supabase.from('race_results')
      .select('*, pilots(*, users(real_name, steam_name))')
      .eq('event_id', selectedEvent)
      .order('finish_position')
    if (data) setExistingResults(data)
  }

  useEffect(() => { loadExisting() }, [selectedEvent])

  const event = events.find(e => e.id === selectedEvent)
  const pointsSystem: Record<string, number> = event?.championships?.categories?.points_system || {}

  function getPoints(pos: number): number {
    return pointsSystem[String(pos)] || 0
  }

  function parseJSON(json: any): ParsedResult[] {
    const results: ACResult[] = json.Result || []
    const laps: ACLap[] = json.Laps || []
    const type: string = json.Type || 'RACE'
    const track: string = `${json.TrackName}${json.TrackConfig ? ' / ' + json.TrackConfig : ''}`

    setSessionType(type)
    setTrackName(track)

    // Contar vueltas y cortes por DriverGuid
    const lapsByDriver: Record<string, { count: number; cuts: number }> = {}
    for (const lap of laps) {
      if (!lap.DriverGuid) continue
      if (!lapsByDriver[lap.DriverGuid]) lapsByDriver[lap.DriverGuid] = { count: 0, cuts: 0 }
      lapsByDriver[lap.DriverGuid].count++
      lapsByDriver[lap.DriverGuid].cuts += lap.Cuts || 0
    }

    // Deduplicar: un driver puede aparecer con múltiples autos — quedarnos con el mejor
    const seen = new Set<string>()
    const deduped = results.filter(r => {
      if (!r.DriverGuid || seen.has(r.DriverGuid)) return false
      seen.add(r.DriverGuid)
      return true
    })

    // Vuelta rápida: menor BestLap entre todos
    const bestLapTime = Math.min(...deduped.filter(r => r.BestLap > 0).map(r => r.BestLap))
    const leaderTime = deduped[0]?.TotalTime || 0

    const totalDrivers = deduped.length

    return deduped.map((r, i) => {
      const pos = i + 1
      const guid = r.DriverGuid
      const driverLaps = lapsByDriver[guid] || { count: 0, cuts: 0 }
      const hasFastestLap = r.BestLap === bestLapTime && r.BestLap > 0

      // Buscar piloto por Steam ID (guid)
      const pilot = pilots.find(p => p.users?.steam_id === guid)

      const pts = getPoints(pos)
      const lp = calcLP(pos, totalDrivers, hasFastestLap, driverLaps.cuts, r.HasPenalty, r.Disqualified, false)

      return {
        position: pos,
        driverGuid: guid,
        driverName: r.DriverName,
        carModel: r.CarModel,
        bestLapMs: r.BestLap,
        totalTimeMs: r.TotalTime,
        gapMs: pos === 1 ? 0 : r.TotalTime - leaderTime,
        hasPenalty: r.HasPenalty,
        dsq: r.Disqualified,
        totalCuts: driverLaps.cuts,
        lapsCompleted: driverLaps.count,
        pilotId: pilot?.id || null,
        pilotName: pilot ? (pilot.users?.real_name || pilot.users?.steam_name) : null,
        pilotNumber: pilot?.pilot_number || null,
        points: r.Disqualified ? 0 : pts,
        lp,
        hasFastestLap,
      }
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMsg('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        const results = parseJSON(json)
        setParsed(results)
        setMsg(`${results.length} pilotos cargados desde ${json.Type} — ${json.TrackName}`)
      } catch {
        setMsg('Error al parsear el JSON. Verificá que sea un archivo válido de Assetto Corsa.')
      }
      setLoading(false)
    }
    reader.readAsText(file)
  }

  function updatePilotMatch(index: number, pilotId: string) {
    const pilot = pilots.find(p => p.id === pilotId)
    setParsed(prev => prev.map((r, i) => i === index ? {
      ...r,
      pilotId: pilotId || null,
      pilotName: pilot ? (pilot.users?.real_name || pilot.users?.steam_name) : null,
      pilotNumber: pilot?.pilot_number || null,
    } : r))
  }

  async function saveResults(status: 'preliminary' | 'final') {
    if (!selectedEvent) { setMsg('Seleccioná un evento primero.'); return }
    if (parsed.length === 0) { setMsg('Cargá un archivo JSON primero.'); return }
    setSaving(true)
    setMsg('')

    // Borrar resultados existentes del evento
    await supabase.from('race_results').delete().eq('event_id', selectedEvent)

    const rows = parsed.map(r => ({
      event_id: selectedEvent,
      pilot_id: r.pilotId,
      finish_position: r.position,
      qualifying_position: r.position,
      best_lap_time: msToTime(r.bestLapMs),
      best_lap_ms: r.bestLapMs,
      total_time_ms: r.totalTimeMs,
      gap_ms: r.gapMs,
      laps_completed: r.lapsCompleted,
      points_earned: r.points,
      lp_earned: r.lp,
      has_fastest_lap: r.hasFastestLap,
      total_cuts: r.totalCuts,
      dnf: false,
      dsq: r.dsq,
      pole_position: r.position === 1,
      car_model: r.carModel,
      result_status: status,
      session_type: sessionType,
    })).filter(r => r.pilot_id) // solo guardar los que tienen piloto matcheado

    const skipped = parsed.length - rows.length
    const { error } = await supabase.from('race_results').insert(rows)

    if (error) { setMsg('Error al guardar: ' + error.message); setSaving(false); return }

    // Actualizar LP de cada piloto
    for (const r of parsed) {
      if (!r.pilotId || r.lp === 0) continue
      const pilot = pilots.find(p => p.id === r.pilotId)
      if (!pilot) continue
      const newLP = Math.max(0, (pilot.lp || 0) + r.lp)
      await supabase.from('pilots').update({
        lp: newLP,
        total_races: (pilot.total_races || 0) + 1,
        total_wins: r.position === 1 ? (pilot.total_wins || 0) + 1 : pilot.total_wins || 0,
        total_podiums: r.position <= 3 ? (pilot.total_podiums || 0) + 1 : pilot.total_podiums || 0,
      }).eq('id', r.pilotId)
    }

    // Marcar evento como finalizado si es resultado final
    if (status === 'final') {
      await supabase.from('events').update({ status: 'finished' }).eq('id', selectedEvent)
    }

    setMsg(`✓ ${rows.length} resultados guardados como ${status === 'final' ? 'FINAL' : 'PRELIMINAR'}${skipped > 0 ? ` · ${skipped} sin match ignorados` : ''}. LP actualizados.`)
    loadExisting()
    load() // refrescar pilotos con LP actualizado
    setSaving(false)
  }

  const unmatchedCount = parsed.filter(r => !r.pilotId).length
  const filteredEvents = filterChamp ? events.filter(e => e.championship_id === filterChamp) : events

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-serif text-3xl text-gold font-bold mb-8">Resultados</h1>

      {/* Selector de evento */}
      <div className="fsl-card p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Campeonato</label>
          <select className="fsl-select" value={filterChamp} onChange={e => setFilterChamp(e.target.value)}>
            <option value="">Todos</option>
            {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Evento *</label>
          <select className="fsl-select" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">Seleccioná un evento</option>
            {filteredEvents.map(e => (
              <option key={e.id} value={e.id}>
                {e.championships?.categories?.series?.short_name} · {e.name} ({new Date(e.scheduled_date).toLocaleDateString('es')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultados existentes */}
      {selectedEvent && existingResults.length > 0 && (
        <div className="fsl-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="fsl-label">Resultados actuales</div>
            <div className="flex items-center gap-3">
              <span className={existingResults[0]?.result_status === 'final' ? 'status-active' : 'status-pending'}>
                {existingResults[0]?.result_status === 'final' ? 'Final' : 'Preliminar'}
              </span>
              <span className="text-gold/30 text-xs">{existingResults.length} pilotos</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="fsl-table text-xs">
              <thead><tr><th>Pos</th><th>Piloto</th><th>Auto</th><th>Mejor vuelta</th><th className="text-right">Pts</th><th className="text-right">LP</th></tr></thead>
              <tbody>
                {existingResults.map(r => (
                  <tr key={r.id}>
                    <td><span className="font-serif text-base font-bold text-gold">{r.finish_position}°</span></td>
                    <td className="text-gold-light">{r.pilots?.users?.real_name || '—'}</td>
                    <td className="text-gold/40 font-condensed text-xs">{r.car_model?.replace('emka_', '').replace(/_/g, ' ') || '—'}</td>
                    <td className="font-condensed text-gold/60">{r.best_lap_time || '—'}</td>
                    <td className="text-right font-condensed font-bold text-gold">{r.points_earned}</td>
                    <td className="text-right font-condensed text-gold/60">+{r.lp_earned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload JSON */}
      {selectedEvent && (
        <div className="fsl-card p-6 mb-6">
          <div className="fsl-label mb-4">Cargar resultado desde Assetto Corsa (JSON)</div>
          <div className="flex items-center gap-4">
            <label className="btn-outline text-sm cursor-pointer">
              📁 Seleccionar archivo JSON
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
            </label>
            {loading && <span className="text-gold/40 text-sm">Procesando...</span>}
            {trackName && <span className="text-gold/50 text-sm font-condensed tracking-widest uppercase">{sessionType} · {trackName}</span>}
          </div>
          {msg && (
            <div className={`mt-3 text-sm ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</div>
          )}
        </div>
      )}

      {/* Preview de resultados parseados */}
      {parsed.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="fsl-label">{parsed.length} pilotos detectados</div>
              {unmatchedCount > 0 && (
                <span className="text-amber-400 text-xs font-condensed">⚠ {unmatchedCount} sin match — asignálos manualmente</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveResults('preliminary')} disabled={saving}
                className="btn-outline text-sm">
                {saving ? '...' : '💾 Guardar como Preliminar'}
              </button>
              <button onClick={() => saveResults('final')} disabled={saving || unmatchedCount > 0}
                className="btn-gold text-sm">
                {saving ? '...' : '✓ Confirmar como Final'}
              </button>
            </div>
          </div>

          {unmatchedCount > 0 && (
            <div className="fsl-card p-3 mb-4 border-amber-500/30 bg-amber-500/5">
              <p className="text-amber-400/80 text-xs">
                Los pilotos sin match no se guardarán. Asignalos manualmente o verificá que tengan el Steam ID registrado en la app.
                Para confirmar como Final, todos los pilotos deben estar matcheados.
              </p>
            </div>
          )}

          <div className="fsl-card overflow-hidden">
            <table className="fsl-table">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Nombre en AC</th>
                  <th>Steam ID</th>
                  <th>Piloto FSL (match)</th>
                  <th>Auto</th>
                  <th>Vueltas</th>
                  <th>Mejor vuelta</th>
                  <th>Gap</th>
                  <th className="text-center">FL</th>
                  <th className="text-center">Cortes</th>
                  <th className="text-right">Pts</th>
                  <th className="text-right">LP</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => (
                  <tr key={i} className={!r.pilotId ? 'bg-amber-500/5' : r.dsq ? 'bg-red-500/5' : ''}>
                    <td><span className="font-serif text-lg font-bold text-gold">{r.dsq ? 'DSQ' : `${r.position}°`}</span></td>
                    <td className="text-gold-light">{r.driverName}</td>
                    <td className="font-condensed text-[10px] text-gold/40 tracking-wider">{r.driverGuid.slice(0, 12)}...</td>
                    <td>
                      {r.pilotId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 text-xs">✓</span>
                          <span className="text-gold-light text-sm">
                            {r.pilotNumber ? `#${r.pilotNumber} ` : ''}{r.pilotName}
                          </span>
                        </div>
                      ) : (
                        <select className="fsl-select text-xs py-1"
                          value=""
                          onChange={e => updatePilotMatch(i, e.target.value)}>
                          <option value="">⚠ Sin match — asignar</option>
                          {pilots.map(p => (
                            <option key={p.id} value={p.id}>
                              #{p.pilot_number} {p.users?.real_name || p.users?.steam_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="text-gold/40 text-xs font-condensed">{r.carModel?.replace('emka_', '').replace(/_/g, ' ')}</td>
                    <td className="text-gold/60">{r.lapsCompleted}</td>
                    <td className="font-condensed text-gold/70">{msToTime(r.bestLapMs)}</td>
                    <td className="font-condensed text-gold/50 text-xs">{r.position === 1 ? 'Líder' : `+${msToTime(r.gapMs)}`}</td>
                    <td className="text-center">{r.hasFastestLap ? <span className="text-purple-400 font-bold">★</span> : '—'}</td>
                    <td className="text-center">
                      <span className={r.totalCuts > 0 ? 'text-amber-400' : 'text-gold/30'}>{r.totalCuts}</span>
                    </td>
                    <td className="text-right font-condensed font-bold text-gold">{r.points}</td>
                    <td className="text-right font-condensed text-emerald-400/80">+{r.lp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leyenda LP */}
          <div className="fsl-card p-4 mt-4">
            <div className="fsl-label mb-2">Cómo se calculan los LP</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gold/50">
              <span>+3 Completar carrera</span>
              <span>+1 Presentarse</span>
              <span>+5 Sin incidentes (0 cortes)</span>
              <span>+2 Top 50% de grilla</span>
              <span>+3 Victoria</span>
              <span>+2 Podio (2°/3°)</span>
              <span>+1 Vuelta rápida</span>
            </div>
          </div>
        </>
      )}

      {!selectedEvent && (
        <div className="fsl-card p-12 text-center text-gold/30 font-serif text-xl">
          Seleccioná un evento para cargar resultados
        </div>
      )}
    </div>
  )
}
