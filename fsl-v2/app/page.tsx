'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { FslLogo } from '@/components/ui/FslLogo'

// ── helpers ──────────────────────────────────────────────────
function pad(n: number) { return n < 10 ? '0' + n : '' + n }
function msToTime(ms: number) {
  if (!ms || ms <= 0) return '—'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const mm = String(ms % 1000).padStart(3, '0')
  return `${m}:${String(s).padStart(2, '0')}.${mm}`
}

// ── useTilt hook ──────────────────────────────────────────────
function useTilt(strength = 6) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width - 0.5) * strength
      const y = -((e.clientY - r.top) / r.height - 0.5) * strength
      el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-2px)`
    }
    const onLeave = () => { el.style.transform = '' }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [strength])
  return ref
}

// ── countdown ─────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now())
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}

// ── TiltCard wrapper ──────────────────────────────────────────
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useTilt(5)
  return (
    <div ref={ref} className={`transition-transform duration-150 ${className}`}>{children}</div>
  )
}

// ════════════════════════════════════════════════════════════
export default function Home() {
  const bannerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState(0)
  const [championships, setChampionships] = useState<any[]>([])
  const [standings, setStandings] = useState<any[]>([])
  const [nextEvents, setNextEvents] = useState<any[]>([])
  const [topPilots, setTopPilots] = useState<any[]>([])
  const [liveEvent, setLiveEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Target: 6 days from now at 20:00 ARG (placeholder)
  const raceTarget = useRef(new Date(Date.now() + 6 * 86400000 + 14 * 3600000 + 32 * 60000))
  const cd = useCountdown(raceTarget.current)

  const tabs = ['FSL-M · F4', 'FSL-M · F3', 'FSL-E · GT3', 'FSL-E · TCR']

  // Hero mouse parallax
  useEffect(() => {
    const banner = bannerRef.current
    const grid = gridRef.current
    const glow = glowRef.current
    const logo = logoRef.current
    if (!banner) return

    const onMove = (e: MouseEvent) => {
      const r = banner.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const cx = r.width / 2
      const cy = r.height / 2
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy

      if (grid) grid.style.backgroundPosition = `${dx * 14}px ${dy * 10}px`
      if (glow) { glow.style.left = x + 'px'; glow.style.top = y + 'px'; glow.style.opacity = '1' }
      if (logo) logo.style.transform = `perspective(500px) rotateX(${-dy * 10}deg) rotateY(${dx * 10}deg)`
    }
    const onLeave = () => {
      if (grid) grid.style.backgroundPosition = '0 0'
      if (glow) glow.style.opacity = '0'
      if (logo) logo.style.transform = ''
    }

    banner.addEventListener('mousemove', onMove)
    banner.addEventListener('mouseleave', onLeave)
    return () => { banner.removeEventListener('mousemove', onMove); banner.removeEventListener('mouseleave', onLeave) }
  }, [])

  // Load data
  useEffect(() => {
    async function load() {
      const [champRes, eventsRes, pilotsRes, liveRes] = await Promise.all([
        supabase.from('championships').select('*, categories(*, series(*))').eq('status', 'active').order('season', { ascending: false }),
        supabase.from('events').select('*, championships(name, categories(short_name, series(short_name)))').eq('status', 'scheduled').gte('scheduled_date', new Date().toISOString()).order('scheduled_date').limit(4),
        supabase.from('pilots').select('*, users(real_name, steam_name, country_code)').order('lp', { ascending: false }).limit(3),
        supabase.from('events').select('*, championships(name, categories(short_name, series(short_name)))').eq('status', 'live').limit(1),
      ])
      if (champRes.data) setChampionships(champRes.data)
      if (eventsRes.data) setNextEvents(eventsRes.data)
      if (pilotsRes.data) setTopPilots(pilotsRes.data)
      if (liveRes.data && liveRes.data.length > 0) setLiveEvent(liveRes.data[0])
      setLoading(false)
    }
    load()
  }, [])

  const nextRace = nextEvents[0]
  const upcomingEvents = nextEvents.slice(1)

  return (
    <div className="min-h-screen bg-fsl-bg">
      <Navbar />

      {/* ── HERO BANNER ── */}
      <div ref={bannerRef} className="relative overflow-hidden bg-fsl-dark pt-14" style={{ cursor: 'default' }}>
        {/* Grid */}
        <div ref={gridRef} className="absolute inset-0 fsl-grid-bg pointer-events-none transition-none" />
        {/* Gold stripe right */}
        <div className="absolute top-0 right-0 w-1 h-full bg-gold opacity-70" />
        {/* Glow that follows cursor */}
        <div ref={glowRef} className="absolute pointer-events-none opacity-0 transition-opacity"
          style={{ width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-[auto_1fr_auto] min-h-[200px] items-center">

          {/* Logo col */}
          <div className="flex flex-col items-center gap-3 pr-8 border-r border-gold/20 py-10 hidden md:flex">
            <div ref={logoRef} className="transition-transform duration-150">
              <FslLogo size={108} />
            </div>
            <div className="font-condensed text-[8px] tracking-[5px] uppercase text-gold text-center">Temporada 2025</div>
          </div>

          {/* Center copy */}
          <div className="px-8 md:px-10 py-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gold/40" />
              <span className="font-condensed text-[10px] tracking-[6px] uppercase text-gold">Federación Oficial · América Latina</span>
              <div className="h-px w-8 bg-gold/40" />
            </div>
            <h1 className="font-condensed font-black uppercase leading-[0.88] text-white mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
              El simracing<br />latino<br />
              <span className="text-gold">empieza acá.</span>
            </h1>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/inscribirse" className="btn-gold">Inscribirme</Link>
              <Link href="/campeonatos" className="btn-outline">Ver campeonatos</Link>
            </div>
          </div>

          {/* Right col */}
          <div className="pl-8 border-l border-gold/20 py-10 hidden lg:flex flex-col gap-4 min-w-[220px]">
            {/* Next race card */}
            <TiltCard>
              <div className="bg-fsl-carbon border border-gold/30 p-4">
                <div className="fsl-label mb-2">Próxima carrera</div>
                {nextRace ? (
                  <>
                    <div className="font-condensed font-black text-lg text-white leading-tight">{nextRace.name}</div>
                    <div className="font-condensed text-[10px] tracking-[3px] text-gold mt-1">
                      {(nextRace as any).championships?.categories?.series?.short_name} · {(nextRace as any).championships?.categories?.short_name}
                    </div>
                  </>
                ) : (
                  <div className="font-condensed font-black text-lg text-white leading-tight">Por confirmar</div>
                )}
                {/* Countdown */}
                <div className="grid grid-cols-4 gap-0.5 mt-3">
                  {[{ n: cd.d, l: 'Días' }, { n: cd.h, l: 'Hs' }, { n: cd.m, l: 'Min' }, { n: cd.s, l: 'Seg' }].map(u => (
                    <div key={u.l} className="bg-fsl-dark py-2 text-center">
                      <span className="font-condensed font-black text-2xl text-white block leading-none">{pad(u.n)}</span>
                      <span className="font-condensed text-[8px] tracking-[2px] uppercase text-fsl-dim">{u.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>

            {/* Series cards */}
            <div className="grid grid-cols-2 gap-0.5">
              {[
                { code: 'FSL-M', name: 'Monoplazas', cats: ['F4', 'F3', 'F2', 'F1'], active: ['F4', 'F3'] },
                { code: 'FSL-E', name: 'Endurance', cats: ['TCR', 'GT4', 'GT3', 'P2', 'H'], active: [] },
              ].map(s => (
                <TiltCard key={s.code}>
                  <div className="bg-fsl-carbon border border-fsl-border hover:border-gold/40 p-3 transition-colors cursor-pointer">
                    <div className="font-condensed font-black text-[17px] text-gold leading-none">{s.code}</div>
                    <div className="font-condensed text-[8px] tracking-[2px] uppercase text-fsl-dim mb-2">{s.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {s.cats.map(c => (
                        <span key={c} className={`font-condensed text-[8px] tracking-[1px] px-1.5 py-0.5 ${
                          s.active.includes(c) ? 'bg-gold/20 text-gold' : 'bg-fsl-border text-fsl-muted'
                        }`}>{c}</span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE BAR ── */}
      {liveEvent ? (
        <div className="bg-fsl-dark border-b border-fsl-border px-6 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-600 px-3 py-1">
            <div className="live-dot" />
            <span className="font-condensed font-bold text-[10px] tracking-[3px] uppercase text-white">En vivo</span>
          </div>
          <span className="text-white text-sm font-medium">{liveEvent.name}</span>
          <span className="text-fsl-muted text-xs">{(liveEvent as any).championships?.name}</span>
        </div>
      ) : null}

      {/* ── STATS BAR ── */}
      <div className="bg-fsl-carbon border-b border-fsl-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-fsl-border">
          {[
            { n: championships.length || '—', l: 'Campeonatos activos' },
            { n: nextEvents.length, l: 'Próximas fechas' },
            { n: '2', l: 'Series' },
            { n: '8', l: 'Categorías' },
          ].map(s => (
            <div key={s.l} className="py-4 px-6 text-center hover:bg-fsl-bg transition-colors">
              <div className="font-condensed font-black text-3xl text-gold leading-none">{loading ? '—' : s.n}</div>
              <div className="fsl-label mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">

        {/* LEFT */}
        <div className="space-y-8">

          {/* Clasificación */}
          <div>
            <div className="fsl-sh">
              <div className="fsl-sh-title">Clasificación <span className="text-gold">general</span></div>
              <Link href="/campeonatos" className="fsl-sh-link">Ver completa →</Link>
            </div>
            {/* Tabs */}
            <div className="flex gap-0.5 mb-3">
              {tabs.map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(i)}
                  className={`font-condensed text-[11px] font-bold tracking-[2px] uppercase px-4 py-2 transition-colors ${
                    activeTab === i ? 'bg-gold text-fsl-dark' : 'bg-fsl-carbon text-fsl-dim hover:text-gold'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            {/* Table */}
            <div className="border border-fsl-border overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-fsl-carbon">
                    <th className="font-condensed text-[9px] tracking-[3px] uppercase text-fsl-dim px-3 py-2 text-left w-10">Pos</th>
                    <th className="font-condensed text-[9px] tracking-[3px] uppercase text-fsl-dim px-3 py-2 text-left">Piloto</th>
                    <th className="font-condensed text-[9px] tracking-[3px] uppercase text-fsl-dim px-3 py-2 text-center w-12">V</th>
                    <th className="font-condensed text-[9px] tracking-[3px] uppercase text-fsl-dim px-3 py-2 text-right w-16">Pts</th>
                    <th className="font-condensed text-[9px] tracking-[3px] uppercase text-fsl-dim px-3 py-2 text-right w-14">LP</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.length > 0 ? standings.slice(0, 5).map((s: any, i) => (
                    <tr key={s.pilotId} className={`border-b border-fsl-border/40 hover:bg-fsl-mid transition-colors ${i === 0 ? 'bg-gold/5 border-l-2 border-l-gold' : 'bg-fsl-bg'}`}>
                      <td className="px-3 py-3">
                        <span className={`font-condensed text-[20px] font-black ${i === 0 ? 'text-gold' : 'text-white'}`}>{i + 1}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-white text-sm">{s.name}</div>
                        <div className="font-condensed text-[10px] tracking-[2px] text-fsl-dim">{s.country} · #{s.number || '—'}</div>
                      </td>
                      <td className="px-3 py-3 text-center font-condensed text-sm text-fsl-muted">{s.wins}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-condensed text-[17px] font-black ${i === 0 ? 'text-gold' : 'text-white'}`}>{s.points}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-condensed text-[11px] text-fsl-dim">{s.lp} LP</td>
                    </tr>
                  )) : (
                    // Placeholder rows
                    [1,2,3,4,5].map(i => (
                      <tr key={i} className={`border-b border-fsl-border/40 hover:bg-fsl-mid transition-colors ${i === 1 ? 'bg-gold/5 border-l-2 border-l-gold' : 'bg-fsl-bg'}`}>
                        <td className="px-3 py-3">
                          <span className={`font-condensed text-[20px] font-black ${i === 1 ? 'text-gold' : 'text-white'}`}>{i}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-white text-sm">—</div>
                          <div className="font-condensed text-[10px] tracking-[2px] text-fsl-dim">Sin resultados todavía</div>
                        </td>
                        <td className="px-3 py-3 text-center font-condensed text-sm text-fsl-muted">—</td>
                        <td className="px-3 py-3 text-right font-condensed text-[17px] font-black text-fsl-dim">—</td>
                        <td className="px-3 py-3 text-right font-condensed text-[11px] text-fsl-dim">—</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calendario */}
          <div>
            <div className="fsl-sh">
              <div className="fsl-sh-title">Calendario <span className="text-gold">2025</span></div>
              <Link href="/eventos" className="fsl-sh-link">Ver todo →</Link>
            </div>
            {loading ? (
              <div className="text-center py-10 text-fsl-dim font-condensed tracking-widest">Cargando...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                {nextEvents.length === 0 ? (
                  <div className="col-span-2 fsl-card p-10 text-center text-fsl-dim font-serif text-xl">
                    Sin fechas programadas
                  </div>
                ) : nextEvents.map((ev, i) => {
                  const date = new Date(ev.scheduled_date)
                  const champ = (ev as any).championships
                  return (
                    <TiltCard key={ev.id}>
                      <div className={`fsl-ev ${i === 0 ? 'fsl-ev-next' : ''}`}>
                        <div className="min-w-[44px] text-center border-r border-fsl-border pr-3">
                          <div className="font-condensed font-black text-3xl text-white leading-none">{date.getDate()}</div>
                          <div className="font-condensed text-[9px] tracking-[2px] uppercase text-gold">
                            {date.toLocaleString('es', { month: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="fsl-label mb-1">{champ?.series?.short_name || champ?.categories?.series?.short_name} · {champ?.categories?.short_name || champ?.short_name} · F{i + 4}</div>
                          <div className="font-condensed font-bold text-[15px] text-white">{ev.name}</div>
                          <div className="text-sm text-fsl-dim mt-0.5">{ev.circuit_name}</div>
                          <div className="font-condensed text-[10px] tracking-[2px] text-gold mt-1.5">
                            {date.toLocaleString('es', { hour: '2-digit', minute: '2-digit' })} ARG
                          </div>
                        </div>
                        {i === 0 && <span className="font-condensed text-[8px] tracking-[2px] uppercase px-2 py-1 bg-gold/20 text-gold border border-gold/30 self-start whitespace-nowrap">Próxima</span>}
                      </div>
                    </TiltCard>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-5">

          {/* Top LP */}
          <div>
            <div className="fsl-sh">
              <div className="fsl-sh-title">Top <span className="text-gold">LP</span></div>
              <Link href="/pilotos" className="fsl-sh-link">Ver →</Link>
            </div>
            <div className="border border-fsl-border divide-y divide-fsl-border/40">
              {topPilots.length > 0 ? topPilots.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-fsl-bg hover:bg-fsl-mid transition-colors cursor-default">
                  <div className={`font-condensed font-black text-[18px] min-w-[30px] text-center ${i === 0 ? 'text-gold' : 'text-fsl-border'}`}>
                    {p.pilot_number || '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{p.users?.real_name || p.users?.steam_name}</div>
                    <div className="font-condensed text-[9px] tracking-[2px] text-fsl-dim">{p.users?.country_code} · Lic. D</div>
                  </div>
                  <div className={`font-condensed font-bold text-[13px] ${i === 0 ? 'text-gold' : 'text-fsl-muted'}`}>{p.lp} LP</div>
                </div>
              )) : (
                <div className="px-4 py-6 text-center text-fsl-dim text-sm bg-fsl-bg">Sin pilotos todavía</div>
              )}
            </div>
          </div>

          {/* Próximos eventos sidebar */}
          <div>
            <div className="fsl-sh">
              <div className="fsl-sh-title">Próximos</div>
              <Link href="/eventos" className="fsl-sh-link">Ver →</Link>
            </div>
            <div className="space-y-0.5">
              {nextEvents.slice(0, 4).map((ev, i) => {
                const date = new Date(ev.scheduled_date)
                const champ = (ev as any).championships
                return (
                  <div key={ev.id}
                    className={`flex items-start gap-3 py-3 border-b border-fsl-border/40 hover:bg-fsl-carbon hover:px-2 transition-all cursor-default ${
                      i === 0 ? 'border-l-2 border-l-gold pl-2' : ''
                    }`}>
                    <div className="min-w-[34px] text-center">
                      <div className="font-condensed font-black text-2xl text-white leading-none">{date.getDate()}</div>
                      <div className="font-condensed text-[8px] tracking-[2px] uppercase text-gold">{date.toLocaleString('es', { month: 'short' })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="fsl-label mb-0.5">{champ?.categories?.series?.short_name} · {champ?.categories?.short_name}</div>
                      <div className="font-condensed font-bold text-[13px] text-white truncate">{ev.name}</div>
                      <div className="font-condensed text-[9px] tracking-[2px] text-gold mt-1">
                        {date.toLocaleString('es', { hour: '2-digit', minute: '2-digit' })} ARG
                      </div>
                    </div>
                  </div>
                )
              })}
              {nextEvents.length === 0 && (
                <div className="py-6 text-center text-fsl-dim text-sm">Sin eventos próximos</div>
              )}
            </div>
          </div>

          {/* CTA Inscripción */}
          <Link href="/inscribirse">
            <div className="bg-gold p-4 text-center hover:bg-gold-hover transition-colors cursor-pointer">
              <div className="font-condensed font-black text-[12px] tracking-[3px] uppercase text-fsl-dark">Inscribirme a FSL</div>
              <div className="text-[11px] text-fsl-dark/70 mt-1">Temporada 2025 · Inscripción paga</div>
            </div>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
