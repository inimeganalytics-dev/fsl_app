'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SANCTION_TYPES = ['Colisión', 'No respetar banderas azules', 'No respetar banderas amarillas', 'Movimiento defensivo ilegal', 'Reincorporación peligrosa', 'Brake check', 'Dejar sin pista a rival', 'Ragequit', 'Comportamiento antideportivo', 'Hablar en canal durante carrera', 'Teleport a boxes no autorizado', 'Otro']

const EMPTY = { pilot_id: '', sanction_type: '', time_penalty: 0, lp_penalty: 0, dsq: false, suspension_races: 0, reason: '' }

export default function AdminSanciones() {
  const [sanctions, setSanctions] = useState<any[]>([])
  const [pilots, setPilots] = useState<any[]>([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const [s, p] = await Promise.all([
      supabase.from('sanctions').select('*, pilots(*, users(real_name, steam_name))').order('issued_at', { ascending: false }),
      supabase.from('pilots').select('*, users(real_name, steam_name)').order('lp', { ascending: false }),
    ])
    if (s.data) setSanctions(s.data)
    if (p.data) setPilots(p.data)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.pilot_id || !form.sanction_type) { setMsg('Seleccioná piloto y tipo de sanción.'); return }
    setLoading(true)
    const data = { ...form, time_penalty: Number(form.time_penalty), lp_penalty: Number(form.lp_penalty), suspension_races: Number(form.suspension_races) }
    const { error } = await supabase.from('sanctions').insert(data)

    if (!error && form.lp_penalty > 0) {
      const pilot = pilots.find(p => p.id === form.pilot_id)
      if (pilot) {
        const newLP = Math.max(0, (pilot.lp || 0) - form.lp_penalty)
        await supabase.from('pilots').update({ lp: newLP }).eq('id', form.pilot_id)
      }
    }

    setLoading(false)
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('Sanción aplicada y LP descontados.')
    setForm(EMPTY); setShowForm(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta sanción?')) return
    await supabase.from('sanctions').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Sanciones</h1>
        <button onClick={() => { setShowForm(!showForm); setForm(EMPTY); setMsg('') }} className="btn-gold text-sm">
          {showForm ? 'Cancelar' : '+ Nueva sanción'}
        </button>
      </div>

      {showForm && (
        <div className="fsl-card p-6 mb-6">
          <div className="fsl-label mb-4">Emitir nueva sanción</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Piloto *</label>
              <select className="fsl-select" value={form.pilot_id} onChange={e => setForm(p => ({ ...p, pilot_id: e.target.value }))}>
                <option value="">Seleccioná piloto</option>
                {pilots.map(p => (
                  <option key={p.id} value={p.id}>#{p.pilot_number} {p.users?.real_name || p.users?.steam_name} (LP: {p.lp})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Tipo de infracción *</label>
              <select className="fsl-select" value={form.sanction_type} onChange={e => setForm(p => ({ ...p, sanction_type: e.target.value }))}>
                <option value="">Seleccioná tipo</option>
                {SANCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Segundos de penalización</label>
              <input className="fsl-input" type="number" min="0" value={form.time_penalty}
                onChange={e => setForm(p => ({ ...p, time_penalty: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">LP a descontar</label>
              <input className="fsl-input" type="number" min="0" value={form.lp_penalty}
                onChange={e => setForm(p => ({ ...p, lp_penalty: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Fechas de suspensión</label>
              <input className="fsl-input" type="number" min="0" value={form.suspension_races}
                onChange={e => setForm(p => ({ ...p, suspension_races: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" checked={form.dsq} onChange={e => setForm(p => ({ ...p, dsq: e.target.checked }))} className="accent-gold w-4 h-4" />
                <span className="text-gold/60 text-sm">Descalificación (DSQ)</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Motivo / descripción del incidente *</label>
              <textarea className="fsl-input resize-none" rows={3} placeholder="Describí el incidente y por qué se aplica la sanción..."
                value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>

          {form.lp_penalty > 0 && form.pilot_id && (
            <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20">
              <p className="text-amber-400/80 text-xs">
                ⚠ Se descontarán {form.lp_penalty} LP al piloto automáticamente al guardar.
              </p>
            </div>
          )}

          {msg && <p className={`text-sm mt-3 ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={loading} className="btn-gold">{loading ? 'Aplicando...' : 'Aplicar sanción'}</button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY) }} className="btn-outline">Cancelar</button>
          </div>
        </div>
      )}

      <div className="fsl-card overflow-hidden">
        <table className="fsl-table">
          <thead>
            <tr><th>Piloto</th><th>Tipo</th><th>Sanción</th><th>LP</th><th>Motivo</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {sanctions.map(s => (
              <tr key={s.id}>
                <td className="text-gold-light">{s.pilots?.users?.real_name || s.pilots?.users?.steam_name || '?'}</td>
                <td><span className="text-gold/60 text-xs font-condensed">{s.sanction_type}</span></td>
                <td>
                  <div className="flex flex-col gap-1">
                    {s.dsq && <span className="text-red-400 font-condensed font-semibold text-xs">DSQ</span>}
                    {s.time_penalty > 0 && <span className="text-gold font-condensed text-xs">+{s.time_penalty}s</span>}
                    {s.suspension_races > 0 && <span className="text-orange-400 font-condensed text-xs">{s.suspension_races} fecha(s) susp.</span>}
                    {!s.dsq && !s.time_penalty && !s.suspension_races && '—'}
                  </div>
                </td>
                <td>
                  {s.lp_penalty > 0
                    ? <span className="text-red-400 font-condensed">−{s.lp_penalty} LP</span>
                    : '—'}
                </td>
                <td className="text-gold/40 text-xs max-w-xs">
                  <span className="line-clamp-2">{s.reason || '—'}</span>
                </td>
                <td className="text-gold/30 text-xs font-condensed whitespace-nowrap">
                  {new Date(s.issued_at).toLocaleDateString('es')}
                </td>
                <td>
                  <button onClick={() => handleDelete(s.id)} className="text-red-400/40 hover:text-red-400 text-xs font-condensed uppercase border border-red-500/10 px-2 py-1 transition-colors">X</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sanctions.length === 0 && (
          <div className="py-12 text-center text-gold/30 font-serif text-xl">Sin sanciones registradas</div>
        )}
      </div>
    </div>
  )
}
