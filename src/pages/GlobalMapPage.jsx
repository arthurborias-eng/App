import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import StarRating from '../components/StarRating'
import { CheckCircle } from 'lucide-react'

const TYPE_CONFIG = {
  restaurant: { emoji: '🍽️', color: '#f97316', label: 'Resto' },
  bar:        { emoji: '🍸', color: '#a855f7', label: 'Bar' },
  activite:   { emoji: '🎯', color: '#3b82f6', label: 'Activité' },
  lieu:       { emoji: '📍', color: '#10b981', label: 'Lieu' },
  autre:      { emoji: '✨', color: '#6b7280', label: 'Autre' },
}

function makeIcon(type, done) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.autre
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
      <path d="M22 2C13.16 2 6 9.16 6 18c0 12 16 32 16 32s16-20 16-32C38 9.16 30.84 2 22 2z"
            fill="${cfg.color}" filter="url(#sh)" opacity="${done ? 1 : 0.45}"/>
      <circle cx="22" cy="18" r="10" fill="white" opacity="${done ? 1 : 0.85}"/>
      <text x="22" y="23" text-anchor="middle" font-size="13">${cfg.emoji}</text>
    </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [44, 52], iconAnchor: [22, 52], popupAnchor: [0, -54] })
}

export default function GlobalMapPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('activities').select('*')
      if (!error) setActivities(data || [])
      setLoading(false)
    }
    fetch()
    const ch = supabase
      .channel('global-map-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetch)
      .subscribe()
    return () => ch.unsubscribe()
  }, [])

  const valid = activities.filter((a) =>
    a.position?.lat && a.position?.lng &&
    (filter === 'all' || a.type === filter)
  )

  const done = valid.filter((a) => a.done)
  const todo = valid.filter((a) => !a.done)

  const avgRating = (a) => a.ratings?.length
    ? (a.ratings.reduce((s, r) => s + r.value, 0) / a.ratings.length).toFixed(1)
    : null

  const bounds = valid.length > 0
    ? valid.map((a) => [a.position.lat, a.position.lng])
    : [[48.8566, 2.3522]]

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-6">
      {/* Type filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[['all', '🗺️', 'Tous'], ...Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.emoji, v.label])].map(([key, emoji, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              filter === key
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 font-medium px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-violet-500 opacity-100 inline-block" />
          {done.length} fait{done.length > 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400 opacity-50 inline-block" />
          {todo.length} à explorer
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : valid.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-gray-600 text-xl font-bold mb-1">Aucun spot sur la carte</p>
          <p className="text-gray-400 text-sm">Ajoute des endroits avec une localisation pour les voir ici</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200" style={{ height: '65vh', minHeight: '400px' }}>
          <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [50, 50] }}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {valid.map((a) => (
              <Marker
                key={a.id}
                position={[a.position.lat, a.position.lng]}
                icon={makeIcon(a.type, a.done)}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[190px]">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.name} className="w-full h-28 object-cover rounded-xl mb-2" />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm leading-tight">{a.name}</span>
                      {a.done && (
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          <CheckCircle size={10} /> Fait
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">par {a.added_by}</div>
                    {avgRating(a) && (
                      <div className="flex items-center gap-1">
                        <StarRating value={parseFloat(avgRating(a))} readonly size={11} />
                        <span className="text-xs text-amber-600 font-bold">{avgRating(a)}</span>
                      </div>
                    )}
                    {a.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
