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
    pilot_name: '', nickname: '', pilot_number: '', country: '',
    steam_id: '', discord_username: '', phone: '', email: '',
    category_id: '', championship_id: '', message: '',
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [championships, setChampionships] = useState<Championship[]>([])
  const [numberTaken, setNumberTaken] = useState(false)
  const [steamTaken, setSteamTaken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [catRes, champRes] = await Promise.all([
        supabase.from('categories').select('*, series(*)').order('name'),
        // Solo campeonatos ACTIVOS
        supabase.from('championships').select('*, categories(short_name, series(short_name))')
          .eq('status', 'active').order('name'),
      ])
      if (catRes.data) setCategories(catRes.data)
      if (champRes.data) setChampionships(champRes.data)
    }
    load()
  }, [])

  // Verificar número de piloto disponible
  async function checkNumber(num: string) {
    if (!num) { setNumberTaken(false); return }
    const { data } = await supabase.from('pilots').select('id').eq('pilot_number', parseInt(num))
    setNumberTaken((data?.length ?? 0) > 0)
  }

  // Verificar Steam ID no duplicado en registrations pendientes
  async function checkSteamId(steamId: string) {
    if (!steamId || steamId.length < 15) { setSteamTaken(false); return }
    const { data } = await supabase.from('public_registrations')
      .select('id').eq('steam_id', steamId).eq('status', 'pending')
    setSteamTaken((data?.length ?? 0) > 0)
  }

  const filteredChampionships = form.category_id
    ? championships.filter(c => c.category_id === form.category_id)
    : championships

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pilot_name || !form.country || !form.steam_id || !form.discord_username) {
      setError('Completá todos los campos obligatorios (*).')
      return
    }
    if (!/^\d{15,20}$/.test(form.steam_id)) {
      setError('El Steam ID debe ser un número de 15 a 20 dígitos.')
      return
    }
    if (numberTaken) { setError('Ese número de piloto ya está en uso.'); return }
    if (steamTaken) { setError('Ya existe una inscripción pendiente con ese Steam ID.'); return }

    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('public_registrations').insert({
      pilot_name: form.pilot_name,
      nickname: form.nickname || null,
      pilot_number: form.pilot_number ? parseInt(form.pilot_number) : null,
      country: form.country,
      steam_id: form.steam_id,
      steam_username: form.steam_id, // compatibilidad con columna existente
      discord_username: form.discord_username,
      phone: form.phone || null,
      email: form.email || null,
      category_id: form.category_id || null,
      championship_id: form.championship_id || null,
      message: form.message || null,
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
              Tu solicitud fue enviada. La administración FSL la revisará y recibirás respuesta por Discord.
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
            La participación es gratuita. El admin revisará tu solicitud y te confirmará por Discord.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos personales */}
          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Datos del piloto</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Nombre completo *</label>
                <input className="fsl-input" placeholder="Tu nombre real"
                  value={form.pilot_name} onChange={e => setForm(p => ({ ...p, pilot_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Apodo / Nickname</label>
                <input className="fsl-input" placeholder="Ej: El Chapa"
                  value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">País *</label>
                <select className="fsl-select" value={form.country}
                  onChange={e => setForm(p => ({ ...p, country: e.target.value }))}>
                  <option value="">Seleccioná tu país</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                  Número de piloto
                  {numberTaken && <span className="text-red-400 ml-2">· Ya en uso</span>}
                  {form.pilot_number && !numberTaken && <span className="text-emerald-400 ml-2">· Disponible</span>}
                </label>
                <input className="fsl-input" type="number" min="1" max="999" placeholder="Ej: 44"
                  value={form.pilot_number}
                  onChange={e => { setForm(p => ({ ...p, pilot_number: e.target.value })); checkNumber(e.target.value) }} />
              </div>
            </div>
          </div>

          {/* Plataformas */}
          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Steam y contacto</div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Steam ID * 
                <span className="normal-case text-gold/30 ml-2">(número de 17 dígitos — encontralo en steamid.io)</span>
              </label>
              <input className="fsl-input font-condensed tracking-wider"
                placeholder="76561198934292835"
                value={form.steam_id}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '')
                  setForm(p => ({ ...p, steam_id: val }))
                  checkSteamId(val)
                }} />
              {steamTaken && <p className="text-red-400 text-xs mt-1">Ya existe una inscripción pendiente con este Steam ID.</p>}
              {form.steam_id && !steamTaken && form.steam_id.length >= 15 && (
                <p className="text-emerald-400 text-xs mt-1">Steam ID disponible.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Discord *</label>
                <input className="fsl-input" placeholder="@usuario"
                  value={form.discord_username} onChange={e => setForm(p => ({ ...p, discord_username: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Teléfono</label>
                <input className="fsl-input" placeholder="+54 9 11 1234-5678"
                  value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Email (opcional)</label>
              <input className="fsl-input" type="email" placeholder="tu@email.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          {/* Campeonato */}
          <div className="fsl-card p-6 space-y-4">
            <div className="fsl-label mb-2">Campeonato</div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Categoría de interés</label>
              <select className="fsl-select" value={form.category_id}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value, championship_id: '' }))}>
                <option value="">Cualquier categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{(c as any).series?.short_name} — {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
                Campeonato *
                {filteredChampionships.length === 0 && <span className="text-red-400 ml-2">· Sin campeonatos activos</span>}
              </label>
              <select className="fsl-select" value={form.championship_id}
                onChange={e => setForm(p => ({ ...p, championship_id: e.target.value }))}>
                <option value="">Seleccioná un campeonato activo</option>
                {filteredChampionships.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — T{c.season}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Mensaje (opcional)</label>
              <textarea className="fsl-input resize-none" rows={3}
                placeholder="¿Experiencia previa? ¿Algo que quieras aclarar?"
                value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
            </div>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading || numberTaken || steamTaken} className="btn-gold w-full">
            {loading ? 'Enviando...' : 'Enviar inscripción'}
          </button>

          <p className="text-gold/20 text-xs text-center font-light">
            Al enviar aceptás el reglamento FSL v1.0 y sus condiciones de participación.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  )
}
