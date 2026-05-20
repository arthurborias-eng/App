import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import { Toaster } from 'react-hot-toast'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <HomePage /> : <AuthPage />
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
