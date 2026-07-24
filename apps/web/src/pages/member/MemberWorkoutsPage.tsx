import { Dumbbell } from 'lucide-react'

export default function MemberWorkoutsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
          My Workouts
        </h1>
        <p className="text-slate-500 mt-1">Your personal training plans</p>
      </div>

      <div className="card border-0 shadow-card">
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No active plans yet</h3>
          <p className="text-slate-500 max-w-sm">
            Ask your trainer to assign you a customized workout split and diet plan, and it will appear right here!
          </p>
        </div>
      </div>
    </div>
  )
}
