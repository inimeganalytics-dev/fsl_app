'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminInscripciones() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(false)

  async function load() {
    let q = supabase.from('public_registrations').select('*, categories(name, short_name, series(short_name)), championships(name)').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    if (data) setRegistrations(data)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setLoading(true)
    await supabase.from('public_registrations').update({ status }).eq('id', id)
    setLoading(false)
    load()
  }

  async function approveAndCreatePilot(reg: any) {
    setLoading(true)
    const steamId = `reg_${reg.id.slice(0, 8)}`
    const { data: newUser, error: ue } = await supabase.from('users').insert({
      real_name: reg.pilot_name, steam_name: reg.steam_username, steam_id: steamId,
      country_code: reg.country, email: reg.email || null,
    }).select().single()

    if (!ue && newUser) {
      await supabase.from('pilots').insert({
        user_id: newUser.id,
        pilot_number: reg.pilot_number || null,
        lp: 0,
      })
      await supabase.from('public_registrations').update({ status: 'approved' }).eq('id', reg.id)
    }
    setLoading(false)
    load()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Inscripciones</h1>
        <div className="fsl-label">{registrations.length} registros</div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-condensed text-xs tracking-[3px] uppercase px-4 py-2 border transition-colors ${
              filter === f ? 'border-gold bg-gold/10 text-gold' : 'border-gold/20 text-gold/40 hover:border-gold/40'
            }`}>
            {f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : f === 'rejected' ? 'Rechazadas' : 'Todas'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {registrations.map(r => (
          <div key={r.id} className="fsl-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-serif text-lg text-gold font-semibold">{r.pilot_name}</div>
                  {r.pilot_number && <span className="font-condensed text-gold/40 text-sm">#{r.pilot_number}</span>}
                  <span className={
                    r.status === 'approved' ? 'status-active' :
                    r.status === 'rejected' ? 'status-rejected' : 'status-pending'
                  }>
                    {r.status === 'approved' ? 'Aprobada' : r.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="fsl-label mb-0.5">País</div>
                    <div className="text-gold-light/70">{r.country}</div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Steam</div>
                    <div className="text-gold-light/70">{r.steam_username}</div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Discord</div>
                    <div className="text-gold-light/70">{r.discord_username}</div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Categoría</div>
                    <div className="text-gold-light/70">{r.categories ? `${r.categories.series?.short_name} — ${r.categories.short_name}` : 'No especificada'}</div>
                  </div>
                </div>
                {r.message && (
                  <div className="mt-3 p-3 bg-gold/[0.03] border border-gold/10">
                    <div className="fsl-label mb-1">Mensaje</div>
                    <p className="text-gold-light/50 text-xs leading-relaxed">{r.message}</p>
                  </div>
                )}
                <div className="mt-2 text-gold/20 text-xs font-condensed tracking-widest">
                  {new Date(r.created_at).toLocaleString('es')}
                </div>
              </div>

              {r.status === 'pending' && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => approveAndCreatePilot(r)} disabled={loading}
                    className="btn-gold text-xs px-4 py-2">
                    ✓ Aprobar y crear piloto
                  </button>
                  <button onClick={() => updateStatus(r.id, 'approved')} disabled={loading}
                    className="text-emerald-400/60 hover:text-emerald-400 text-xs font-condensed uppercase border border-emerald-500/20 hover:border-emerald-500/40 px-4 py-2 transition-colors">
                    Aprobar (sin crear)
                  </button>
                  <button onClick={() => updateStatus(r.id, 'rejected')} disabled={loading}
                    className="text-red-400/60 hover:text-red-400 text-xs font-condensed uppercase border border-red-500/20 hover:border-red-500/30 px-4 py-2 transition-colors">
                    ✗ Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {registrations.length === 0 && (
          <div className="fsl-card p-12 text-center">
            <div className="font-serif text-xl text-gold/40">Sin inscripciones {filter === 'pending' ? 'pendientes' : ''}</div>
          </div>
        )}
      </div>
    </div>
  )
}
