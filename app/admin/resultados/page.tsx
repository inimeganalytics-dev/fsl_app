'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminResultados() {
  const [events, setEvents] = useState<any[]>([])
  const [pilots, setPilots] = useState<any[]>([])
  const [championships, setChampionships] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [editingRow, setEditingRow] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [filterChamp, setFilterChamp] = useState('')

  const POINTS = [40,36,31,27,25,20,18,15,12,9,7,7,6,6,5,5,4,4,3,3,2,2,1,1,1,1,1]

  async function load() {
    const [e, p, c] = await Promise.all([
      supabase.from('events').select('*, championships(name, categories(short_name, points_system, series(short_name)))').order('scheduled_date', { ascending: false }),
      supabase.from('pilots').select('*, users(real_name, steam_name, country_code)').order('lp', { ascending: false }),
      supabase.from('championships').select('*, categories(short_name, series(short_name))').order('season', { ascending: false }),
    ])
    if (e.data) setEvents(e.data)
    if (p.data) setPilots(p.data)
    if (c.data) setChampionships(c.data)
  }

  useEffect(() => { load() }, [])

  async function loadResults() {
    if (!selectedEvent) return
    const { data } = await supabase.from('race_results')
      .select('*, pilots(*, users(real_name, steam_name, country_code))')
      .eq('event_id', selectedEvent)
      .order('finish_position')
    if (data) setResults(data)
  }

  useEffect(() => { loadResults() }, [selectedEvent])

  function getPoints(pos: number, pointsSystem?: Record<string, number>) {
    if (pointsSystem) return pointsSystem[String(pos)] || 0
    return POINTS[pos - 1] || 0
  }

  const emptyRow = (pos: number) => ({
    event_id: selectedEvent, pilot_id: '', finish_position: pos,
    qualifying_position: pos, points_earned: getPoints(pos),
    lp_earned: 3, best_lap_time: '', laps_completed: 0,
    has_fastest_lap: false, pole_position: false, dnf: false, dsq: false,
    _new: true,
  })

  async function saveRow(row: any) {
    if (!row.pilot_id) { setMsg('Seleccioná un piloto.'); return }
    setLoading(true)
    const { _new, _id, ...data } = row
    data.points_earned = Number(data.points_earned)
    data.lp_earned = Number(data.lp_earned)
    data.laps_completed = Number(data.laps_completed)
    data.finish_position = Number(data.finish_position)
    data.qualifying_position = Number(data.qualifying_position)

    const { error } = _new
      ? await supabase.from('race_results').insert(data)
      : await supabase.from('race_results').update(data).eq('id', _id)
    setLoading(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('Resultado guardado.')
    setEditingRow(null)
    loadResults()
  }

  async function deleteResult(id: string) {
    if (!confirm('¿Eliminar este resultado?')) return
    await supabase.from('race_results').delete().eq('id', id)
    loadResults()
  }

  const event = events.find(e => e.id === selectedEvent)
  const pointsSystem = event?.championships?.categories?.points_system

  const filteredEvents = filterChamp ? events.filter(e => e.championship_id === filterChamp) : events

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-serif text-3xl text-gold font-bold mb-8">Resultados</h1>

      <div className="fsl-card p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Campeonato</label>
          <select className="fsl-select" value={filterChamp} onChange={e => setFilterChamp(e.target.value)}>
            <option value="">Todos</option>
            {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
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

      {!selectedEvent ? (
        <div className="fsl-card p-12 text-center text-gold/30 font-serif text-xl">Seleccioná un evento para cargar resultados</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="fsl-label">{event?.name} — {results.length} resultados</div>
            <button onClick={() => setEditingRow(emptyRow(results.length + 1))} className="btn-gold text-sm">+ Agregar resultado</button>
          </div>

          {msg && <p className={`text-sm mb-4 ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}

          {editingRow?._new && (
            <ResultRow row={editingRow} pilots={pilots} onChange={setEditingRow} onSave={() => saveRow(editingRow)} onCancel={() => setEditingRow(null)} loading={loading} />
          )}

          <div className="fsl-card overflow-hidden">
            <table className="fsl-table">
              <thead>
                <tr>
                  <th>Pos.</th><th>Q</th><th>Piloto</th><th>Vueltas</th>
                  <th>Mejor vuelta</th><th className="text-center">FL</th><th className="text-center">Pole</th>
                  <th className="text-right">Pts</th><th className="text-right">LP</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => editingRow?._id === r.id ? (
                  <tr key={r.id}>
                    <td colSpan={11}>
                      <ResultRow row={editingRow} pilots={pilots} onChange={setEditingRow} onSave={() => saveRow(editingRow)} onCancel={() => setEditingRow(null)} loading={loading} />
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td><span className="font-serif text-lg font-bold text-gold">{r.finish_position}°</span></td>
                    <td className="text-gold/40 text-xs">{r.qualifying_position || '—'}</td>
                    <td className="text-gold-light">{r.pilots?.users?.real_name || r.pilots?.users?.steam_name || '?'}</td>
                    <td className="text-gold/60">{r.laps_completed || '—'}</td>
                    <td className="font-condensed text-gold/60 text-xs">{r.best_lap_time || '—'}</td>
                    <td className="text-center">{r.has_fastest_lap ? <span className="text-purple-400">★</span> : '—'}</td>
                    <td className="text-center">{r.pole_position ? <span className="text-gold">P</span> : '—'}</td>
                    <td className="text-right font-condensed font-bold text-gold">{r.points_earned}</td>
                    <td className="text-right font-condensed text-gold/60">{r.lp_earned > 0 ? `+${r.lp_earned}` : r.lp_earned}</td>
                    <td>
                      {r.dsq ? <span className="text-red-400 font-condensed text-xs">DSQ</span> :
                       r.dnf ? <span className="text-orange-400 font-condensed text-xs">DNF</span> : ''}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingRow({ ...r, _id: r.id })} className="text-gold/40 hover:text-gold text-xs font-condensed uppercase border border-gold/20 px-2 py-1 transition-colors">Editar</button>
                        <button onClick={() => deleteResult(r.id)} className="text-red-400/40 hover:text-red-400 text-xs font-condensed uppercase border border-red-500/10 px-2 py-1 transition-colors">X</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length === 0 && (
              <div className="py-12 text-center text-gold/30 font-serif text-xl">Sin resultados cargados</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ResultRow({ row, pilots, onChange, onSave, onCancel, loading }: any) {
  return (
    <div className="fsl-card p-4 mb-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="fsl-label block mb-1">Piloto *</label>
          <select className="fsl-select" value={row.pilot_id} onChange={e => onChange({ ...row, pilot_id: e.target.value })}>
            <option value="">Seleccioná</option>
            {pilots.map((p: any) => (
              <option key={p.id} value={p.id}>#{p.pilot_number} {p.users?.real_name || p.users?.steam_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="fsl-label block mb-1">Pos. final</label>
          <input className="fsl-input" type="number" min="1" value={row.finish_position}
            onChange={e => onChange({ ...row, finish_position: Number(e.target.value) })} />
        </div>
        <div>
          <label className="fsl-label block mb-1">Pos. clasif.</label>
          <input className="fsl-input" type="number" min="1" value={row.qualifying_position}
            onChange={e => onChange({ ...row, qualifying_position: Number(e.target.value) })} />
        </div>
        <div>
          <label className="fsl-label block mb-1">Vueltas</label>
          <input className="fsl-input" type="number" min="0" value={row.laps_completed}
            onChange={e => onChange({ ...row, laps_completed: Number(e.target.value) })} />
        </div>
        <div>
          <label className="fsl-label block mb-1">Mejor vuelta</label>
          <input className="fsl-input" placeholder="1:23.456" value={row.best_lap_time}
            onChange={e => onChange({ ...row, best_lap_time: e.target.value })} />
        </div>
        <div>
          <label className="fsl-label block mb-1">Puntos</label>
          <input className="fsl-input" type="number" min="0" value={row.points_earned}
            onChange={e => onChange({ ...row, points_earned: Number(e.target.value) })} />
        </div>
        <div>
          <label className="fsl-label block mb-1">LP ganados</label>
          <input className="fsl-input" type="number" value={row.lp_earned}
            onChange={e => onChange({ ...row, lp_earned: Number(e.target.value) })} />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={row.has_fastest_lap} onChange={e => onChange({ ...row, has_fastest_lap: e.target.checked })} className="accent-gold" />
            <span className="text-gold/50 text-xs tracking-widest uppercase">FL</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={row.pole_position} onChange={e => onChange({ ...row, pole_position: e.target.checked })} className="accent-gold" />
            <span className="text-gold/50 text-xs tracking-widest uppercase">Pole</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={row.dnf} onChange={e => onChange({ ...row, dnf: e.target.checked })} className="accent-gold" />
            <span className="text-gold/50 text-xs tracking-widest uppercase">DNF</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={row.dsq} onChange={e => onChange({ ...row, dsq: e.target.checked })} className="accent-gold" />
            <span className="text-gold/50 text-xs tracking-widest uppercase">DSQ</span>
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onSave} disabled={loading} className="btn-gold text-xs">{loading ? '...' : 'Guardar resultado'}</button>
        <button onClick={onCancel} className="btn-outline text-xs">Cancelar</button>
      </div>
    </div>
  )
}
