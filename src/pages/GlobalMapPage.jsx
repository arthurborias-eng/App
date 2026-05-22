import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import StarRating from '../components/StarRating'
import { CheckCircle } from 'lucide-react'

const TYPE_CONFIG = {
  restaurant: { emoji: '🍽️', color: '#f97316', label: 'Resto' },
  bar:        { emoji: '🍸', color: '#a855f7', label: 'Bar' },
  activite:   { emoji: '🎯', color: '#6366f1', label: 'Activité' },
  lieu:       { emoji: '📍', color: '#10b981', label: 'Visites' },
  autre:      { emoji: '✨', color: '#94a3b8', label: 'Autre' },
}

function makeIcon(type, done) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.autre
  const opacity = done ? 1 : 0.42
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="ds${type}" x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
      </filter>
      <path d="M18 2C10.27 2 4 8.27 4 16c0 10.5 14 28 14 28s14-17.5 14-28C32 8.27 25.73 2 18 2z"
            fill="${cfg.color}" filter="url(#ds${type})" opacity="${opacity}"/>
      <circle cx="18" cy="16" r="8" fill="white" opacity="${done ? 0.95 : 0.75}"/>
      <text x="18" y="21" text-anchor="middle" font-size="11" opacity="${done ? 1 : 0.6}">${cfg.emoji}</text>
    </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] })
}

export default function GlobalMapPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('activities').select('*')
      if (!error) setActivities(data || [])
      setLoading(false)
    }
    fetchData()
    const ch = supabase
      .channel('global-map-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchData)
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
                : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-200'
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 font-medium px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
          {done.length} fait{done.length > 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
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
        <div className="isolate rounded-3xl overflow-hidden shadow-lg border border-violet-100" style={{ height: '65vh', minHeight: '400px' }}>
          <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [50, 50] }}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            <ZoomControl position="bottomright" />
            {valid.map((a) => (
              <Marker
                key={a.id}
                position={[a.position.lat, a.position.lng]}
                icon={makeIcon(a.type, a.done)}
              >
                <Popup className="duo-popup">
                  <div style={{ minWidth: 185, fontFamily: 'system-ui, sans-serif', padding: '2px 0' }}>
                    {a.image_url && (
                      <img src={a.image_url} alt={a.name}
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14, lineHeight: 1.3 }}>{a.name}</span>
                      {a.done && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#ede9fe',
                          color: '#7c3aed', fontSize: 10, fontWeight: 700, padding: '2px 7px',
                          borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          ✓ Fait
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>par {a.added_by}</div>
                    {avgRating(a) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <StarRating value={parseFloat(avgRating(a))} readonly size={11} />
                        <span style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>{avgRating(a)}</span>
                      </div>
                    )}
                    {a.description && (
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 5, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {a.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <style>{`
        .duo-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(109,40,217,.13), 0 2px 8px rgba(0,0,0,.07);
          border: 1px solid #ede9fe;
          padding: 0;
        }
        .duo-popup .leaflet-popup-content { margin: 12px 14px; }
        .duo-popup .leaflet-popup-tip { background: white; }
        .leaflet-control-zoom { border: 1px solid #ede9fe !important; border-radius: 10px !important; overflow: hidden; box-shadow: 0 1px 4px rgba(109,40,217,.12) !important; }
        .leaflet-control-zoom a { color: #7c3aed !important; border-color: #ede9fe !important; font-weight: 600; }
        .leaflet-control-zoom a:hover { background: #f5f3ff !important; color: #4c1d95 !important; }
        .leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,.75) !important; }
      `}</style>
    </div>
  )
}
