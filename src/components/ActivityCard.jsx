import { useState, lazy, Suspense } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'
import AddActivityModal from './AddActivityModal'
import toast from 'react-hot-toast'
import { MapPin, User, CheckCircle, X, MessageSquare, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react'

const MapPicker = lazy(() => import('./MapPicker'))

const TYPE_STYLES = {
  restaurant: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🍽️' },
  bar:        { bg: 'bg-purple-100', text: 'text-purple-700', emoji: '🍸' },
  activite:   { bg: 'bg-blue-100',   text: 'text-blue-700',   emoji: '🎯' },
  lieu:       { bg: 'bg-emerald-100', text: 'text-emerald-700', emoji: '📍' },
  autre:      { bg: 'bg-gray-100',   text: 'text-gray-700',   emoji: '✨' },
}

const TYPE_LABELS = {
  restaurant: 'Restaurant', bar: 'Bar', activite: 'Activité', lieu: 'Lieu', autre: 'Autre',
}

function DetailModal({ activity, onClose }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingRating, setEditingRating] = useState(false)

  const style = TYPE_STYLES[activity.type] || TYPE_STYLES.autre
  const userRating = activity.ratings?.find((r) => r.uid === user.uid)

  const [rating, setRating] = useState(userRating?.value || 0)
  const [comment, setComment] = useState(userRating?.comment || '')
  const isOwner = activity.added_by_uid === user.uid
  const avgRating = activity.ratings?.length
    ? (activity.ratings.reduce((s, r) => s + r.value, 0) / activity.ratings.length).toFixed(1)
    : null

  const handleMarkDone = async () => {
    try {
      const { error } = await supabase.from('activities').update({ done: true }).eq('id', activity.id)
      if (error) throw error
      toast.success('🎉 Activité marquée comme faite !')
      onClose()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', activity.id)
      if (error) throw error
      toast.success('Activité supprimée')
      onClose()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const handleDeleteRating = async () => {
    try {
      const newRatings = (activity.ratings || []).filter((r) => r.uid !== user.uid)
      const { error } = await supabase.from('activities').update({ ratings: newRatings }).eq('id', activity.id)
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
        ? (activity.ratings || []).map((r) => r.uid === user.uid ? updated : r)
        : [...(activity.ratings || []), updated]
      const { error } = await supabase.from('activities').update({ ratings: newRatings }).eq('id', activity.id)
      if (error) throw error
      toast.success(userRating ? 'Avis modifié !' : 'Avis envoyé !')
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  if (editing) {
    return <AddActivityModal existing={activity} onClose={() => { setEditing(false); onClose() }} />
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 sm:overflow-y-auto">
      <div className="bg-white flex flex-col w-full h-full sm:h-auto sm:rounded-3xl sm:shadow-2xl sm:max-w-lg sm:max-h-[90vh] sm:my-4 overflow-hidden">
        <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 truncate pr-4">{activity.name}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="relative">
          {activity.image_url ? (
            <img src={activity.image_url} alt={activity.name} className="w-full h-52 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-6xl">
              {style.emoji}
            </div>
          )}
          <button onClick={onClose} className="hidden sm:flex absolute top-3 right-3 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm">
            <X size={18} />
          </button>
          {activity.done && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              <CheckCircle size={12} /> Fait !
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{activity.name}</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text} flex-shrink-0`}>
                {style.emoji} {TYPE_LABELS[activity.type] || activity.type}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <User size={13} />
                <span>{activity.added_by}</span>
              </div>
              {avgRating && (
                <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  ⭐ {avgRating}/5
                  <span className="text-gray-400 font-normal text-xs">({activity.ratings.length} avis)</span>
                </div>
              )}
            </div>
          </div>

          {activity.description && (
            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-2xl px-4 py-3">{activity.description}</p>
          )}

          <button
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-2 text-sm text-violet-600 font-semibold hover:text-violet-800 transition-colors"
          >
            <MapPin size={14} />
            {showMap ? 'Masquer la carte' : 'Voir sur la carte'}
            {showMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showMap && activity.position && (
            <Suspense fallback={<div className="h-[200px] rounded-xl bg-gray-100 animate-pulse" />}>
              <MapPicker position={activity.position} readOnly height="200px" />
            </Suspense>
          )}

          {!activity.done && (
            <button
              onClick={handleMarkDone}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-md transition-all hover:scale-[1.02]"
            >
              <CheckCircle size={18} />
              On l'a fait ! 🎉
            </button>
          )}

          {activity.done && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              {activity.ratings?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={15} className="text-violet-500" />
                    Avis
                  </h3>
                  {activity.ratings.map((r, i) => {
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
                                  className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-400 hover:text-violet-600 transition-colors"
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
                <form onSubmit={handleRate} className="space-y-3 bg-violet-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900">Ton avis</h3>
                  <StarRating value={rating} onChange={setRating} size={30} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Ton commentaire (optionnel)…"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-violet-100 focus:outline-none focus:border-violet-400 text-gray-900 resize-none text-sm bg-white"
                  />
                  <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 disabled:opacity-60 text-white font-bold rounded-xl shadow transition-all">
                    {submitting ? 'Envoi…' : 'Envoyer mon avis ⭐'}
                  </button>
                </form>
              )}
              {editingRating && (
                <form onSubmit={handleRate} className="space-y-3 bg-violet-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900">Modifier ton avis</h3>
                  <StarRating value={rating} onChange={setRating} size={30} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Ton commentaire (optionnel)…"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-violet-100 focus:outline-none focus:border-violet-400 text-gray-900 resize-none text-sm bg-white"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingRating(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">Annuler</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 disabled:opacity-60 text-white font-bold rounded-xl shadow transition-all">
                      {submitting ? 'Envoi…' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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

export default function ActivityCard({ activity }) {
  const [open, setOpen] = useState(false)
  const style = TYPE_STYLES[activity.type] || TYPE_STYLES.autre
  const avgRating = activity.ratings?.length
    ? (activity.ratings.reduce((s, r) => s + r.value, 0) / activity.ratings.length).toFixed(1)
    : null

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
      >
        {activity.image_url ? (
          <div className="relative overflow-hidden h-44">
            <img src={activity.image_url} alt={activity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {activity.done && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <CheckCircle size={10} /> Fait
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-24 bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-4xl relative">
            {style.emoji}
            {activity.done && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <CheckCircle size={10} /> Fait
              </div>
            )}
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug">{activity.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${style.bg} ${style.text}`}>
              {style.emoji}
            </span>
          </div>
          {activity.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{activity.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                {activity.added_by[0].toUpperCase()}
              </div>
              <span>{activity.added_by}</span>
            </div>
            {avgRating && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⭐ {avgRating}</span>
            )}
          </div>
        </div>
      </div>
      {open && <DetailModal activity={activity} onClose={() => setOpen(false)} />}
    </>
  )
}
