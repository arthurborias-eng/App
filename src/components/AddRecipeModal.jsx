import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { X, Upload, Plus } from 'lucide-react'

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

export default function AddRecipeModal({ onClose }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const addIngredient = () => {
    const val = ingredientInput.trim()
    if (!val) return
    if (ingredients.includes(val)) { toast.error('Ingrédient déjà ajouté'); return }
    setIngredients([...ingredients, val])
    setIngredientInput('')
  }

  const removeIngredient = (ing) => {
    setIngredients(ingredients.filter((i) => i !== ing))
  }

  const handleIngredientKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addIngredient() }
  }

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
    if (!name.trim()) { toast.error('Donne un nom à cette recette'); return }
    setLoading(true)
    try {
      const image_url = imageFile ? await uploadToImgbb(imageFile) : null
      const { error } = await supabase.from('recipes').insert({
        name: name.trim(),
        description: description.trim(),
        ingredients,
        image_url,
        added_by: user.displayName,
        added_by_uid: user.uid,
      })
      if (error) throw error
      toast.success('Recette ajoutée !')
      onClose()
    } catch (err) {
      toast.error('Erreur : ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4">
      <div className="bg-white flex flex-col w-full h-full sm:h-auto sm:rounded-3xl sm:max-w-lg sm:shadow-2xl sm:max-h-[90vh]">
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Ajouter une recette</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-5 space-y-5 pb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la recette *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tarte aux pommes de mamie"
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-rose-400 text-gray-900 bg-gray-50 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ingrédients</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={handleIngredientKey}
                  placeholder="Ex: farine, œufs, beurre…"
                  className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-rose-400 text-gray-900 bg-gray-50 text-sm"
                />
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-3 py-2.5 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-600 transition-colors flex-shrink-0"
                >
                  <Plus size={18} />
                </button>
              </div>
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span key={ing} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-medium rounded-full border border-rose-200">
                      {ing}
                      <button type="button" onClick={() => removeIngredient(ing)} className="hover:text-rose-900 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1.5">Appuie sur Entrée ou + pour ajouter</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description / Étapes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Décris les étapes de préparation…"
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-rose-400 text-gray-900 bg-gray-50 resize-none text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all overflow-hidden relative group">
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
              <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 disabled:opacity-60 text-white font-bold shadow-md">
                {loading ? 'Envoi…' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
