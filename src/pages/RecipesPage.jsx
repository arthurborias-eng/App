import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import RecipeCard from '../components/RecipeCard'
import AddRecipeModal from '../components/AddRecipeModal'
import { Plus, Search, X } from 'lucide-react'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setRecipes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRecipes()
    const channel = supabase
      .channel('recipes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, fetchRecipes)
      .subscribe()
    return () => channel.unsubscribe()
  }, [])

  const displayed = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette…"
          className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:outline-none focus:border-rose-400 text-gray-900 text-sm shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">{search ? '🔍' : '👨‍🍳'}</div>
          <p className="text-gray-600 text-xl font-bold mb-1">
            {search ? 'Aucun résultat' : 'Aucune recette encore'}
          </p>
          <p className="text-gray-400 text-sm">
            {search ? `Aucune recette ne correspond à "${search}"` : 'Sois le premier à partager une recette !'}
          </p>
        </div>
      ) : (
        <>
          {search && (
            <p className="text-xs text-gray-400 mb-3 font-medium">
              {displayed.length} résultat{displayed.length > 1 ? 's' : ''} pour « {search} »
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-5 sm:right-6 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        <Plus size={20} />
        <span className="hidden sm:block">Ajouter</span>
      </button>

      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
