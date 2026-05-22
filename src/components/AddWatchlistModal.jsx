import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { X, Search, Tv, Film, Loader2 } from 'lucide-react'

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY || 'ea03a30512bd3b271620d780ab2f053e'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w200'

const PLATFORMS = ['Netflix', 'Disney+', 'Prime Video', 'Apple TV+', 'Canal+', 'OCS', 'Salto', 'Autre']

export default function AddWatchlistModal({ onClose }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [platform, setPlatform] = useState('')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=fr-FR&page=1`
        )
        const data = await res.json()
        const filtered = (data.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 6)
        setResults(filtered)
      } catch { toast.error('Erreur de recherche') }
      finally { setSearching(false) }
    }, 400)
  }, [query])

  const handleSelect = (item) => {
    setSelected(item)
    setQuery(item.title || item.name)
    setResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) { toast.error('Sélectionne un film ou une série'); return }
    setLoading(true)
    try {
      const isMovie = selected.media_type === 'movie'
      const { error } = await supabase.from('watchlist').insert({
        name: selected.title || selected.name,
        type: isMovie ? 'film' : 'serie',
        platform: platform || null,
        overview: selected.overview || null,
        poster_url: selected.poster_path ? TMDB_IMG + selected.poster_path : null,
        tmdb_id: selected.id,
        year: parseInt((selected.release_date || selected.first_air_date || '').slice(0, 4)) || null,
        done: false,
        ratings: [],
        added_by: user.displayName,
        added_by_uid: user.uid,
      })
      if (error) throw error
      toast.success('Ajouté à la watchlist !')
      onClose()
    } catch (err) { toast.error('Erreur : ' + err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white flex flex-col w-full h-full sm:h-auto sm:rounded-3xl sm:max-w-lg sm:shadow-2xl sm:max-h-[90vh]">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Ajouter un film / série</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-5 space-y-5 pb-8">

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rechercher</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 animate-spin" />}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
                  placeholder="Ex: Inception, Breaking Bad…"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-violet-400 text-gray-900 bg-gray-50 text-base"
                  autoFocus
                />
              </div>

              {/* Results dropdown */}
              {results.length > 0 && (
                <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                  {results.map((item) => {
                    const isMovie = item.media_type === 'movie'
                    const title = item.title || item.name
                    const year = (item.release_date || item.first_air_date || '').slice(0, 4)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        {item.poster_path ? (
                          <img src={TMDB_IMG + item.poster_path} alt={title} className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {isMovie ? <Film size={18} className="text-gray-400" /> : <Tv size={18} className="text-gray-400" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isMovie ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-100 text-violet-600'}`}>
                              {isMovie ? 'Film' : 'Série'}
                            </span>
                            {year && <span className="text-xs text-gray-400">{year}</span>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Selected preview */}
            {selected && (
              <div className="flex gap-4 bg-violet-50 rounded-2xl p-4">
                {selected.poster_path ? (
                  <img src={TMDB_IMG + selected.poster_path} alt="" className="w-16 h-24 rounded-xl object-cover flex-shrink-0 shadow" />
                ) : (
                  <div className="w-16 h-24 rounded-xl bg-violet-200 flex items-center justify-center flex-shrink-0">
                    {selected.media_type === 'movie' ? <Film size={24} className="text-violet-500" /> : <Tv size={24} className="text-violet-500" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-base leading-snug">{selected.title || selected.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selected.media_type === 'movie' ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-100 text-violet-600'}`}>
                      {selected.media_type === 'movie' ? 'Film' : 'Série'}
                    </span>
                    {(selected.release_date || selected.first_air_date) && (
                      <span className="text-xs text-gray-400">{(selected.release_date || selected.first_air_date).slice(0, 4)}</span>
                    )}
                  </div>
                  {selected.overview && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{selected.overview}</p>
                  )}
                </div>
              </div>
            )}

            {/* Platform */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plateforme (optionnel)</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(platform === p ? '' : p)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      platform === p
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-600 font-semibold">
                Annuler
              </button>
              <button type="submit" disabled={loading || !selected} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-50 text-white font-bold shadow-md">
                {loading ? 'Ajout…' : 'Ajouter 🎬'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
