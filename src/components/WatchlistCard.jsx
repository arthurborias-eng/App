import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'
import toast from 'react-hot-toast'
import { X, Film, Tv, MessageSquare, CheckCircle, Trash2, Pencil } from 'lucide-react'

const PLATFORM_COLORS = {
  'Netflix':      'bg-red-100 text-red-600',
  'Disney+':      'bg-blue-100 text-blue-600',
  'Prime Video':  'bg-cyan-100 text-cyan-600',
  'Apple TV+':    'bg-gray-100 text-gray-700',
  'Canal+':       'bg-gray-800 text-white',
  'OCS':          'bg-orange-100 text-orange-600',
  'Salto':        'bg-emerald-100 text-emerald-600',
  'Autre':        'bg-gray-100 text-gray-500',
}

function DetailModal({ item, onClose }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingRating, setEditingRating] = useState(false)

  const userRating = item.ratings?.find((r) => r.uid === user.uid)
  const [rating, setRating] = useState(userRating?.value || 0)
  const [comment, setComment] = useState(userRating?.comment || '')

  const isOwner = item.added_by_uid === user.uid
  const avgRating = item.ratings?.length
    ? (item.ratings.reduce((s, r) => s + r.value, 0) / item.ratings.length).toFixed(1)
    : null

  const handleMarkDone = async () => {
    try {
      const { error } = await supabase.from('watchlist').update({ done: true }).eq('id', item.id)
      if (error) throw error
      toast.success('🎉 Marqué comme vu !')
      onClose()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('watchlist').delete().eq('id', item.id)
      if (error) throw error
      toast.success('Supprimé')
      onClose()
    } catch { toast.error('Erreur') }
  }

  const handleRate = async (e) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Choisis une note'); return }
    setSubmitting(true)
    try {
      const updated = { uid: user.uid, name: user.displayName, value: rating, comment: comment.trim(), createdAt: new Date().toISOString() }
      const newRatings = userRating
        ? (item.ratings || []).map((r) => r.uid === user.uid ? updated : r)
        : [...(item.ratings || []), updated]
      const { error } = await supabase.from('watchlist').update({ ratings: newRatings }).eq('id', item.id)
      if (error) throw error
      toast.success(userRating ? 'Avis modifié !' : 'Avis envoyé !')
      onClose()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDeleteRating = async () => {
    try {
      const newRatings = (item.ratings || []).filter((r) => r.uid !== user.uid)
      const { error } = await supabase.from('watchlist').update({ ratings: newRatings }).eq('id', item.id)
      if (error) throw error
      toast.success('Avis supprimé')
      onClose()
    } catch (err) { toast.error(err.message) }
  }

  const isMovie = item.type === 'film'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center sm:p-4 sm:overflow-y-auto">
      <div className="bg-white flex flex-col w-full h-full sm:h-auto sm:rounded-3xl sm:shadow-2xl sm:max-w-lg sm:max-h-[90vh] sm:my-4 overflow-hidden">
        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900 truncate pr-4">{item.name}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0"><X size={18} /></button>
        </div>

        {/* Poster */}
        <div className="relative">
          {item.poster_url ? (
            <img src={item.poster_url} alt={item.name} className="w-full h-64 object-cover object-top" />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              {isMovie ? <Film size={48} className="text-white/50" /> : <Tv size={48} className="text-white/50" />}
            </div>
          )}
          <button onClick={onClose} className="hidden sm:flex absolute top-3 right-3 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm">
            <X size={18} />
          </button>
          {item.done && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              <CheckCircle size={12} /> Vu !
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Title + meta */}
            <div>
              <div className="flex items-start gap-2 mb-2">
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight flex-1">{item.name}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${isMovie ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-100 text-violet-600'}`}>
                  {isMovie ? '🎬 Film' : '📺 Série'}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {item.year && <span className="text-sm text-gray-400 font-medium">{item.year}</span>}
                {item.platform && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLATFORM_COLORS[item.platform] || 'bg-gray-100 text-gray-500'}`}>
                    {item.platform}
                  </span>
                )}
                {avgRating && (
                  <span className="text-sm font-semibold text-amber-600">⭐ {avgRating}/5</span>
                )}
              </div>
            </div>

            {item.overview && (
              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-2xl px-4 py-3">{item.overview}</p>
            )}

            {/* Mark as seen */}
            {!item.done && (
              <button
                onClick={handleMarkDone}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-md transition-all hover:scale-[1.02]"
              >
                <CheckCircle size={18} />
                On l'a vu ! 🎉
              </button>
            )}

            {/* Ratings section */}
            {item.done && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                {item.ratings?.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare size={15} className="text-violet-500" />
                      Avis
                    </h3>
                    {item.ratings.map((r, i) => {
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

                {!userRating && !editingRating && (
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
                    <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-60 text-white font-bold rounded-xl shadow">
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
                      <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-60 text-white font-bold rounded-xl shadow">
                        {submitting ? 'Envoi…' : 'Mettre à jour'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Delete */}
            {isOwner && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors border border-dashed border-red-200 hover:border-red-300"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
            {isOwner && confirmDelete && (
              <div className="bg-red-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700 text-center">Supprimer définitivement ?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Annuler</button>
                  <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold">Supprimer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WatchlistCard({ item }) {
  const [open, setOpen] = useState(false)
  const isMovie = item.type === 'film'
  const avgRating = item.ratings?.length
    ? (item.ratings.reduce((s, r) => s + r.value, 0) / item.ratings.length).toFixed(1)
    : null

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
      >
        {item.poster_url ? (
          <div className="relative overflow-hidden h-52">
            <img src={item.poster_url} alt={item.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
            {item.done && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <CheckCircle size={10} /> Vu
              </div>
            )}
            <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${isMovie ? 'bg-indigo-600 text-white' : 'bg-violet-600 text-white'}`}>
              {isMovie ? 'Film' : 'Série'}
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center relative">
            {isMovie ? <Film size={36} className="text-indigo-300" /> : <Tv size={36} className="text-violet-300" />}
            {item.done && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <CheckCircle size={10} /> Vu
              </div>
            )}
          </div>
        )}

        <div className="p-3.5">
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2">{item.name}</h3>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.year && <span className="text-xs text-gray-400">{item.year}</span>}
              {item.platform && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLATFORM_COLORS[item.platform] || 'bg-gray-100 text-gray-500'}`}>
                  {item.platform}
                </span>
              )}
            </div>
            {avgRating && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">⭐ {avgRating}</span>
            )}
          </div>
        </div>
      </div>
      {open && <DetailModal item={item} onClose={() => setOpen(false)} />}
    </>
  )
}
