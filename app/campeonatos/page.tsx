'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Championship } from '@/lib/supabase'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'

export default function CampeonatosPage() {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('all')

  useEffect(() => {
    async function load() {
      const query = supabase.from('championships')
        .select('*, categories(*, series(*))')
        .order('season', { ascending: false })
      if (filter !== 'all') query.eq('status', filter)
      const { data } = await query
      if (data) setChampionships(data)
      setLoading(false)
    }
    load()
  }, [filter])

  const grouped = championships.reduce((acc, c) => {
    const series = (c as any).categories?.series?.short_name || 'FSL'
    if (!acc[series]) acc[series] = []
    acc[series].push(c)
    return acc
  }, {} as Record<string, Championship[]>)

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <div className="mb-16">
          <div className="fsl-label mb-3">FSL — Federación de Simracing Latinoamericana</div>
          <h1 className="font-serif text-5xl md:text-6xl text-gold font-bold">Campeonatos</h1>
          <div className="w-16 h-px bg-gold/40 mt-6" />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-12">
          {(['all', 'active', 'finished'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-condensed text-xs tracking-[3px] uppercase px-4 py-2 border transition-colors ${
                filter === f
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-gold/20 text-gold/40 hover:border-gold/40'
              }`}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Finalizados'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-24 text-gold/30 font-condensed tracking-widest">Cargando...</div>
        ) : championships.length === 0 ? (
          <div className="text-center py-24 fsl-card p-12">
            <div className="font-serif text-2xl text-gold/40">No hay campeonatos disponibles</div>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(grouped).map(([series, list]) => (
              <div key={series}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-serif text-2xl text-gold">{series}</h2>
                  <div className="flex-1 h-px bg-gold/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {list.map(champ => (
                    <Link key={champ.id} href={`/campeonatos/${champ.id}`}
                      className="fsl-card-hover p-6 block group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="fsl-label">{(champ as any).categories?.short_name} · T{champ.season}</div>
                        <span className={champ.status === 'active' ? 'status-active' : 'status-finished'}>
                          {champ.status === 'active' ? 'Activo' : 'Finalizado'}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl text-gold font-semibold mb-2">{champ.name}</h3>
                      {champ.description && (
                        <p className="text-gold-light/40 text-xs leading-relaxed font-light">{champ.description}</p>
                      )}
                      <div className="mt-4 flex items-center text-gold/40 text-xs font-condensed tracking-widest group-hover:text-gold/60 transition-colors">
                        Ver clasificación →
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
