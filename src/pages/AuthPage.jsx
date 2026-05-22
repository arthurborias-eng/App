import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!name.trim()) { toast.error('Entre ton prénom'); setLoading(false); return }
        await register(email, password, name.trim())
        toast.success('Bienvenue ! 🎉')
      } else {
        await login(email, password)
        toast.success('Content de te revoir !')
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        toast.error('Email ou mot de passe incorrect')
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        toast.error('Email déjà utilisé')
      } else if (msg.includes('at least 6') || msg.includes('Password')) {
        toast.error('Mot de passe trop faible (6 car. min)')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700">
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-white/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl text-5xl">
            💑
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">À deux</h1>
          <p className="text-white/70 mt-2 text-lg">Vos spots & recettes 🗺️</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex bg-gray-50 p-1.5 gap-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton prénom"
                  required
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-violet-400 text-gray-900 bg-gray-50 transition-colors text-base"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-violet-400 text-gray-900 bg-gray-50 transition-colors text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-violet-400 text-gray-900 bg-gray-50 transition-colors text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white font-extrabold rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 mt-2"
            >
              {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter 🚀' : 'Créer mon compte ✨'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
