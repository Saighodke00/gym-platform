import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Dumbbell, Plus, Search, Filter, Play, 
  ChevronRight, MoreVertical, Target, 
  Clock, Flame, Layers, Info, BookOpen,
  ArrowRight, CheckCircle2, ShieldCheck
} from 'lucide-react'
import api from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'exercises' | 'principles'>('plans')
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['workout-templates'],
    queryFn: () => api.get('/workouts/templates').then(r => r.data.data),
    enabled: activeTab === 'plans'
  })

  const { data: exercises, isLoading: isExercisesLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => api.get('/exercises').then(r => r.data.data),
    enabled: activeTab === 'exercises'
  })

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Training & Workouts</h1>
          <p className="text-slate-500 text-sm mt-1">A scalable management system for professional gym enterprises</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== 'principles' && (
            <button className="btn-primary gap-2 px-6 shadow-glow">
              <Plus className="w-4 h-4" /> 
              {activeTab === 'plans' ? 'Create New Plan' : 'Add Exercise'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('plans')}
            className={cn(
              "px-6 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === 'plans' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Workout Plans
          </button>
          <button 
            onClick={() => setActiveTab('exercises')}
            className={cn(
              "px-6 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === 'exercises' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Exercise Library
          </button>
          <button 
            onClick={() => setActiveTab('principles')}
            className={cn(
              "px-6 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === 'principles' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Principles & Guides
          </button>
        </div>

        {activeTab !== 'principles' && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'plans' ? "Search plans..." : "Search exercises..."}
              className="input pl-10 h-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isPlansLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
            ))
          ) : (plans || []).map((plan: any) => (
            <div key={plan.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      plan.level === 'Beginner' ? 'bg-emerald-50 text-emerald-600' :
                      plan.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    )}>
                      {plan.level}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-primary-700 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">{plan.duration_weeks} Weeks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Layers className="w-4 h-4" />
                    <span className="text-xs font-medium">{plan.days_per_week} Days/Wk</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-medium">{plan.goal}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{plan.days?.length || 0} Training Days</p>
                <button className="text-primary-700 text-sm font-bold flex items-center gap-1 group/btn">
                  View Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isExercisesLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : (exercises || []).map((ex: any) => (
            <div key={ex.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-primary-200 transition-colors flex flex-col justify-between h-40 group">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">{ex.muscle_groups}</span>
                  <div className="flex items-center gap-1">
                    {Array(ex.difficulty).fill(0).map((_, i) => (
                      <div key={i} className="w-1 h-2 bg-primary-400 rounded-full" />
                    ))}
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 leading-tight group-hover:text-primary-700 transition-colors">{ex.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" /> {ex.equipment}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Sets</p>
                    <p className="text-sm font-black text-slate-700">{ex.default_sets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Reps</p>
                    <p className="text-sm font-black text-slate-700">{ex.default_reps}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary-700 hover:text-white transition-all">
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'principles' && (
        <div className="max-w-5xl mx-auto space-y-12 animate-fade-in-up">
          {/* Intro Hero */}
          <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <span className="px-4 py-1.5 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-[0.2em] border border-primary-500/30">Whitepaper 2026</span>
              <h2 className="text-4xl font-display font-bold mt-6 leading-tight">The Kinetic Database:<br />Architecture of Modern Training</h2>
              <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">
                The creation of a professional-grade workout management system requires a rigorous synthesis 
                of exercise physiology, biomechanical engineering, and pedagogical clarity.
              </p>
            </div>
          </div>

          {/* Section: Physiology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900">Physiological Adaptation & Overload</h3>
              <p className="text-slate-600 leading-relaxed">
                Our system tracks member performance and suggests adjustments based on the <strong>"Two-for-Two" rule</strong>: 
                if a member can perform two additional repetitions on the final set of an exercise for two consecutive workouts, 
                the weight should be increased by approximately 2.5 to 5% for upper body and 5 to 10% for lower body movements.
              </p>
              <div className="flex flex-col gap-3">
                {['Progressive Overload Tracking', 'Metabolic Expenditure Analysis', 'Recovery Threshold Enforcement'].map((p) => (
                  <div key={p} className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-primary-600" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative group">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] shadow-xl" />
              <div className="relative z-10 space-y-4">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">Technical execution</p>
                <h4 className="text-lg font-bold text-slate-900">The Horizontal Press Pattern</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Proper setup involves lying supine on a flat bench with feet planted firmly. The bar is lowered slowly to the sternum, 
                  with elbows tucked at 45 degrees to protect the shoulder capsule.
                </p>
                <button className="flex items-center gap-2 text-primary-700 text-sm font-bold group/btn mt-4">
                  Read Full Biomechanics Guide <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Volume Analysis */}
          <div className="card p-8 bg-primary-700 text-white border-none shadow-glow-primary overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-2">
                <h3 className="text-2xl font-display font-bold">Training Volume & Recovery Thresholds</h3>
                <p className="text-primary-100 mt-2 text-sm max-w-xl">
                  Research suggests that 10 to 20 sets per muscle group per week is ideal for hypertrophy. 
                  The GDK system flags plans that exceed these limits as high-risk for overtraining.
                </p>
              </div>
              <div className="flex flex-col justify-center items-end">
                <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full">
                  <p className="text-xs uppercase font-bold tracking-widest text-primary-200">Ideal Weekly Volume</p>
                  <p className="text-4xl font-black mt-1">10-20 <span className="text-lg font-bold text-primary-300">Sets</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Experience Tier Guide */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display font-bold text-slate-900 text-center">The Tiered Evolutionary System</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Beginner', range: '0–6 Months', focus: 'Motor Patterns & GPP', color: 'bg-emerald-50 text-emerald-700' },
                { title: 'Intermediate', range: '6–24 Months', focus: 'Hypertrophy & Split Structure', color: 'bg-amber-50 text-amber-700' },
                { title: 'Advanced', range: '24+ Months', focus: 'Specificity & Periodization', color: 'bg-rose-50 text-rose-700' }
              ].map((tier) => (
                <div key={tier.title} className={cn("p-6 rounded-3xl border border-transparent hover:border-slate-200 transition-all text-center space-y-3", tier.color)}>
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">{tier.range}</p>
                  <h4 className="text-xl font-display font-bold">{tier.title}</h4>
                  <p className="text-xs font-medium leading-relaxed">{tier.focus}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
