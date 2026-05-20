import { useState } from 'react'
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import MapPicker from './MapPicker'
import StarRating from './StarRating'
import toast from 'react-hot-toast'
import { MapPin, User, CheckCircle, X, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

const TYPE_COLORS = {
  restaurant: 'bg-orange-100 text-orange-700',
  bar: 'bg-purple-100 text-purple-700',
  activite: 'bg-blue-100 text-blue-700',
  lieu: 'bg-green-100 text-green-700',
  autre: 'bg-gray-100 text-gray-700',
}

const TYPE_LABELS = {
  restaurant: '🍽️ Restaurant',
  bar: '🍸 Bar',
  activite: '🎯 Activité',
  lieu: '📍 Lieu',
  autre: '✨ Autre',
}

function DetailModal({ activity, onClose }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const userRating = activity.ratings?.find((r) => r.uid === user.uid)
  const avgRating =
    activity.ratings?.length
      ? (activity.ratings.reduce((s, r) => s + r.value, 0) / activity.ratings.length).toFixed(1)
      : null

  const handleMarkDone = async () => {
    try {
      await updateDoc(doc(db, 'activities', activity.id), { done: true })
      toast.success('Activité marquée comme faite !')
      onClose()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleRate = async (e) => {
    e.preventDefault()
    if (!activity.done) { toast.error("Marque l'activité comme faite d'abord"); return }
    if (rating === 0) { toast.error('Choisis une note'); return }
    if (userRating) { toast.error('Tu as déjà noté cette activité'); return }
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'activities', activity.id), {
        ratings: arrayUnion({
          uid: user.uid,
          name: user.displayName || user.email,
          value: rating,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
        }),
      })
      toast.success('Note ajoutée !')
      setRating(0)
      setComment('')
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 truncate">{activity.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activity.imageUrl && (
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="w-full h-52 object-cover rounded-xl"
            />
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[activity.type] || TYPE_COLORS.autre}`}>
              {TYPE_LABELS[activity.type] || activity.type}
            </span>
            {avgRating && (
              <span className="text-sm text-amber-600 font-semibold">⭐ {avgRating}/5 ({activity.ratings.length} avis)</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User size={14} />
            <span>Ajouté par <strong className="text-gray-700">{activity.addedBy}</strong></span>
          </div>

          {activity.description && (
            <p className="text-gray-700 text-sm leading-relaxed">{activity.description}</p>
          )}

          <button
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
          >
            <MapPin size={14} />
            {showMap ? 'Masquer la carte' : 'Voir sur la carte'}
            {showMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showMap && activity.position && (
            <MapPicker position={activity.position} readOnly height="200px" />
          )}

          {!activity.done && (
            <button
              onClick={handleMarkDone}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              <CheckCircle size={18} />
              Marquer comme fait !
            </button>
          )}

          {activity.done && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              {activity.ratings?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Avis ({activity.ratings.length})
                  </h3>
                  {activity.ratings.map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{r.name}</span>
                        <StarRating value={r.value} readonly size={14} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {!userRating && (
                <form onSubmit={handleRate} className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Laisser un avis</h3>
                  <StarRating value={rating} onChange={setRating} size={28} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Ton commentaire (optionnel)…"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 resize-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
                  >
                    {submitting ? 'Envoi…' : 'Envoyer mon avis'}
                  </button>
                </form>
              )}
              {userRating && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ✓ Tu as déjà noté cet endroit
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ActivityCard({ activity }) {
  const [open, setOpen] = useState(false)

  const avgRating = activity.ratings?.length
    ? (activity.ratings.reduce((s, r) => s + r.value, 0) / activity.ratings.length).toFixed(1)
    : null

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        {activity.imageUrl ? (
          <img src={activity.imageUrl} alt={activity.name} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-24 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl">
            {activity.type === 'restaurant' ? '🍽️' : activity.type === 'bar' ? '🍸' : activity.type === 'activite' ? '🎯' : activity.type === 'lieu' ? '📍' : '✨'}
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{activity.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${TYPE_COLORS[activity.type] || TYPE_COLORS.autre}`}>
              {TYPE_LABELS[activity.type]?.split(' ')[0]}
            </span>
          </div>
          {activity.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{activity.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{activity.addedBy}</span>
            </div>
            {avgRating && (
              <span className="text-amber-600 font-semibold">⭐ {avgRating}</span>
            )}
          </div>
        </div>
      </div>
      {open && <DetailModal activity={activity} onClose={() => setOpen(false)} />}
    </>
  )
}
