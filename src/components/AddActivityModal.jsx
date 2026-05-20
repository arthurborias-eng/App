import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../context/AuthContext'
import MapPicker from './MapPicker'
import toast from 'react-hot-toast'
import { X, Upload, MapPin } from 'lucide-react'

const TYPES = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'bar', label: '🍸 Bar' },
  { value: 'activite', label: '🎯 Activité' },
  { value: 'lieu', label: '📍 Lieu' },
  { value: 'autre', label: '✨ Autre' },
]

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
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop lourde (5 MB max)'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Donne un nom à cet endroit'); return }
    if (!position) { toast.error('Clique sur la carte pour placer le lieu'); return }
    setLoading(true)
    try {
      let imageUrl = null
      if (imageFile) {
        const storageRef = ref(storage, `activities/${Date.now()}_${imageFile.name}`)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }
      await addDoc(collection(db, 'activities'), {
        name: name.trim(),
        type,
        description: description.trim(),
        position,
        imageUrl,
        addedBy: user.displayName || user.email,
        addedByUid: user.uid,
        done: false,
        createdAt: serverTimestamp(),
      })
      toast.success('Activité ajoutée !')
      onClose()
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Ajouter un endroit</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Le Comptoir du Relais"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    type === t.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Quelques mots pour décrire cet endroit…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <MapPin size={14} />
              Localisation * — clique sur la carte
            </label>
            <MapPicker position={position} onSelect={setPosition} height="220px" />
            {position && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors overflow-hidden relative">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload size={24} />
                  <span className="text-sm">Clique pour ajouter une photo</span>
                  <span className="text-xs">PNG, JPG • 5 MB max</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold transition-colors"
            >
              {loading ? 'Envoi…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
