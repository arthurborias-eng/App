import { lazy, Suspense, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import { MapPin, UtensilsCrossed, LogOut } from 'lucide-react'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const RecipesPage = lazy(() => import('./pages/RecipesPage'))

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}

function MainApp() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState('spots')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg">💑</span>
            </div>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">À deux</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {(user.displayName || user.email)[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.displayName || user.email}</span>
            </div>
            <button onClick={logout} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500" title="Déconnexion">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
            <button
              onClick={() => setPage('spots')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                page === 'spots'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MapPin size={15} />
              Nos spots
            </button>
            <button
              onClick={() => setPage('recettes')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                page === 'recettes'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UtensilsCrossed size={15} />
              Nos recettes
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        }>
          {page === 'spots' ? <HomePage /> : <RecipesPage />}
        </Suspense>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return (
    <Suspense fallback={<Spinner />}>
      {user ? <MainApp /> : <AuthPage />}
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '12px', fontWeight: 500 },
          success: { duration: 3000 },
          error: { duration: 4000 },
        }}
      />
    </AuthProvider>
  )
}
