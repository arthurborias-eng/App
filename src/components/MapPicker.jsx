import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Search, Loader } from 'lucide-react'

const violetIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <filter id="vsh"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="rgba(0,0,0,0.22)"/></filter>
    <path d="M14 1C8.48 1 4 5.48 4 11c0 8.5 10 24 10 24s10-15.5 10-24C24 5.48 19.52 1 14 1z"
      fill="#7c3aed" filter="url(#vsh)"/>
    <circle cx="14" cy="11" r="5" fill="white" opacity="0.92"/>
  </svg>`,
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
})

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FlyTo({ position }) {
  const map = useMap()
  if (position) map.flyTo([position.lat, position.lng], 15, { duration: 1 })
  return null
}

export default function MapPicker({ position, onSelect, readOnly = false, height = '240px' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const debounceRef = useRef(null)

  const center = position || { lat: 48.8566, lng: 2.3522 }

  const handleSearch = async (value) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (value.length < 3) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        const data = await res.json()
        setResults(data)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
  }

  const handleSelect = (result) => {
    const pos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    onSelect(pos)
    setFlyTarget(pos)
    setQuery(result.display_name.split(',').slice(0, 2).join(', '))
    setResults([])
  }

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500">
            {searching ? <Loader size={16} className="text-gray-400 animate-spin flex-shrink-0" /> : <Search size={16} className="text-gray-400 flex-shrink-0" />}
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher une adresse…"
              className="flex-1 text-base text-gray-900 outline-none bg-transparent"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-[1000] overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-3.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 border-b border-gray-50 last:border-0 transition-colors active:bg-violet-100"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={position ? 14 : 5}
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
          {!readOnly && <ClickHandler onSelect={onSelect} />}
          {flyTarget && <FlyTo position={flyTarget} />}
          {position && <Marker position={[position.lat, position.lng]} icon={violetIcon} />}
        </MapContainer>
      </div>

      <style>{`
        .leaflet-control-zoom { border: 1px solid #e5e7eb !important; border-radius: 10px !important; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08) !important; }
        .leaflet-control-zoom a { color: #6d28d9 !important; border-color: #e5e7eb !important; font-weight: 600; }
        .leaflet-control-zoom a:hover { background: #f5f3ff !important; color: #4c1d95 !important; }
        .leaflet-control-attribution { font-size: 9px !important; background: rgba(255,255,255,.75) !important; }
      `}</style>

      {!readOnly && !position && (
        <p className="text-xs text-gray-400 text-center">Recherche une adresse ou clique directement sur la carte</p>
      )}
    </div>
  )
}
