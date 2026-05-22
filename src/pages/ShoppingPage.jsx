import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Check, X, ShoppingCart, Trash2 } from 'lucide-react'

export default function ShoppingPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    const ch = supabase
      .channel('shopping-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, fetchItems)
      .subscribe()
    return () => ch.unsubscribe()
  }, [])

  const addItem = async (text) => {
    const val = text.trim()
    if (!val) return
    const { error } = await supabase.from('shopping_list').insert({
      text: val,
      checked: false,
      added_by: user.displayName,
      added_by_uid: user.uid,
    })
    if (error) toast.error('Erreur')
    setInput('')
  }

  const toggleItem = async (item) => {
    await supabase.from('shopping_list').update({ checked: !item.checked }).eq('id', item.id)
  }

  const deleteItem = async (id) => {
    await supabase.from('shopping_list').delete().eq('id', id)
  }

  const clearChecked = async () => {
    const ids = items.filter((i) => i.checked).map((i) => i.id)
    if (!ids.length) return
    const { error } = await supabase.from('shopping_list').delete().in('id', ids)
    if (!error) toast.success(`${ids.length} article${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''}`)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(input) }
  }

  const unchecked = items.filter((i) => !i.checked)
  const checked   = items.filter((i) =>  i.checked)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
      {/* Add input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ajouter un article…"
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-emerald-400 text-gray-900 text-sm shadow-sm"
        />
        <button
          onClick={() => addItem(input)}
          disabled={!input.trim()}
          className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-600 text-xl font-bold mb-1">Liste vide</p>
          <p className="text-gray-400 text-sm">Ajoute des articles ou importe les ingrédients d'une recette</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Unchecked items */}
          {unchecked.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 transition-all"
            >
              <button
                onClick={() => toggleItem(item)}
                className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
              />
              <span className="flex-1 text-gray-900 text-sm font-medium">{item.text}</span>
              <span className="text-xs text-gray-300">{item.added_by}</span>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Checked items section */}
          {checked.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-4 pb-1 px-1">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Dans le panier · {checked.length}
                </p>
                <button
                  onClick={clearChecked}
                  className="flex items-center gap-1 text-xs text-red-400 font-semibold hover:text-red-600 transition-colors"
                >
                  <Trash2 size={12} />
                  Tout supprimer
                </button>
              </div>
              {checked.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border border-gray-100"
                >
                  <button
                    onClick={() => toggleItem(item)}
                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 hover:bg-emerald-400 transition-colors"
                  >
                    <Check size={12} className="text-white" />
                  </button>
                  <span className="flex-1 text-gray-400 text-sm line-through">{item.text}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
