import { useState, lazy, Suspense } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { X, Upload, MapPin } from 'lucide-react'

const MapPicker = lazy(() => import('./MapPicker'))

const TYPES = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'bar', label: '🍸 Bar' },
  { value: 'activite', label: '🎯 Activité' },
  { value: 'lieu', label: '📍 Lieu' },
  { value: 'autre', label: '✨ Autre' },
]

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1000
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75)
    }
    img.src = URL.createObjectURL(file)
  })
}

async function uploadToImgbb(file) {
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('image', compressed)
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!data.success) throw new Error('Échec upload image')
  return data.data.url
}

export default function AddActivityModal({ onClose }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [type, setType] = useState('restaurant')
  const [description, setDescription] = useState('')
  const [position, setPosition] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Sélectionne une image (JPG, PNG…)'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image trop lourde (10 MB max)'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Donne un nom à cet endroit'); return }
    if (!position) { toast.error('Indique la localisation'); return }
    setLoading(true)
    try {
      const image_url = imageFile ? await uploadToImgbb(imageFile) : null
      const { error } = await supabase.from('activities').insert({
        name: name.trim(),
        type,
        description: description.trim(),
        position,
        image_url,
        added_by: user.displayName,
        added_by_uid: user.uid,
        done: false,
      })
      if (error) throw error
      toast.success('Activité ajoutée !')
      onClose()
    } catch (err) {
      toast.error('Erreur : ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white flex flex-col w-full h-full sm:h-auto sm:rounded-3xl sm:max-w-lg sm:shadow-2xl sm:max-h-[90vh]">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Ajouter un endroit</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-5 space-y-5 pb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Le Comptoir du Relais"
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-violet-400 text-gray-900 bg-gray-50 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      type === t.value ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Quelques mots pour décrire cet endroit…"
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-violet-400 text-gray-900 bg-gray-50 resize-none text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-violet-500" />
                Localisation *
              </label>
              <Suspense fallback={<div className="h-48 rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm">Chargement de la carte…</div>}>
                <MapPicker position={position} onSelect={setPosition} height="220px" />
              </Suspense>
              {position
                ? <p className="text-xs text-emerald-600 mt-1.5 font-medium">✓ Position enregistrée</p>
                : <p className="text-xs text-gray-400 mt-1.5">Recherche une adresse ou clique sur la carte</p>
              }
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all overflow-hidden relative group">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Changer</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload size={22} />
                    <span className="text-sm font-medium">Ajouter une photo</span>
                    <span className="text-xs">Galerie ou appareil photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-600 font-semibold">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 disabled:opacity-60 text-white font-bold shadow-md">
                {loading ? 'Envoi…' : 'Ajouter ✨'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
