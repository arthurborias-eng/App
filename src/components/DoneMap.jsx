import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import StarRating from './StarRating'

const TYPE_CONFIG = {
  restaurant: { emoji: '🍽️', color: '#f97316' },
  bar:        { emoji: '🍸', color: '#a855f7' },
  activite:   { emoji: '🎯', color: '#3b82f6' },
  lieu:       { emoji: '📍', color: '#10b981' },
  autre:      { emoji: '✨', color: '#6b7280' },
}

function makeIcon(type) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.autre
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
      </filter>
      <path d="M22 2C13.16 2 6 9.16 6 18c0 12 16 32 16 32s16-20 16-32C38 9.16 30.84 2 22 2z"
            fill="${cfg.color}" filter="url(#shadow)"/>
      <circle cx="22" cy="18" r="10" fill="white"/>
      <text x="22" y="23" text-anchor="middle" font-size="13">${cfg.emoji}</text>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -54],
  })
}

export default function DoneMap({ activities }) {
  const [selected, setSelected] = useState(null)

  const valid = activities.filter((a) => a.position?.lat && a.position?.lng)
  if (valid.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-3">🗺️</div>
        <p className="text-gray-500 font-semibold">Aucun lieu à afficher</p>
        <p className="text-gray-400 text-sm mt-1">Marque des activités comme faites pour les voir ici</p>
      </div>
    )
  }

  const bounds = valid.map((a) => [a.position.lat, a.position.lng])
  const avgRating = (a) => a.ratings?.length
    ? (a.ratings.reduce((s, r) => s + r.value, 0) / a.ratings.length).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
            <span>{cfg.emoji}</span>
            <span style={{ color: cfg.color }} className="font-semibold capitalize">
              {{ restaurant: 'Resto', bar: 'Bar', activite: 'Activité', lieu: 'Lieu', autre: 'Autre' }[type]}
            </span>
          </span>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200" style={{ height: '420px' }}>
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [40, 40] }}
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
              icon={makeIcon(a.type)}
              eventHandlers={{ click: () => setSelected(a) }}
            >
              <Popup className="custom-popup">
                <div className="min-w-[180px]">
                  {a.imageUrl && (
                    <img src={a.imageUrl} alt={a.name} className="w-full h-28 object-cover rounded-xl mb-2" />
                  )}
                  <div className="font-bold text-gray-900 text-sm mb-1">{a.name}</div>
                  <div className="text-xs text-gray-500 mb-1">par {a.addedBy}</div>
                  {avgRating(a) && (
                    <div className="flex items-center gap-1">
                      <StarRating value={Math.round(parseFloat(avgRating(a)))} readonly size={12} />
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

      {/* Count */}
      <p className="text-center text-sm text-gray-400">
        {valid.length} endroit{valid.length > 1 ? 's' : ''} sur la carte
      </p>
    </div>
  )
}
