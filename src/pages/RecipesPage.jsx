import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import RecipeCard from '../components/RecipeCard'
import AddRecipeModal from '../components/AddRecipeModal'
import { Plus } from 'lucide-react'

export default function RecipesPage() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <p className="text-gray-600 text-xl font-bold mb-1">Aucune recette encore</p>
          <p className="text-gray-400 text-sm">Sois le premier à partager une recette !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
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
