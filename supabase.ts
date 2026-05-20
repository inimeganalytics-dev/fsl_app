'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    championships: 0, events: 0, pilots: 0, pendingReg: 0,
    pendingComplaints: 0, sanctions: 0,
  })
  const [recentReg, setRecentReg] = useState<any[]>([])
  const [recentComplaints, setRecentComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, e, p, reg, comp, s, rReg, rComp] = await Promise.all([
        supabase.from('championships').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('pilots').select('*', { count: 'exact', head: true }),
        supabase.from('public_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('public_complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('sanctions').select('*', { count: 'exact', head: true }),
        supabase.from('public_registrations').select('*, categories(short_name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('public_complaints').select('*').in('status', ['pending', 'reviewing']).order('created_at', { ascending: false }).limit(5),
      ])
      setStats({
        championships: c.count || 0, events: e.count || 0, pilots: p.count || 0,
        pendingReg: reg.count || 0, pendingComplaints: comp.count || 0, sanctions: s.count || 0,
      })
      if (rReg.data) setRecentReg(rReg.data)
      if (rComp.data) setRecentComplaints(rComp.data)
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Campeonatos', value: stats.championships, href: '/admin/campeonatos', color: 'text-gold' },
    { label: 'Eventos', value: stats.events, href: '/admin/eventos', color: 'text-gold' },
    { label: 'Pilotos', value: stats.pilots, href: '/admin/pilotos', color: 'text-gold' },
    { label: 'Sanciones', value: stats.sanctions, href: '/admin/sanciones', color: 'text-orange-400' },
    { label: 'Inscripciones pendientes', value: stats.pendingReg, href: '/admin/inscripciones', color: stats.pendingReg > 0 ? 'text-amber-400' : 'text-gold' },
    { label: 'Denuncias pendientes', value: stats.pendingComplaints, href: '/admin/denuncias', color: stats.pendingComplaints > 0 ? 'text-red-400' : 'text-gold' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-gold font-bold">Dashboard</h1>
        <p className="text-gold/30 text-sm mt-1">Panel de control FSL</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}
            className="fsl-card-hover p-5 block">
            <div className="fsl-label mb-2">{s.label}</div>
            <div className={`font-serif text-4xl font-bold ${s.color}`}>
              {loading ? '—' : s.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent registrations */}
        <div className="fsl-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="fsl-label">Inscripciones pendientes</div>
            <Link href="/admin/inscripciones" className="text-gold/40 text-xs font-condensed tracking-widest hover:text-gold transition-colors">
              Ver todas →
            </Link>
          </div>
          {recentReg.length === 0 ? (
            <p className="text-gold/20 text-sm text-center py-6">Sin inscripciones pendientes</p>
          ) : (
            <div className="space-y-3">
              {recentReg.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gold/[0.06]">
                  <div>
                    <div className="text-gold-light text-sm font-medium">{r.pilot_name}</div>
                    <div className="text-gold/30 text-xs">{r.discord_username} · {r.country}</div>
                  </div>
                  <span className="status-pending">Pendiente</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent complaints */}
        <div className="fsl-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="fsl-label">Denuncias activas</div>
            <Link href="/admin/denuncias" className="text-gold/40 text-xs font-condensed tracking-widest hover:text-gold transition-colors">
              Ver todas →
            </Link>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="text-gold/20 text-sm text-center py-6">Sin denuncias activas</p>
          ) : (
            <div className="space-y-3">
              {recentComplaints.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gold/[0.06]">
                  <div>
                    <div className="text-gold-light text-sm font-medium">
                      {c.reporter_name} <span className="text-gold/30">vs</span> {c.reported_pilot_name}
                    </div>
                    <div className="text-gold/30 text-xs">{c.event_name || 'Sin evento especificado'}</div>
                  </div>
                  <span className={c.status === 'reviewing' ? 'status-active' : 'status-pending'}>
                    {c.status === 'reviewing' ? 'Revisando' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 fsl-card p-6">
        <div className="fsl-label mb-4">Acciones rápidas</div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/campeonatos" className="btn-outline text-xs">+ Nuevo campeonato</Link>
          <Link href="/admin/eventos" className="btn-outline text-xs">+ Nueva fecha</Link>
          <Link href="/admin/resultados" className="btn-outline text-xs">+ Cargar resultados</Link>
          <Link href="/admin/sanciones" className="btn-outline text-xs">+ Nueva sanción</Link>
          <Link href="/admin/pilotos" className="btn-outline text-xs">+ Nuevo piloto</Link>
        </div>
      </div>
    </div>
  )
}
