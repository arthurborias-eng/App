import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icon
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

export default function MapPicker({ position, onSelect, readOnly = false, height = '240px' }) {
  const center = position || [48.8566, 2.3522] // Paris default

  return (
    <MapContainer
      center={[center.lat ?? center[0], center.lng ?? center[1]]}
      zoom={position ? 14 : 5}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!readOnly && <ClickHandler onSelect={onSelect} />}
      {position && <Marker position={[position.lat ?? position[0], position.lng ?? position[1]]} />}
    </MapContainer>
  )
}
