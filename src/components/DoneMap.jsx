import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import StarRating from './StarRating'

const TYPE_CONFIG = {
  restaurant: { emoji: '🍽️', color: '#f97316' },
  bar:        { emoji: '🍸', color: '#a855f7' },
  activite:   { emoji: '🎯', color: '#6366f1' },
  lieu:       { emoji: '📍', color: '#10b981' },
  autre:      { emoji: '✨', color: '#94a3b8' },
}

function makeIcon(type) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.autre
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="ds" x="-30%" y="-20%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.22)"/>
      </filter>
      <path d="M18 2C10.27 2 4 8.27 4 16c0 10.5 14 28 14 28s14-17.5 14-28C32 8.27 25.73 2 18 2z"
            fill="${cfg.color}" filter="url(#ds)"/>
      <circle cx="18" cy="16" r="8" fill="white" opacity="0.95"/>
      <text x="18" y="21" text-anchor="middle" font-size="11">${cfg.emoji}</text>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  })
}

export default function DoneMap({ activities }) {
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
              {{ restaurant: 'Resto', bar: 'Bar', activite: 'Activité', lieu: 'Visites', autre: 'Autre' }[type]}
            </span>
          </span>
        ))}
      </div>

      {/* Map */}
      <div className="isolate rounded-3xl overflow-hidden shadow-lg border border-gray-100" style={{ height: '420px' }}>
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [40, 40] }}
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
              icon={makeIcon(a.type)}
            >
              <Popup className="duo-popup">
                <div style={{ minWidth: 170, fontFamily: 'system-ui, sans-serif', padding: '2px 0' }}>
                  {a.image_url && (
                    <img src={a.image_url} alt={a.name}
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
                  )}
                  <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14, marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>par {a.added_by}</div>
                  {avgRating(a) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StarRating value={Math.round(parseFloat(avgRating(a)))} readonly size={12} />
                      <span style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>{avgRating(a)}</span>
                    </div>
                  )}
                  {a.description && (
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, overflow: 'hidden',
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

      <style>{`
        .duo-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(109,40,217,.12), 0 2px 8px rgba(0,0,0,.08);
          border: 1px solid #ede9fe;
          padding: 0;
        }
        .duo-popup .leaflet-popup-content { margin: 12px 14px; }
        .duo-popup .leaflet-popup-tip { background: white; }
        .leaflet-control-zoom { border: 1px solid #ede9fe !important; border-radius: 10px !important; overflow: hidden; box-shadow: 0 1px 4px rgba(109,40,217,.10) !important; }
        .leaflet-control-zoom a { color: #7c3aed !important; border-color: #ede9fe !important; font-weight: 600; }
        .leaflet-control-zoom a:hover { background: #f5f3ff !important; color: #4c1d95 !important; }
        .leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,.75) !important; }
      `}</style>

      {/* Count */}
      <p className="text-center text-sm text-gray-400">
        {valid.length} endroit{valid.length > 1 ? 's' : ''} sur la carte
      </p>
    </div>
  )
}
