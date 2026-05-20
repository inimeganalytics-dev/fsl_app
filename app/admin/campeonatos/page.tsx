'use client'
import { useEffect, useState } from 'react'
import { supabase, Championship, Category } from '@/lib/supabase'

const EMPTY_FORM = {
  name: '', season: new Date().getFullYear(), category_id: '',
  status: 'active' as const, description: '', rules_version: 'v1.0',
}

export default function AdminCampeonatos() {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const [c, cat] = await Promise.all([
      supabase.from('championships').select('*, categories(*, series(*))').order('season', { ascending: false }),
      supabase.from('categories').select('*, series(*)').order('name'),
    ])
    if (c.data) setChampionships(c.data)
    if (cat.data) setCategories(cat.data)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.name || !form.category_id) { setMsg('Completá nombre y categoría.'); return }
    setLoading(true)
    const data = { name: form.name, season: form.season, category_id: form.category_id, status: form.status, description: form.description, rules_version: form.rules_version }
    const { error } = editing
      ? await supabase.from('championships').update(data).eq('id', editing)
      : await supabase.from('championships').insert(data)
    setLoading(false)
    if (error) { setMsg('Error al guardar: ' + error.message); return }
    setMsg(editing ? 'Campeonato actualizado.' : 'Campeonato creado.')
    setForm(EMPTY_FORM); setEditing(null); setShowForm(false)
    load()
  }

  function startEdit(c: Championship) {
    setForm({ name: c.name, season: c.season, category_id: c.category_id, status: c.status as any, description: c.description || '', rules_version: c.rules_version || 'v1.0' })
    setEditing(c.id); setShowForm(true); setMsg('')
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este campeonato? Esta acción no se puede deshacer.')) return
    await supabase.from('championships').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Campeonatos</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_FORM); setMsg('') }}
          className="btn-gold text-sm">
          {showForm ? 'Cancelar' : '+ Nuevo campeonato'}
        </button>
      </div>

      {showForm && (
        <div className="fsl-card p-6 mb-6">
          <div className="fsl-label mb-4">{editing ? 'Editar campeonato' : 'Nuevo campeonato'}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Nombre *</label>
              <input className="fsl-input" placeholder="Ej: FSL Formula 4 — Temporada 2025"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Categoría *</label>
              <select className="fsl-select" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                <option value="">Seleccioná categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{(c as any).series?.short_name} — {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Temporada</label>
              <input className="fsl-input" type="number" value={form.season} onChange={e => setForm(p => ({ ...p, season: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Estado</label>
              <select className="fsl-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="upcoming">Próximamente</option>
                <option value="active">Activo</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Versión reglamento</label>
              <input className="fsl-input" placeholder="v1.0" value={form.rules_version} onChange={e => setForm(p => ({ ...p, rules_version: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Descripción</label>
              <textarea className="fsl-input resize-none" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          {msg && <p className={`text-sm mt-3 ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={loading} className="btn-gold">{loading ? 'Guardando...' : 'Guardar'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }} className="btn-outline">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {championships.map(c => (
          <div key={c.id} className="fsl-card p-5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="fsl-label">{(c as any).categories?.series?.short_name} · {(c as any).categories?.short_name} · T{c.season}</span>
                <span className={c.status === 'active' ? 'status-active' : c.status === 'upcoming' ? 'status-pending' : 'status-finished'}>
                  {c.status === 'active' ? 'Activo' : c.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
                </span>
              </div>
              <div className="font-serif text-lg text-gold">{c.name}</div>
              {c.description && <p className="text-gold/30 text-xs mt-1 truncate">{c.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => startEdit(c)} className="text-gold/40 hover:text-gold text-xs font-condensed tracking-widest uppercase border border-gold/20 hover:border-gold/40 px-3 py-2 transition-colors">Editar</button>
              <button onClick={() => handleDelete(c.id)} className="text-red-400/40 hover:text-red-400 text-xs font-condensed tracking-widest uppercase border border-red-500/10 hover:border-red-500/30 px-3 py-2 transition-colors">Eliminar</button>
            </div>
          </div>
        ))}
        {championships.length === 0 && (
          <div className="fsl-card p-12 text-center text-gold/30 font-serif text-xl">
            No hay campeonatos creados
          </div>
        )}
      </div>
    </div>
  )
}
