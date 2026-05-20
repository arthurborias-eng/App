import { useState, useEffect, lazy, Suspense } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import ActivityCard from '../components/ActivityCard'
import AddActivityModal from '../components/AddActivityModal'
import { Plus, LogOut, MapPin, CheckCircle2, Clock, List, Map } from 'lucide-react'

const DoneMap = lazy(() => import('../components/DoneMap'))

const TYPES = ['all', 'restaurant', 'bar', 'activite', 'lieu', 'autre']
const TYPE_LABELS = { all: '🗺️ Tout', restaurant: '🍽️ Resto', bar: '🍸 Bar', activite: '🎯 Activité', lieu: '📍 Lieu', autre: '✨ Autre' }
const TYPE_COLORS = {
  all: 'from-violet-500 to-indigo-500',
  restaurant: 'from-orange-500 to-red-500',
  bar: 'from-purple-500 to-pink-500',
  activite: 'from-blue-500 to-cyan-500',
  lieu: 'from-emerald-500 to-teal-500',
  autre: 'from-gray-500 to-slate-500',
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const [activities, setActivities] = useState([])
  const [tab, setTab] = useState('todo')
  const [doneView, setDoneView] = useState('list') // 'list' | 'map'
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
  const displayed = (tab === 'todo' ? todoList : doneList)
    .filter((a) => filter === 'all' || a.type === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <MapPin size={17} className="text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">CollabSpots</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {(user.displayName || user.email)[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.displayName || user.email}</span>
            </div>
            <button onClick={logout} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500" title="Déconnexion">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Main tabs */}
        <div className="flex rounded-2xl bg-white shadow-sm border border-gray-100 p-1.5 mb-5 gap-1">
          <button
            onClick={() => setTab('todo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'todo'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Clock size={15} />
            À explorer
            {todoList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === 'todo' ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-700'}`}>
                {todoList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('done')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'done'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 size={15} />
            Faites
            {doneList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === 'done' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                {doneList.length}
              </span>
            )}
          </button>
        </div>

        {/* Done sub-nav: Liste / Carte */}
        {tab === 'done' && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1 shadow-sm">
              <button
                onClick={() => setDoneView('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  doneView === 'list'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <List size={14} /> Liste
              </button>
              <button
                onClick={() => setDoneView('map')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  doneView === 'map'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Map size={14} /> Carte
              </button>
            </div>
          </div>
        )}

        {/* Filters — hidden in map view */}
        {!(tab === 'done' && doneView === 'map') && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  filter === t
                    ? `bg-gradient-to-r ${TYPE_COLORS[t]} text-white shadow-md scale-105`
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : tab === 'done' && doneView === 'map' ? (
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" /></div>}>
            <DoneMap activities={doneList} />
          </Suspense>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">{tab === 'todo' ? '🗺️' : '🏆'}</div>
            <p className="text-gray-600 text-xl font-bold mb-1">
              {tab === 'todo' ? 'Rien à explorer encore' : 'Aucune activité faite'}
            </p>
            <p className="text-gray-400 text-sm">
              {tab === 'todo' ? 'Sois le premier à proposer un endroit !' : 'Marque une activité comme faite pour commencer'}
            </p>
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
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
      >
        <Plus size={20} />
        <span className="hidden sm:block">Ajouter</span>
      </button>

      {showAdd && <AddActivityModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
