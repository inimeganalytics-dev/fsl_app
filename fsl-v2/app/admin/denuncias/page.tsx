'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminDenuncias() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [filter, setFilter] = useState<'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'all'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function load() {
    let q = supabase.from('public_complaints').select('*, championships(name)').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    if (data) {
      setComplaints(data)
      const n: Record<string, string> = {}
      data.forEach((c: any) => { n[c.id] = c.admin_notes || '' })
      setNotes(n)
    }
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: string) {
    setLoading(true)
    await supabase.from('public_complaints').update({ status, admin_notes: notes[id] || null }).eq('id', id)
    setLoading(false)
    load()
  }

  const statusColors: Record<string, string> = {
    pending: 'status-pending', reviewing: 'status-active',
    resolved: 'status-finished', dismissed: 'status-finished'
  }
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', reviewing: 'Revisando', resolved: 'Resuelta', dismissed: 'Desestimada'
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Denuncias</h1>
        <div className="fsl-label">{complaints.length} registros</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['pending', 'reviewing', 'resolved', 'dismissed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-condensed text-xs tracking-[3px] uppercase px-4 py-2 border transition-colors ${
              filter === f ? 'border-gold bg-gold/10 text-gold' : 'border-gold/20 text-gold/40 hover:border-gold/40'
            }`}>
            {statusLabels[f] || 'Todas'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {complaints.map(c => (
          <div key={c.id} className="fsl-card overflow-hidden">
            <div className="p-5 cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="font-serif text-lg text-gold">
                      {c.reporter_name} <span className="text-gold/30 text-base">vs</span> {c.reported_pilot_name}
                    </div>
                    <span className={statusColors[c.status] || 'status-pending'}>{statusLabels[c.status]}</span>
                  </div>
                  <div className="text-gold/40 text-xs font-condensed">
                    {c.championships?.name || 'Sin campeonato'} {c.event_name ? `· ${c.event_name}` : ''} {c.lap_number ? `· Vuelta ${c.lap_number}` : ''}
                  </div>
                  <div className="text-gold/20 text-xs mt-1">{new Date(c.created_at).toLocaleString('es')}</div>
                </div>
                <div className="text-gold/30 text-sm">{expanded === c.id ? '▲' : '▼'}</div>
              </div>
            </div>

            {expanded === c.id && (
              <div className="border-t border-gold/10 p-5 bg-fsl-black/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="fsl-label mb-2">Descripción del incidente</div>
                    <p className="text-gold-light/60 text-sm leading-relaxed">{c.incident_description}</p>

                    {c.video_url && (
                      <div className="mt-4">
                        <div className="fsl-label mb-1">Video</div>
                        <a href={c.video_url} target="_blank" rel="noopener noreferrer"
                          className="text-gold/60 hover:text-gold text-sm underline transition-colors break-all">
                          {c.video_url}
                        </a>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="fsl-label mb-0.5">Denunciante Discord</div>
                        <div className="text-gold-light/60">{c.reporter_discord}</div>
                      </div>
                      {c.incident_time && (
                        <div>
                          <div className="fsl-label mb-0.5">Tiempo en video</div>
                          <div className="text-gold-light/60">{c.incident_time}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="fsl-label mb-2">Notas del comisario</div>
                    <textarea className="fsl-input resize-none mb-3" rows={4}
                      placeholder="Decisión, notas internas..."
                      value={notes[c.id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))} />

                    <div className="fsl-label mb-2">Cambiar estado</div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateStatus(c.id, 'reviewing')} disabled={loading}
                        className="text-gold/60 hover:text-gold text-xs font-condensed uppercase border border-gold/20 hover:border-gold/40 px-3 py-2 transition-colors">
                        En revisión
                      </button>
                      <button onClick={() => updateStatus(c.id, 'resolved')} disabled={loading}
                        className="text-emerald-400/60 hover:text-emerald-400 text-xs font-condensed uppercase border border-emerald-500/20 px-3 py-2 transition-colors">
                        Resolver
                      </button>
                      <button onClick={() => updateStatus(c.id, 'dismissed')} disabled={loading}
                        className="text-red-400/60 hover:text-red-400 text-xs font-condensed uppercase border border-red-500/20 px-3 py-2 transition-colors">
                        Desestimar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {complaints.length === 0 && (
          <div className="fsl-card p-12 text-center">
            <div className="font-serif text-xl text-gold/40">Sin denuncias {filter !== 'all' ? statusLabels[filter]?.toLowerCase() + 's' : ''}</div>
          </div>
        )}
      </div>
    </div>
  )
}
