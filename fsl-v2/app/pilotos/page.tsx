'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'

export default function PilotosPage() {
  const [steamId, setSteamId] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const clean = steamId.replace(/\D/g, '')
    if (clean.length < 15) return
    router.push(`/pilotos/${clean}`)
  }

  return (
    <div className="min-h-screen bg-fsl-black">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-12">
          <div className="fsl-label mb-3">Base de datos FSL</div>
          <h1 className="font-serif text-5xl text-gold font-bold">Buscar piloto</h1>
          <div className="w-16 h-px bg-gold/40 mt-6" />
        </div>
        <form onSubmit={handleSearch} className="fsl-card p-8 space-y-4">
          <div>
            <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">
              Steam ID
              <span className="normal-case text-gold/30 ml-2">(encontralo en steamid.io)</span>
            </label>
            <input className="fsl-input font-condensed tracking-wider text-lg"
              placeholder="76561198934292835"
              value={steamId}
              onChange={e => setSteamId(e.target.value.replace(/\D/g, ''))} />
          </div>
          <button type="submit" disabled={steamId.length < 15} className="btn-gold w-full">
            Buscar piloto
          </button>
        </form>
      </div>
      <Footer />
    </div>
  )
}
