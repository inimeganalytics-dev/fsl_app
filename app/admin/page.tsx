'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FslLogo } from '@/components/ui/FslLogo'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Email o contraseña incorrectos.'); return }
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-fsl-black flex items-center justify-center px-6">
      <div className="fsl-grid-bg absolute inset-0 opacity-50" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6"><FslLogo size={72} /></div>
          <h1 className="font-serif text-3xl text-gold font-bold tracking-widest">FSL</h1>
          <p className="fsl-label mt-2">Panel de administración</p>
        </div>

        <div className="fsl-card p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Email</label>
              <input className="fsl-input" type="email" placeholder="admin@fsl.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gold/50 text-xs tracking-widest uppercase mb-2">Contraseña</label>
              <input className="fsl-input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div className="text-red-400 text-sm border border-red-500/20 bg-red-500/5 px-3 py-2">{error}</div>
            )}
            <button type="submit" disabled={loading} className="btn-gold w-full mt-2">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gold/20 text-xs mt-6 font-light">
          Acceso exclusivo para administradores FSL
        </p>
      </div>
    </div>
  )
}
