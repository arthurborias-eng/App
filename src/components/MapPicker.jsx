import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Search, Loader } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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
              className="flex-1 text-sm text-gray-900 outline-none bg-transparent"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-[1000] overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 border-b border-gray-50 last:border-0 transition-colors"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={position ? 14 : 5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly && <ClickHandler onSelect={onSelect} />}
          {flyTarget && <FlyTo position={flyTarget} />}
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>
      {!readOnly && !position && (
        <p className="text-xs text-gray-400 text-center">Recherche une adresse ou clique directement sur la carte</p>
      )}
    </div>
  )
}
