'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminInscripciones() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    let q = supabase.from('public_registrations')
      .select('*, categories(name, short_name, series(short_name)), championships(name, season)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    if (data) setRegistrations(data)
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setLoading(true)
    await supabase.from('public_registrations').update({ status }).eq('id', id)
    setLoading(false)
    setMsg(status === 'rejected' ? 'Inscripción rechazada.' : 'Estado actualizado.')
    load()
  }

  async function approveAndCreate(reg: any) {
    setLoading(true)
    setMsg('')
    try {
      // 1. Crear user
      const steamId = reg.steam_id || `reg_${reg.id.slice(0, 8)}`
      const { data: existingUser } = await supabase.from('users')
        .select('id').eq('steam_id', steamId).single()

      let userId = existingUser?.id
      if (!userId) {
        const { data: newUser, error: ue } = await supabase.from('users').insert({
          real_name: reg.pilot_name,
          steam_name: reg.pilot_name,
          steam_id: steamId,
          country_code: reg.country,
          email: reg.email || null,
          phone: reg.phone || null,
          nickname: reg.nickname || null,
          discord_username: reg.discord_username || null,
        }).select().single()
        if (ue) { setMsg('Error creando usuario: ' + ue.message); setLoading(false); return }
        userId = newUser.id
      }

      // 2. Crear pilot (si no existe)
      const { data: existingPilot } = await supabase.from('pilots')
        .select('id').eq('user_id', userId).single()

      let pilotId = existingPilot?.id
      if (!pilotId) {
        const { data: newPilot, error: pe } = await supabase.from('pilots').insert({
          user_id: userId,
          pilot_number: reg.pilot_number || null,
          lp: 0,
        }).select().single()
        if (pe) { setMsg('Error creando piloto: ' + pe.message); setLoading(false); return }
        pilotId = newPilot.id
      }

      // 3. Enrollar al campeonato si eligió uno
      if (reg.championship_id && pilotId) {
        await supabase.from('championship_enrollments').upsert({
          championship_id: reg.championship_id,
          pilot_id: pilotId,
          status: 'active',
        }, { onConflict: 'championship_id,pilot_id' })
      }

      // 4. Marcar inscripción como aprobada
      await supabase.from('public_registrations').update({ status: 'approved' }).eq('id', reg.id)

      setMsg('✓ Piloto creado y enrollado al campeonato.')
      load()
    } catch (e: any) {
      setMsg('Error: ' + e.message)
    }
    setLoading(false)
  }

  const statusLabels: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Inscripciones</h1>
        <div className="fsl-label">{registrations.length} registros</div>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 text-sm border ${msg.includes('Error') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}`}>{msg}</div>}

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-condensed text-xs tracking-[3px] uppercase px-4 py-2 border transition-colors ${filter === f ? 'border-gold bg-gold/10 text-gold' : 'border-gold/20 text-gold/40 hover:border-gold/40'}`}>
            {f === 'all' ? 'Todas' : statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {registrations.map(r => (
          <div key={r.id} className="fsl-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="font-serif text-xl text-gold font-semibold">{r.pilot_name}</div>
                  {r.nickname && <span className="text-gold/40 text-sm">"{r.nickname}"</span>}
                  {r.pilot_number && <span className="font-condensed text-gold/50 text-sm border border-gold/20 px-2 py-0.5">#{r.pilot_number}</span>}
                  <span className={r.status === 'approved' ? 'status-active' : r.status === 'rejected' ? 'status-rejected' : 'status-pending'}>
                    {statusLabels[r.status]}
                  </span>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                  <div>
                    <div className="fsl-label mb-0.5">País</div>
                    <div className="text-gold-light/70">{r.country}</div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Steam ID</div>
                    <div className="text-gold-light/70 font-condensed tracking-wider">{r.steam_id || r.steam_username || '—'}</div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Discord</div>
                    <div className="text-gold-light/70">{r.discord_username || '—'}</div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Teléfono</div>
                    <div className="text-gold-light/70">{r.phone || '—'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="fsl-label mb-0.5">Campeonato solicitado</div>
                    <div className="text-gold-light/70">
                      {r.championships ? `${r.championships.name} — T${r.championships.season}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Categoría</div>
                    <div className="text-gold-light/70">
                      {r.categories ? `${r.categories.series?.short_name} · ${r.categories.short_name}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="fsl-label mb-0.5">Email</div>
                    <div className="text-gold-light/70">{r.email || '—'}</div>
                  </div>
                </div>

                {r.message && (
                  <div className="p-3 bg-gold/[0.03] border border-gold/10 text-xs text-gold-light/50 leading-relaxed">
                    {r.message}
                  </div>
                )}
                <div className="mt-2 text-gold/20 text-xs font-condensed tracking-widest">
                  Recibida: {new Date(r.created_at).toLocaleString('es')}
                </div>
              </div>

              {/* Acciones */}
              {r.status === 'pending' && (
                <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
                  <button onClick={() => approveAndCreate(r)} disabled={loading}
                    className="btn-gold text-xs px-4 py-2 text-center">
                    ✓ Aprobar y crear piloto
                  </button>
                  {!r.championship_id && (
                    <p className="text-amber-400/60 text-xs text-center">Sin campeonato seleccionado</p>
                  )}
                  <button onClick={() => updateStatus(r.id, 'rejected')} disabled={loading}
                    className="text-red-400/60 hover:text-red-400 text-xs font-condensed uppercase border border-red-500/20 hover:border-red-500/30 px-4 py-2 transition-colors text-center">
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
