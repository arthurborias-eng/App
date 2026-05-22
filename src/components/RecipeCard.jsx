import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'
import AddRecipeModal from './AddRecipeModal'
import toast from 'react-hot-toast'
import { User, X, MessageSquare, Trash2, Pencil, ShoppingCart } from 'lucide-react'

function RecipeDetailModal({ recipe, onClose }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingRating, setEditingRating] = useState(false)

  const userRating = recipe.ratings?.find((r) => r.uid === user.uid)

  const [rating, setRating] = useState(userRating?.value || 0)
  const [comment, setComment] = useState(userRating?.comment || '')
  const isOwner = recipe.added_by_uid === user.uid
  const avgRating = recipe.ratings?.length
    ? (recipe.ratings.reduce((s, r) => s + r.value, 0) / recipe.ratings.length).toFixed(1)
    : null

  const formatIngredient = (ing) => {
    if (typeof ing === 'string') return ing
    if (!ing.quantity) return ing.name
    if (ing.unit === 'pcs') return `${ing.quantity} × ${ing.name}`
    return `${ing.quantity} ${ing.unit} ${ing.name}`
  }

  const handleAddToShopping = async () => {
    if (!recipe.ingredients?.length) { toast.error('Aucun ingrédient à ajouter'); return }

    // Récupère les articles non-cochés pour fusionner
    const { data: existing } = await supabase.from('shopping_list').select('*').eq('checked', false)

    const updates = []
    const inserts = []

    for (const ing of recipe.ingredients) {
      const ingName = typeof ing === 'string' ? ing : ing.name
      const qty     = typeof ing === 'string' ? null : ing.quantity
      const unit    = typeof ing === 'string' ? null : ing.unit
      const key     = ingName.toLowerCase().trim()

      // Cherche un article existant avec le même ingrédient ET la même unité
      const match = qty !== null
        ? (existing || []).find((e) => e.ingredient_name === key && e.unit === unit && e.quantity !== null)
        : null

      if (match) {
        const newQty  = match.quantity + qty
        const newText = unit === 'pcs' ? `${newQty} × ${ingName}` : `${newQty} ${unit} ${ingName}`
        updates.push({ id: match.id, quantity: newQty, text: newText })
      } else {
        inserts.push({
          text: formatIngredient(ing),
          ingredient_name: key,
          quantity: qty,
          unit,
          checked: false,
          added_by: user.displayName,
          added_by_uid: user.uid,
        })
      }
    }

    const results = await Promise.all([
      ...updates.map((u) => supabase.from('shopping_list').update({ quantity: u.quantity, text: u.text }).eq('id', u.id)),
      ...(inserts.length ? [supabase.from('shopping_list').insert(inserts)] : []),
    ])

    if (results.some((r) => r.error)) {
      toast.error('Erreur lors de l\'ajout')
    } else {
      const msg = updates.length > 0
        ? `${inserts.length} ajouté${inserts.length > 1 ? 's' : ''}, ${updates.length} cumulé${updates.length > 1 ? 's' : ''} 🛒`
        : `${inserts.length} ingrédient${inserts.length > 1 ? 's' : ''} ajouté${inserts.length > 1 ? 's' : ''} à la liste 🛒`
      toast.success(msg)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipe.id)
      if (error) throw error
      toast.success('Recette supprimée')
      onClose()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const handleDeleteRating = async () => {
    try {
      const newRatings = (recipe.ratings || []).filter((r) => r.uid !== user.uid)
      const { error } = await supabase.from('recipes').update({ ratings: newRatings }).eq('id', recipe.id)
      if (error) throw error
      toast.success('Avis supprimé')
      onClose()
    } catch (err) { toast.error(err.message) }
  }

  const handleRate = async (e) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Choisis une note'); return }
    setSubmitting(true)
    try {
      const updated = { uid: user.uid, name: user.displayName, value: rating, comment: comment.trim(), createdAt: new Date().toISOString() }
      const newRatings = userRating
        ? (recipe.ratings || []).map((r) => r.uid === user.uid ? updated : r)
        : [...(recipe.ratings || []), updated]
      const { error } = await supabase.from('recipes').update({ ratings: newRatings }).eq('id', recipe.id)
      if (error) throw error
      toast.success(userRating ? 'Avis modifié !' : 'Avis envoyé !')
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  if (editing) {
    return <AddRecipeModal existing={recipe} onClose={() => { setEditing(false); onClose() }} />
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 sm:overflow-y-auto">
      <div className="bg-white flex flex-col w-full h-full sm:h-auto sm:rounded-3xl sm:shadow-2xl sm:max-w-lg sm:max-h-[90vh] sm:my-4 overflow-hidden">
        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 truncate pr-4">{recipe.name}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Image */}
        <div className="relative">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.name} className="w-full h-52 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
              <span className="text-white text-4xl font-bold opacity-40">
                {recipe.name[0].toUpperCase()}
              </span>
            </div>
          )}
          <button onClick={onClose} className="hidden sm:flex absolute top-3 right-3 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Title + meta */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">{recipe.name}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <User size={13} />
                  <span>{recipe.added_by}</span>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    ⭐ {avgRating}/5
                    <span className="text-gray-400 font-normal text-xs">({recipe.ratings.length} avis)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {recipe.ingredients?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-700">Ingrédients</h3>
                  <button
                    onClick={handleAddToShopping}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <ShoppingCart size={12} />
                    Ajouter à la liste
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ing, i) => (
                    <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
                      {formatIngredient(ing)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {recipe.description && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">Préparation</h3>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-2xl px-4 py-3 whitespace-pre-wrap">{recipe.description}</p>
              </div>
            )}

            {/* Ratings */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              {recipe.ratings?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={15} className="text-rose-500" />
                    Avis
                  </h3>
                  {recipe.ratings.map((r, i) => {
                    const isOwnerRating = r.uid === user.uid
                    return (
                      <div key={i} className="bg-gray-50 rounded-2xl p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">{r.name}</span>
                          <div className="flex items-center gap-2">
                            <StarRating value={r.value} readonly size={14} />
                            {isOwnerRating && (
                              <>
                                <button
                                  onClick={() => { setRating(r.value); setComment(r.comment || ''); setEditingRating(true) }}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={handleDeleteRating}
                                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-gray-500">{r.comment}</p>}
                      </div>
                    )
                  })}
                </div>
              )}

              {!userRating && (
                <form onSubmit={handleRate} className="space-y-3 bg-rose-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900">Ton avis</h3>
                  <StarRating value={rating} onChange={setRating} size={30} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Ton commentaire (optionnel)…"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-rose-100 focus:outline-none focus:border-rose-400 text-gray-900 resize-none text-sm bg-white"
                  />
                  <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 disabled:opacity-60 text-white font-bold rounded-xl shadow transition-all">
                    {submitting ? 'Envoi…' : 'Envoyer mon avis ⭐'}
                  </button>
                </form>
              )}
              {editingRating && (
                <form onSubmit={handleRate} className="space-y-3 bg-rose-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900">Modifier ton avis</h3>
                  <StarRating value={rating} onChange={setRating} size={30} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Ton commentaire (optionnel)…"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-rose-100 focus:outline-none focus:border-rose-400 text-gray-900 resize-none text-sm bg-white"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingRating(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">Annuler</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 disabled:opacity-60 text-white font-bold rounded-xl shadow transition-all">
                      {submitting ? 'Envoi…' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Edit / Delete */}
            {isOwner && !confirmDelete && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-2xl transition-colors border border-dashed border-violet-200 hover:border-violet-300"
                >
                  <Pencil size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors border border-dashed border-red-200 hover:border-red-300"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            )}
            {isOwner && confirmDelete && (
              <div className="bg-red-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700 text-center">Supprimer définitivement ?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecipeCard({ recipe }) {
  const [open, setOpen] = useState(false)
  const avgRating = recipe.ratings?.length
    ? (recipe.ratings.reduce((s, r) => s + r.value, 0) / recipe.ratings.length).toFixed(1)
    : null

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
      >
        {recipe.image_url ? (
          <div className="relative overflow-hidden h-44">
            <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="w-full h-24 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
            <span className="text-3xl font-extrabold text-rose-300">{recipe.name[0].toUpperCase()}</span>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">{recipe.name}</h3>

          {/* Ingredients preview */}
          {recipe.ingredients?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recipe.ingredients.slice(0, 3).map((ing, i) => (
                <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs font-medium rounded-full border border-rose-100">
                  {typeof ing === 'string' ? ing : ing.name}
                </span>
              ))}
              {recipe.ingredients.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-xs font-medium rounded-full border border-gray-100">
                  +{recipe.ingredients.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                {recipe.added_by[0].toUpperCase()}
              </div>
              <span>{recipe.added_by}</span>
            </div>
            {avgRating && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⭐ {avgRating}</span>
            )}
          </div>
        </div>
      </div>
      {open && <RecipeDetailModal recipe={recipe} onClose={() => setOpen(false)} />}
      {/* editing state is inside the modal, handled via AddRecipeModal rendered from there */}
    </>
  )
}
