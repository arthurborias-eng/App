import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import ActivityCard from '../components/ActivityCard'
import AddActivityModal from '../components/AddActivityModal'
import { Plus, CheckCircle2, Clock, Search, X } from 'lucide-react'

const TYPES = ['all', 'restaurant', 'bar', 'activite', 'lieu', 'autre']
const TYPE_LABELS = { all: '🗺️ Tout', restaurant: '🍽️ Resto', bar: '🍸 Bar', activite: '🎯 Activité', lieu: '📍 Visites', autre: '✨ Autre' }
const TYPE_COLORS = {
  all: 'from-violet-500 to-indigo-500',
  restaurant: 'from-orange-500 to-red-500',
  bar: 'from-purple-500 to-pink-500',
  activite: 'from-blue-500 to-cyan-500',
  lieu: 'from-emerald-500 to-teal-500',
  autre: 'from-gray-500 to-slate-500',
}

export default function HomePage({ initialTab }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [tab, setTab] = useState(initialTab || 'todo')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setActivities(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities()
    const channel = supabase
      .channel('activities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchActivities)
      .subscribe()
    return () => channel.unsubscribe()
  }, [])

  const todoList = activities.filter((a) => !a.done)
  const doneList = activities.filter((a) => a.done)
  const displayed = (tab === 'todo' ? todoList : doneList)
    .filter((a) => filter === 'all' || a.type === filter)
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
      <div className="flex rounded-2xl bg-white shadow-sm border border-gray-100 p-1.5 mb-5 gap-1">
        <button
          onClick={() => setTab('todo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            tab === 'todo' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
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
            tab === 'done' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 size={15} />
          Faits
          {doneList.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === 'done' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              {doneList.length}
            </span>
          )}
        </button>
      </div>

      <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un spot…"
            className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-violet-400 text-gray-900 text-sm shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
            </button>
          )}
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                filter === t ? `bg-gradient-to-r ${TYPE_COLORS[t]} text-white shadow-md scale-105` : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">{search ? '🔍' : tab === 'todo' ? '🗺️' : '🏆'}</div>
          <p className="text-gray-600 text-xl font-bold mb-1">
            {search ? 'Aucun résultat' : tab === 'todo' ? 'Rien à explorer encore' : 'Aucune activité faite'}
          </p>
          <p className="text-gray-400 text-sm">
            {search
              ? `Aucun spot ne correspond à "${search}"`
              : tab === 'todo' ? 'Sois le premier à proposer un endroit !' : 'Marque une activité comme faite pour commencer'}
          </p>
        </div>
      ) : (
        <>
          {search && (
            <p className="text-xs text-gray-400 mb-3 font-medium">
              {displayed.length} résultat{displayed.length > 1 ? 's' : ''} pour « {search} »
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-5 sm:right-6 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        <Plus size={20} />
        <span className="hidden sm:block">Ajouter</span>
      </button>

      {showAdd && <AddActivityModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
