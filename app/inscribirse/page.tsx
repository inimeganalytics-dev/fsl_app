'use client'
import { useEffect, useState } from 'react'
import { supabase, Championship, Category } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' }, { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' }, { code: 'PE', name: 'Perú' },
  { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' }, { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' }, { code: 'OTHER', name: 'Otro' },
]

export default function InscribirsePage() {
  const [form, setForm] = useState({
    pilot_name: '', pilot_number: '', country: '',
    steam_username: '', discord_username: '', email: '',
    category_id: '', championship_id: '', message: '',
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [catRes, champRes] = await Promise.all([
        supabase.from('categories').select('*, series(*)').order('name'),
        supabase.from('championships').select('*, categories(short_name)').eq('status', 'active').order('name'),
      ])
      if (catRes.data) setCategories(catRes.data)
      if (champRes.data) setChampionships(champRes.data)
    }
    load()
  }, [])

  const filteredChampionships = form.category_id
    ? championships.filter(c => c.category_id === form.category_id)
    : championships

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pilot_name || !form.country || !form.steam_username || !form.discord_username) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('public_registrations').insert({
      ...form,
      pilot_number: form.pilot_number ? parseInt(form.pilot_number) : null,
      category_id: form.category_id || null,
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
            <h2 className="font-serif text-3xl text-gold font-bold mb-4">Inscripción recibida</h2>
            <p className="text-gold-light/60 leading-relaxed mb-8">
              Tu solicitud fue enviada correctamente. La administración de la FSL la revisará y recibirás confirmación a través del servidor de Discord.
            </p>
            <button onClick={() => setSuccess(false)} className="btn-outline">Enviar otra inscripción</button>
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
          <div className="fsl-label mb-3">Unirse a la FSL</div>
          <h1 className="font-serif text-5xl text-gold font-bold">Inscripción</h1>
          <div className="w-16 h-px bg-gold/40 mt-6 mb-6" />
          <p className="text-gold-light/50 text-sm leading-relaxed font-light">
            Completá el formulario para solicitar tu inscripción. La participación es completamente gratuita.
            La administración revisará tu solicitud y se comunicará por Discord.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Datos del piloto</div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Nombre de piloto *
              </label>
              <input
                className="fsl-input"
                placeholder="Tu nombre en la liga"
                value={form.pilot_name}
                onChange={e => setForm(p => ({ ...p, pilot_name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                  Número deseado
                </label>
                <input
                  className="fsl-input"
                  type="number" min="1" max="99"
                  placeholder="Ej: 44"
                  value={form.pilot_number}
                  onChange={e => setForm(p => ({ ...p, pilot_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                  País *
                </label>
                <select
                  className="fsl-select"
                  value={form.country}
                  onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                >
                  <option value="">Seleccioná tu país</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Contacto y plataformas</div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Usuario de Steam *
              </label>
              <input
                className="fsl-input"
                placeholder="Tu nombre de usuario en Steam"
                value={form.steam_username}
                onChange={e => setForm(p => ({ ...p, steam_username: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Usuario de Discord *
              </label>
              <input
                className="fsl-input"
                placeholder="usuario#0000 o @usuario"
                value={form.discord_username}
                onChange={e => setForm(p => ({ ...p, discord_username: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Email (opcional)
              </label>
              <input
                className="fsl-input"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Categoría de interés</div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Categoría</label>
              <select
                className="fsl-select"
                value={form.category_id}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value, championship_id: '' }))}
              >
                <option value="">Cualquier categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {(c as any).series?.short_name} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Campeonato específico</label>
              <select
                className="fsl-select"
                value={form.championship_id}
                onChange={e => setForm(p => ({ ...p, championship_id: e.target.value }))}
              >
                <option value="">Cualquier campeonato activo</option>
                {filteredChampionships.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — T{c.season}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Mensaje adicional (opcional)
              </label>
              <textarea
                className="fsl-input resize-none"
                rows={3}
                placeholder="¿Tenés experiencia previa? ¿Algo que quieras aclarar?"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? 'Enviando...' : 'Enviar inscripción'}
          </button>

          <p className="text-gold/20 text-xs text-center font-light">
            Al enviar aceptás el reglamento de la FSL y sus condiciones de participación.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  )
}
