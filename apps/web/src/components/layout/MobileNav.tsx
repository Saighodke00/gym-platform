import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CreditCard, CalendarCheck, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/mobile'
import { ImpactStyle } from '@capacitor/haptics'

import { useAuthStore } from '@/store/authStore'

const adminNav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Home' },
  { to: '/members',    icon: Users,           label: 'Members' },
  { to: '/attendance', icon: CalendarCheck,   label: 'Attendance' },
  { to: '/plans',      icon: CreditCard,      label: 'Plans' },
  { to: '/workouts',   icon: Dumbbell,        label: 'Workouts' },
]

const memberNav = [
  { to: '/member/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/member/plan',      icon: CreditCard,      label: 'My Plan' },
  { to: '/member/workouts',  icon: Dumbbell,        label: 'Workouts' },
]

export default function MobileNav() {
  const { user } = useAuthStore()
  const navToUse = user?.role === 'member' ? memberNav : adminNav

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-bottom">
      <div className="flex">
        {navToUse.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => triggerHaptic(ImpactStyle.Light)}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary-700' : 'text-slate-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('p-1 rounded-lg transition-colors', isActive && 'bg-primary-50')}>
                  <Icon className="w-5 h-5" />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
