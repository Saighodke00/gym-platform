import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck,
  Dumbbell, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight, Zap, IndianRupee, MessageSquare, ClipboardList, Wallet
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const adminNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members',     icon: Users,           label: 'Members' },
  { to: '/plans',       icon: CreditCard,      label: 'Membership Plans' },
  { to: '/payments',    icon: IndianRupee,     label: 'Payments & Ledger' },
  { to: '/attendance',  icon: CalendarCheck,   label: 'Attendance' },
  { to: '/broadcast',   icon: MessageSquare,   label: 'Broadcast' },

  { to: '/workouts',    icon: Dumbbell,        label: 'Workouts' },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
]

const memberNav = [
  { to: '/member/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/member/plan',      icon: CreditCard,      label: 'My Plan' },
  { to: '/member/workouts',  icon: Dumbbell,        label: 'My Workouts' },
  { to: '/settings',         icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-white border-r border-border transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-border', collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="font-display font-bold text-primary-700 text-lg leading-none">GDK</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Gym Platform</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-border shadow-card flex items-center justify-center text-slate-400 hover:text-primary-700 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {(user?.role === 'member' ? memberNav : adminNav).map(({ to, icon: Icon, label, soon }) => (
          <NavLink
            key={to}
            to={soon ? '#' : to}
            onClick={soon ? (e) => e.preventDefault() : undefined}
            className={({ isActive }) =>
              cn(
                'nav-item group relative',
                isActive && !soon ? 'nav-item-active' : 'nav-item-default',
                soon && 'opacity-50 cursor-not-allowed',
                collapsed && 'justify-center px-0'
              )
            }
          >
            <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
            {!collapsed && <span className="truncate">{label}</span>}
            {!collapsed && soon && (
              <span className="ml-auto text-[10px] font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                SOON
              </span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger/10 text-slate-400 hover:text-danger transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="btn-icon text-slate-400 hover:text-danger hover:bg-danger/10" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
