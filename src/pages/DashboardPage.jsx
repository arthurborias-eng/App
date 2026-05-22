import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { MapPin, UtensilsCrossed, CheckCircle2, CalendarDays, ChevronRight } from 'lucide-react'

const TYPE_EMOJI = { restaurant: '🍽️', bar: '🍸', activite: '🎯', lieu: '📍', autre: '✨' }

const formatDate = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

export default function DashboardPage({ navigate }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: acts }, { data: recs }] = await Promise.all([
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
        supabase.from('recipes').select('*').order('created_at', { ascending: false }),
      ])
      setActivities(acts || [])
      setRecipes(recs || [])
      setLoading(false)
    }
    fetchAll()

    const ch = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, fetchAll)
      .subscribe()
    return () => ch.unsubscribe()
  }, [])

  const done   = activities.filter((a) => a.done)
  const todo   = activities.filter((a) => !a.done)
  const today  = new Date().toISOString().split('T')[0]

  const upcoming = activities
    .filter((a) => a.planned_date && a.planned_date >= today && !a.done)
    .sort((a, b) => a.planned_date.localeCompare(b.planned_date))
    .slice(0, 4)

  const recentSpots   = activities.slice(0, 4)
  const recentRecipes = recipes.slice(0, 3)

  const hour = new Date().getHours()
  const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir'

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {greeting}, {user.displayName || 'toi'}
        </h1>
        <p className="text-gray-400 text-sm mt-0.5 capitalize">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate('spots', { tab: 'done' })}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-3xl font-extrabold text-emerald-500">{done.length}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">spots faits</div>
        </button>
        <button
          onClick={() => navigate('spots')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-3xl font-extrabold text-violet-600">{todo.length}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">à explorer</div>
        </button>
        <button
          onClick={() => navigate('recettes')}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
        >
          <div className="text-3xl font-extrabold text-rose-500">{recipes.length}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">recettes</div>
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-500" />
              À venir
            </h2>
            <button
              onClick={() => navigate('planning')}
              className="flex items-center gap-1 text-xs text-amber-500 font-semibold hover:text-amber-700"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="bg-amber-50 rounded-xl px-3 py-1.5 text-center flex-shrink-0">
                  <div className="text-xs font-bold text-amber-600">{formatDate(a.planned_date)}</div>
                </div>
                <span className="text-lg">{TYPE_EMOJI[a.type] || '✨'}</span>
                <span className="font-semibold text-gray-900 text-sm truncate">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent spots */}
      {recentSpots.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-violet-500" />
              Spots ajoutés récemment
            </h2>
            <button
              onClick={() => navigate('spots')}
              className="flex items-center gap-1 text-xs text-violet-500 font-semibold hover:text-violet-700"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {recentSpots.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                {a.image_url ? (
                  <img src={a.image_url} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt={a.name} />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_EMOJI[a.type] || '✨'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.added_by}</div>
                </div>
                {a.done
                  ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                  : a.planned_date
                    ? <span className="text-xs text-violet-500 font-semibold flex-shrink-0">{formatDate(a.planned_date)}</span>
                    : null
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent recipes */}
      {recentRecipes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed size={16} className="text-rose-500" />
              Recettes ajoutées récemment
            </h2>
            <button
              onClick={() => navigate('recettes')}
              className="flex items-center gap-1 text-xs text-rose-500 font-semibold hover:text-rose-700"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {recentRecipes.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                {r.image_url ? (
                  <img src={r.image_url} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt={r.name} />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-xl font-extrabold text-rose-300 flex-shrink-0">
                    {r.name[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{r.name}</div>
                  <div className="text-xs text-gray-400">{r.added_by}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activities.length === 0 && recipes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-600 font-bold text-lg">Tout commence ici !</p>
          <p className="text-gray-400 text-sm mt-1">Ajoute vos premiers spots et recettes</p>
        </div>
      )}
    </div>
  )
}
