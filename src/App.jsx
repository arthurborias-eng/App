import { lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const HomePage = lazy(() => import('./pages/HomePage'))

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}

function AppInner() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return (
    <Suspense fallback={<Spinner />}>
      {user ? <HomePage /> : <AuthPage />}
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
