'use client'
import { useEffect, useState } from 'react'
import { supabase, Championship } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'

export default function DenunciaPage() {
  const [form, setForm] = useState({
    reporter_name: '', reporter_discord: '', reported_pilot_name: '',
    championship_id: '', event_name: '', lap_number: '',
    incident_time: '', incident_description: '', video_url: '',
  })
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('championships').select('*, categories(short_name)').eq('status', 'active').order('name')
      .then(({ data }) => { if (data) setChampionships(data) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.reporter_name || !form.reporter_discord || !form.reported_pilot_name || !form.incident_description) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('public_complaints').insert({
      ...form,
      lap_number: form.lap_number ? parseInt(form.lap_number) : null,
      championship_id: form.championship_id || null,
    })
    setLoading(false)
    if (err) { setError('Error al enviar. Intentá nuevamente.'); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-fsl-black">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 pt-28 pb-24 text-center">
          <div className="fsl-card p-16">
            <div className="font-serif text-5xl text-gold mb-6">✓</div>
            <h2 className="font-serif text-3xl text-gold font-bold mb-4">Denuncia recibida</h2>
            <p className="text-gold-light/60 leading-relaxed mb-4">
              Tu denuncia fue registrada. La FSL revisará el incidente en base al reglamento vigente.
            </p>
            <p className="text-gold-light/40 text-sm mb-8">
              Las sanciones se informarán dentro del servidor de Discord una vez finalizada la revisión.
            </p>
            <button onClick={() => { setSuccess(false); setForm({ reporter_name: '', reporter_discord: '', reported_pilot_name: '', championship_id: '', event_name: '', lap_number: '', incident_time: '', incident_description: '', video_url: '' }) }}
              className="btn-outline">
              Presentar otra denuncia
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-12">
          <div className="fsl-label mb-3">Reglamento deportivo FSL</div>
          <h1 className="font-serif text-5xl text-gold font-bold">Denuncia</h1>
          <div className="w-16 h-px bg-gold/40 mt-6 mb-6" />
          <p className="text-gold-light/50 text-sm leading-relaxed font-light">
            Todo piloto tiene el derecho de denunciar cualquier acción que considere antideportiva.
            La FSL garantiza un proceso transparente e imparcial para cada denuncia recibida.
          </p>
        </div>

        <div className="fsl-card p-5 mb-8 border-l-2 border-gold/40">
          <div className="fsl-label mb-2">Requisito importante</div>
          <p className="text-gold-light/60 text-sm leading-relaxed">
            Para denuncias con mayor peso probatorio, se recomienda adjuntar el link al video del incidente.
            Las denuncias sin evidencia visual quedan sujetas a la disponibilidad de la repetición oficial del servidor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Quien denuncia</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Tu nombre *</label>
                <input className="fsl-input" placeholder="Nombre de piloto"
                  value={form.reporter_name}
                  onChange={e => setForm(p => ({ ...p, reporter_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Tu Discord *</label>
                <input className="fsl-input" placeholder="@usuario"
                  value={form.reporter_discord}
                  onChange={e => setForm(p => ({ ...p, reporter_discord: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Piloto denunciado</div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Nombre del piloto *</label>
              <input className="fsl-input" placeholder="Nombre exacto del piloto"
                value={form.reported_pilot_name}
                onChange={e => setForm(p => ({ ...p, reported_pilot_name: e.target.value }))} />
            </div>
          </div>

          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Detalle del incidente</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Campeonato</label>
                <select className="fsl-select"
                  value={form.championship_id}
                  onChange={e => setForm(p => ({ ...p, championship_id: e.target.value }))}>
                  <option value="">Seleccioná el campeonato</option>
                  {championships.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Nombre del evento</label>
                <input className="fsl-input" placeholder="Ej: Fecha 3 — Spa"
                  value={form.event_name}
                  onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Vuelta del incidente</label>
                <input className="fsl-input" type="number" placeholder="Ej: 12"
                  value={form.lap_number}
                  onChange={e => setForm(p => ({ ...p, lap_number: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Tiempo del video</label>
                <input className="fsl-input" placeholder="Ej: 0:14:30"
                  value={form.incident_time}
                  onChange={e => setForm(p => ({ ...p, incident_time: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Descripción del incidente *
              </label>
              <textarea className="fsl-input resize-none" rows={5}
                placeholder="Describí con detalle qué ocurrió, en qué curva, qué maniobra se realizó y por qué considerás que viola el reglamento..."
                value={form.incident_description}
                onChange={e => setForm(p => ({ ...p, incident_description: e.target.value }))} />
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Link al video (YouTube, Twitch, etc.)
              </label>
              <input className="fsl-input" placeholder="https://..."
                value={form.video_url}
                onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} />
            </div>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? 'Enviando...' : 'Presentar denuncia'}
          </button>

          <p className="text-gold/20 text-xs text-center font-light">
            Las denuncias falsas o malintencionadas pueden resultar en sanciones al denunciante.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  )
}
