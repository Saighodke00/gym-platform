import { useLocation } from 'react-router-dom'
import { Bell, QrCode, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/members': 'Members',
  '/members/new': 'Add New Member',
  '/plans': 'Membership Plans',
  '/attendance': 'Attendance',
  '/workouts': 'Workout Plans',
  '/analytics': 'Analytics',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search members, plans..." 
          className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary-700/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-5 border-l border-border">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">Admin • {user?.gymName || 'FitCore Gym'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-border overflow-hidden">
             {user?.profile_photo_url ? (
               <img src={user.profile_photo_url} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-primary-700 text-white text-[10px] font-bold">
                 {user?.name?.split(' ').map(n => n[0]).join('')}
               </div>
             )}
          </div>
        </div>
      </div>
    </header>
  )
}
