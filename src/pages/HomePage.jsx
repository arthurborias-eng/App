import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import ActivityCard from '../components/ActivityCard'
import AddActivityModal from '../components/AddActivityModal'
import { Plus, LogOut, MapPin, CheckCircle2, Clock } from 'lucide-react'

export default function HomePage() {
  const { user, logout } = useAuth()
  const [activities, setActivities] = useState([])
  const [tab, setTab] = useState('todo') // 'todo' | 'done'
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const todoList = activities.filter((a) => !a.done)
  const doneList = activities.filter((a) => a.done)

  const TYPES = ['all', 'restaurant', 'bar', 'activite', 'lieu', 'autre']
  const TYPE_LABELS = { all: 'Tout', restaurant: '🍽️', bar: '🍸', activite: '🎯', lieu: '📍', autre: '✨' }

  const displayed = (tab === 'todo' ? todoList : doneList)
    .filter((a) => filter === 'all' || a.type === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">CollabSpots</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              Salut, <strong className="text-gray-700">{user.displayName || user.email}</strong>
            </span>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex rounded-2xl bg-white shadow-sm border border-gray-100 p-1 mb-6">
          <button
            onClick={() => setTab('todo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              tab === 'todo' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={16} />
            À explorer
            {todoList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab === 'todo' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {todoList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('done')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              tab === 'done' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle2 size={16} />
            Faites
            {doneList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${tab === 'done' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {doneList.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                filter === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {TYPE_LABELS[t]} {t !== 'all' && t}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{tab === 'todo' ? '🗺️' : '🏆'}</div>
            <p className="text-gray-500 text-lg font-medium">
              {tab === 'todo' ? 'Aucun endroit à explorer' : 'Aucune activité faite'}
            </p>
            {tab === 'todo' && (
              <p className="text-gray-400 text-sm mt-1">Ajoute le premier endroit !</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
        title="Ajouter un endroit"
      >
        <Plus size={28} />
      </button>

      {showAdd && <AddActivityModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
