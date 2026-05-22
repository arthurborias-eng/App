import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import WatchlistCard from '../components/WatchlistCard'
import AddWatchlistModal from '../components/AddWatchlistModal'
import { Plus, Search, X, Film, Tv } from 'lucide-react'

const PLATFORMS = ['Netflix', 'Disney+', 'Prime Video', 'Apple TV+', 'Canal+', 'OCS', 'Salto', 'Autre']

export default function WatchlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('todo')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    const channel = supabase
      .channel('watchlist-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist' }, fetchItems)
      .subscribe()
    return () => channel.unsubscribe()
  }, [])

  const todoList = items.filter((i) => !i.done)
  const doneList = items.filter((i) => i.done)
  const baseList = tab === 'todo' ? todoList : doneList

  const displayed = baseList
    .filter((i) => typeFilter === 'all' || i.type === typeFilter)
    .filter((i) => !platformFilter || i.platform === platformFilter)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))

  const usedPlatforms = [...new Set(items.map((i) => i.platform).filter(Boolean))]

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white shadow-sm border border-gray-100 p-1.5 mb-4 gap-1">
        <button
          onClick={() => setTab('todo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            tab === 'todo'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          🎬 À voir
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === 'todo' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {todoList.length}
          </span>
        </button>
        <button
          onClick={() => setTab('done')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            tab === 'done'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          ✅ Vus
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === 'done' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {doneList.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-violet-400 text-gray-900 text-sm shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[['all', '🎞️ Tout'], ['film', '🎬 Films'], ['serie', '📺 Séries']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              typeFilter === val
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        {usedPlatforms.length > 0 && (
          <>
            <div className="w-px bg-gray-200 self-stretch mx-1" />
            {usedPlatforms.map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(platformFilter === p ? '' : p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  platformFilter === p
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">{tab === 'todo' ? '🎬' : '📽️'}</div>
          <p className="text-gray-600 text-xl font-bold mb-1">
            {search || typeFilter !== 'all' || platformFilter ? 'Aucun résultat' : tab === 'todo' ? 'Rien à voir pour l\'instant' : 'Aucun film ou série vu encore'}
          </p>
          <p className="text-gray-400 text-sm">
            {!search && typeFilter === 'all' && !platformFilter && tab === 'todo' && 'Ajoute des films et séries à regarder ensemble !'}
          </p>
        </div>
      ) : (
        <>
          {(search || typeFilter !== 'all' || platformFilter) && (
            <p className="text-xs text-gray-400 mb-3 font-medium">{displayed.length} résultat{displayed.length > 1 ? 's' : ''}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayed.map((item) => (
              <WatchlistCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-5 sm:right-6 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        <Plus size={20} />
        <span className="hidden sm:block">Ajouter</span>
      </button>

      {showAdd && <AddWatchlistModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
