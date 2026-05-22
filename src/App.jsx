import { lazy, Suspense, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import { MapPin, UtensilsCrossed, Map, ShoppingCart, LogOut, Menu, X } from 'lucide-react'

const AuthPage      = lazy(() => import('./pages/AuthPage'))
const HomePage      = lazy(() => import('./pages/HomePage'))
const RecipesPage   = lazy(() => import('./pages/RecipesPage'))
const GlobalMapPage = lazy(() => import('./pages/GlobalMapPage'))
const ShoppingPage  = lazy(() => import('./pages/ShoppingPage'))

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'spots',    label: 'Nos spots',       icon: MapPin,          active: 'from-violet-600 to-indigo-600' },
  { id: 'recettes', label: 'Nos recettes',    icon: UtensilsCrossed, active: 'from-rose-500 to-pink-500'     },
  { id: 'carte',    label: 'Carte',            icon: Map,             active: 'from-blue-500 to-cyan-500'     },
  { id: 'courses',  label: 'Liste de courses',icon: ShoppingCart,    active: 'from-emerald-500 to-teal-500'  },
]

function MainApp() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState('spots')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navigate = (id) => {
    setPage(id)
    setDrawerOpen(false)
  }

  const current = NAV_ITEMS.find((n) => n.id === page)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1001]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-[1002] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="bg-gradient-to-br from-violet-600 to-pink-500 px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-white text-2xl tracking-tight">Duo</span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2.5 bg-white/20 rounded-2xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-violet-600 text-sm font-extrabold flex-shrink-0">
              {(user.displayName || user.email)[0].toUpperCase()}
            </div>
            <span className="text-white text-sm font-semibold truncate">{user.displayName || user.email}</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon, active }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                page === id
                  ? `bg-gradient-to-r ${active} text-white shadow-md`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Duo" className="w-7 h-7 rounded-lg" />
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">Duo</span>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${current.active} text-white`}>
              {current.label}
            </span>
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
          {page === 'spots'    && <HomePage />}
          {page === 'recettes' && <RecipesPage />}
          {page === 'carte'    && <GlobalMapPage />}
          {page === 'courses'  && <ShoppingPage />}
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
