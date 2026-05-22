import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const TYPE_EMOJI = { restaurant: '🍽️', bar: '🍸', activite: '🎯', lieu: '📍', autre: '✨' }
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const pad = (n) => String(n).padStart(2, '0')

export default function PlanningPage() {
  const [activities, setActivities] = useState([])
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .not('planned_date', 'is', null)
        .order('planned_date', { ascending: true })
      setActivities(data || [])
    }
    fetch()
    const ch = supabase
      .channel('planning-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetch)
      .subscribe()
    return () => ch.unsubscribe()
  }, [])

  const year  = current.getFullYear()
  const month = current.getMonth()

  const firstDow   = (new Date(year, month, 1).getDay() + 6) % 7  // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getDayStr = (day) => `${year}-${pad(month + 1)}-${pad(day)}`

  // Index activities by date
  const byDate = {}
  activities.forEach((a) => {
    if (!byDate[a.planned_date]) byDate[a.planned_date] = []
    byDate[a.planned_date].push(a)
  })

  const today = new Date().toISOString().split('T')[0]
  const monthName = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const selectedActivities = selectedDay ? (byDate[selectedDay] || []) : []

  const upcoming = activities
    .filter((a) => a.planned_date >= today && !a.done)
    .slice(0, 10)

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null) }}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-extrabold text-gray-900 capitalize text-lg">{monthName}</h2>
        <button
          onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null) }}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dayStr     = getDayStr(day)
          const hasActs    = !!byDate[dayStr]
          const isToday    = dayStr === today
          const isSelected = dayStr === selectedDay
          const isPast     = dayStr < today

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : dayStr)}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md scale-105'
                  : isToday
                    ? 'bg-violet-100 text-violet-700 font-extrabold'
                    : hasActs
                      ? 'bg-amber-50 text-gray-900 hover:bg-amber-100'
                      : isPast
                        ? 'text-gray-300 hover:bg-gray-50'
                        : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {day}
              {hasActs && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white/80' : 'bg-amber-400'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3 capitalize">
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          {selectedActivities.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-gray-400 text-sm">Aucune activité planifiée ce jour</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100">
                  {a.image_url ? (
                    <img src={a.image_url} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt={a.name} />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-xl flex-shrink-0">
                      {TYPE_EMOJI[a.type] || '✨'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{a.name}</div>
                    <div className="text-xs text-gray-400">{a.added_by}</div>
                  </div>
                  {a.done && <span className="text-xs font-bold text-emerald-500 flex-shrink-0">✓ Fait</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming list */}
      {!selectedDay && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Prochainement</h3>
          {upcoming.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-gray-600 font-bold">Aucun spot planifié</p>
              <p className="text-gray-400 text-sm mt-1">Édite un spot pour lui donner une date prévue</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="bg-amber-50 rounded-xl px-3 py-1.5 text-center flex-shrink-0 min-w-[64px]">
                    <div className="text-xs font-bold text-amber-600">
                      {new Date(a.planned_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span className="text-lg">{TYPE_EMOJI[a.type] || '✨'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 text-sm truncate block">{a.name}</span>
                    <span className="text-xs text-gray-400">{a.added_by}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
