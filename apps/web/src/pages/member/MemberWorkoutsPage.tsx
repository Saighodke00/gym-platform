import { useState, useEffect } from 'react'
import { Dumbbell, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function MemberWorkoutsPage() {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    try {
      const res = await api.get('/workouts/my-plan')
      setPlan(res.data.data)
    } catch (err: any) {
      // Don't toast 404, just leave it as null
      if (err.response?.status !== 404) {
        toast.error('Failed to load workout plan')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
          My Workouts
        </h1>
        <p className="text-slate-500 mt-1">Your personal training plans</p>
      </div>

      {!plan ? (
        <div className="card border-0 shadow-card">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No active plans yet</h3>
            <p className="text-slate-500 max-w-sm">
              Ask your trainer to assign you a customized workout split, and it will appear right here!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card border-0 shadow-card bg-gradient-to-br from-primary-800 to-primary-950 text-white p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-md">
                Active Plan
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-md">
                {plan.level}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <p className="text-white/80 text-sm mb-4">{plan.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-white/90">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-300" />
                {plan.duration_weeks} Weeks
              </div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-primary-300" />
                {plan.days_per_week} Days/Week
              </div>
            </div>
          </div>

          <h3 className="font-display font-bold text-slate-800 text-lg px-1">Workout Split</h3>
          <div className="space-y-3">
            {plan.days?.sort((a: any, b: any) => a.day_num - b.day_num).map((day: any) => {
              const exercises = JSON.parse(day.exercises || '[]')
              const isExpanded = expandedDay === day.id

              return (
                <div key={day.id} className="card border-0 shadow-sm p-0 overflow-hidden">
                  <button 
                    onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                    className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
                        D{day.day_num}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{day.muscle_focus}</p>
                        <p className="text-xs text-slate-500">{exercises.length} Exercises</p>
                      </div>
                    </div>
                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                      <div className="space-y-3 mt-4">
                        {exercises.map((ex: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </div>
                              <p className="font-medium text-slate-800 text-sm">{ex.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">{ex.sets} × {ex.reps}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{ex.rest}s rest</p>
                            </div>
                          </div>
                        ))}
                        {exercises.length === 0 && (
                          <p className="text-sm text-slate-500 text-center py-2">No exercises added to this day.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
