'use client'
import { useEffect, useState } from 'react'
import { supabase, Championship } from '@/lib/supabase'

const EMPTY = { name: '', championship_id: '', circuit_name: '', country_code: '', scheduled_date: '', status: 'scheduled' as const, max_pilots: 30, registrations_open: true, notes: '' }

export default function AdminEventos() {
  const [events, setEvents] = useState<any[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [filterChamp, setFilterChamp] = useState('')

  async function load() {
    const [e, c] = await Promise.all([
      supabase.from('events').select('*, championships(name, season, categories(short_name, series(short_name)))').order('scheduled_date', { ascending: false }),
      supabase.from('championships').select('*, categories(short_name, series(short_name))').order('season', { ascending: false }),
    ])
    if (e.data) setEvents(e.data)
    if (c.data) setChampionships(c.data)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.name || !form.championship_id || !form.circuit_name || !form.scheduled_date) {
      setMsg('Completá los campos obligatorios.'); return
    }
    setLoading(true)
    const data = { ...form, max_pilots: Number(form.max_pilots) }
    const { error } = editing
      ? await supabase.from('events').update(data).eq('id', editing)
      : await supabase.from('events').insert(data)
    setLoading(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg(editing ? 'Evento actualizado.' : 'Evento creado.')
    setForm(EMPTY); setEditing(null); setShowForm(false); load()
  }

  function startEdit(ev: any) {
    const dt = new Date(ev.scheduled_date)
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setForm({ name: ev.name, championship_id: ev.championship_id, circuit_name: ev.circuit_name, country_code: ev.country_code || '', scheduled_date: local, status: ev.status, max_pilots: ev.max_pilots || 30, registrations_open: ev.registrations_open, notes: ev.notes || '' })
    setEditing(ev.id); setShowForm(true); setMsg('')
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  const filtered = filterChamp ? events.filter(e => e.championship_id === filterChamp) : events

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Eventos / Fechas</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); setMsg('') }} className="btn-gold text-sm">
          {showForm ? 'Cancelar' : '+ Nueva fecha'}
        </button>
      </div>

      {showForm && (
        <div className="fsl-card p-6 mb-6">
          <div className="fsl-label mb-4">{editing ? 'Editar evento' : 'Nueva fecha'}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Nombre *</label>
              <input className="fsl-input" placeholder="Ej: Fecha 1 — Silverstone"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Campeonato *</label>
              <select className="fsl-select" value={form.championship_id} onChange={e => setForm(p => ({ ...p, championship_id: e.target.value }))}>
                <option value="">Seleccioná campeonato</option>
                {championships.map(c => (
                  <option key={c.id} value={c.id}>{(c as any).categories?.series?.short_name} — {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Circuito *</label>
              <input className="fsl-input" placeholder="Ej: Circuit de Spa-Francorchamps"
                value={form.circuit_name} onChange={e => setForm(p => ({ ...p, circuit_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Fecha y hora *</label>
              <input className="fsl-input" type="datetime-local"
                value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Estado</label>
              <select className="fsl-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="scheduled">Programado</option>
                <option value="live">En vivo</option>
                <option value="finished">Finalizado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Máx. pilotos</label>
              <input className="fsl-input" type="number" value={form.max_pilots} onChange={e => setForm(p => ({ ...p, max_pilots: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Inscripciones</label>
              <select className="fsl-select" value={form.registrations_open ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, registrations_open: e.target.value === 'true' }))}>
                <option value="true">Abiertas</option>
                <option value="false">Cerradas</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Notas internas</label>
              <textarea className="fsl-input resize-none" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          {msg && <p className={`text-sm mt-3 ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={loading} className="btn-gold">{loading ? 'Guardando...' : 'Guardar'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-outline">Cancelar</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select className="fsl-select w-64" value={filterChamp} onChange={e => setFilterChamp(e.target.value)}>
          <option value="">Todos los campeonatos</option>
          {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(ev => {
          const date = new Date(ev.scheduled_date)
          return (
            <div key={ev.id} className="fsl-card p-4 flex items-center gap-4">
              <div className="text-center min-w-[48px]">
                <div className="font-serif text-2xl text-gold font-bold leading-none">{date.getDate()}</div>
                <div className="font-condensed text-[9px] tracking-[2px] text-gold/40 uppercase">{date.toLocaleString('es', { month: 'short' })}</div>
              </div>
              <div className="border-l border-gold/10 pl-4 flex-1 min-w-0">
                <div className="fsl-label mb-0.5">{ev.championships?.categories?.series?.short_name} · {ev.championships?.name}</div>
                <div className="font-serif text-base text-gold">{ev.name}</div>
                <div className="text-gold/30 text-xs">{ev.circuit_name}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={ev.status === 'finished' ? 'status-finished' : ev.status === 'live' ? 'status-active' : 'status-pending'}>
                  {ev.status === 'finished' ? 'Finalizado' : ev.status === 'live' ? 'En vivo' : 'Programado'}
                </span>
                <button onClick={() => startEdit(ev)} className="text-gold/40 hover:text-gold text-xs font-condensed tracking-widest uppercase border border-gold/20 hover:border-gold/40 px-3 py-1.5 transition-colors">Editar</button>
                <button onClick={() => handleDelete(ev.id)} className="text-red-400/40 hover:text-red-400 text-xs font-condensed uppercase border border-red-500/10 hover:border-red-500/30 px-3 py-1.5 transition-colors">X</button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="fsl-card p-12 text-center text-gold/30 font-serif text-xl">No hay eventos</div>
        )}
      </div>
    </div>
  )
}
