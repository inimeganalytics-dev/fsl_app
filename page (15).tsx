'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const EMPTY_USER = { real_name: '', steam_name: '', country_code: '', email: '' }
const EMPTY_PILOT = { pilot_number: '', lp: 0 }

export default function AdminPilotos() {
  const [pilots, setPilots] = useState<any[]>([])
  const [form, setForm] = useState({ ...EMPTY_USER, ...EMPTY_PILOT })
  const [editing, setEditing] = useState<{ pilotId: string; userId: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('pilots')
      .select('*, users(*)')
      .order('lp', { ascending: false })
    if (data) setPilots(data)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.real_name && !form.steam_name) { setMsg('Ingresá al menos un nombre.'); return }
    setLoading(true)
    try {
      if (editing) {
        await Promise.all([
          supabase.from('users').update({ real_name: form.real_name, steam_name: form.steam_name, country_code: form.country_code, email: form.email }).eq('id', editing.userId),
          supabase.from('pilots').update({ pilot_number: form.pilot_number ? Number(form.pilot_number) : null, lp: Number(form.lp) }).eq('id', editing.pilotId),
        ])
        setMsg('Piloto actualizado.')
      } else {
        const steamId = `manual_${Date.now()}`
        const { data: newUser, error: ue } = await supabase.from('users').insert({ real_name: form.real_name, steam_name: form.steam_name || form.real_name, steam_id: steamId, country_code: form.country_code, email: form.email }).select().single()
        if (ue) { setMsg('Error creando usuario: ' + ue.message); return }
        await supabase.from('pilots').insert({ user_id: newUser.id, pilot_number: form.pilot_number ? Number(form.pilot_number) : null, lp: Number(form.lp) })
        setMsg('Piloto creado.')
      }
      setForm({ ...EMPTY_USER, ...EMPTY_PILOT }); setEditing(null); setShowForm(false); load()
    } catch (e: any) {
      setMsg('Error: ' + e.message)
    }
    setLoading(false)
  }

  function startEdit(p: any) {
    setForm({ real_name: p.users?.real_name || '', steam_name: p.users?.steam_name || '', country_code: p.users?.country_code || '', email: p.users?.email || '', pilot_number: String(p.pilot_number || ''), lp: p.lp || 0 })
    setEditing({ pilotId: p.id, userId: p.user_id }); setShowForm(true); setMsg('')
  }

  async function adjustLP(pilotId: string, delta: number) {
    const pilot = pilots.find(p => p.id === pilotId)
    if (!pilot) return
    const newLP = Math.max(0, (pilot.lp || 0) + delta)
    await supabase.from('pilots').update({ lp: newLP }).eq('id', pilotId)
    load()
  }

  const filtered = pilots.filter(p => {
    const name = (p.users?.real_name || p.users?.steam_name || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Pilotos</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ ...EMPTY_USER, ...EMPTY_PILOT }); setMsg('') }} className="btn-gold text-sm">
          {showForm ? 'Cancelar' : '+ Nuevo piloto'}
        </button>
      </div>

      {showForm && (
        <div className="fsl-card p-6 mb-6">
          <div className="fsl-label mb-4">{editing ? 'Editar piloto' : 'Nuevo piloto'}</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Nombre real</label>
              <input className="fsl-input" placeholder="Nombre completo" value={form.real_name} onChange={e => setForm(p => ({ ...p, real_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Usuario Steam</label>
              <input className="fsl-input" placeholder="steam_user" value={form.steam_name} onChange={e => setForm(p => ({ ...p, steam_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">País</label>
              <input className="fsl-input" placeholder="AR / BR / CL..." value={form.country_code} onChange={e => setForm(p => ({ ...p, country_code: e.target.value.toUpperCase().slice(0, 2) }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Email</label>
              <input className="fsl-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Número</label>
              <input className="fsl-input" type="number" min="1" max="99" placeholder="44" value={form.pilot_number} onChange={e => setForm(p => ({ ...p, pilot_number: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">LP (Puntos de Licencia)</label>
              <input className="fsl-input" type="number" min="0" value={form.lp} onChange={e => setForm(p => ({ ...p, lp: Number(e.target.value) }))} />
            </div>
          </div>
          {msg && <p className={`text-sm mt-3 ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={loading} className="btn-gold">{loading ? 'Guardando...' : 'Guardar'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-outline">Cancelar</button>
          </div>
        </div>
      )}

      <input className="fsl-input mb-4 max-w-xs" placeholder="Buscar piloto..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="fsl-card overflow-hidden">
        <table className="fsl-table">
          <thead>
            <tr>
              <th>#</th><th>Piloto</th><th>País</th>
              <th className="text-center">LP</th><th className="text-center">Carreras</th>
              <th className="text-center">Victorias</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="font-condensed text-gold/60">{p.pilot_number || '—'}</td>
                <td>
                  <div className="text-gold-light font-medium">{p.users?.real_name || p.users?.steam_name || '?'}</div>
                  <div className="text-gold/30 text-xs">{p.users?.steam_name}</div>
                </td>
                <td className="font-condensed text-xs tracking-widest text-gold/40 uppercase">{p.users?.country_code || '—'}</td>
                <td>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => adjustLP(p.id, -1)} className="w-5 h-5 text-red-400/60 hover:text-red-400 text-xs border border-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-colors">-</button>
                    <span className="font-condensed font-bold text-gold w-8 text-center">{p.lp || 0}</span>
                    <button onClick={() => adjustLP(p.id, 1)} className="w-5 h-5 text-emerald-400/60 hover:text-emerald-400 text-xs border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-colors">+</button>
                  </div>
                </td>
                <td className="text-center text-gold/60">{p.total_races || 0}</td>
                <td className="text-center text-gold/60">{p.total_wins || 0}</td>
                <td>
                  <button onClick={() => startEdit(p)} className="text-gold/40 hover:text-gold text-xs font-condensed tracking-widest uppercase border border-gold/20 hover:border-gold/40 px-2 py-1 transition-colors">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gold/30 font-serif text-xl">Sin pilotos</div>
        )}
      </div>
    </div>
  )
}
