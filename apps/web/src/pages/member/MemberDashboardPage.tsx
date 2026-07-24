import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ChevronRight, Zap, Target, TrendingUp, Download, Play, Trophy } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function MemberDashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await api.get('/members/me/profile')
      setProfile(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load profile')
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

  if (!profile) return null

  const activePlan = profile.member_plans?.[0]
  const daysLeft = activePlan ? differenceInDays(new Date(activePlan.end_date), new Date()) : 0
  const isExpiring = daysLeft <= 7 && daysLeft >= 0
  const isExpired = daysLeft < 0

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Hi, {profile.user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Welcome back to {profile.gym.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Plan & QR */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Active Plan Card */}
          <div className={cn(
            "card overflow-hidden border-0 shadow-card transition-all duration-300 transform hover:-translate-y-1 p-0",
            isExpired ? "bg-gradient-to-br from-danger/90 to-danger" :
            isExpiring ? "bg-gradient-to-br from-warning/90 to-warning" :
            "bg-gradient-to-br from-primary-800 to-primary-950"
          )}>
            <div className="p-6 text-white relative">
              <Zap className="absolute top-4 right-4 w-24 h-24 text-white/10 -rotate-12" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-1 rounded-full">
                    {activePlan ? 'Active Plan' : 'No Active Plan'}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold mb-1">
                  {activePlan ? activePlan.plan.name : 'Become a Member'}
                </h3>
                
                {activePlan && (
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Expires On</p>
                      <p className="font-medium text-lg">{format(new Date(activePlan.end_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-3xl font-display font-bold leading-none",
                        isExpired || isExpiring ? "text-white" : "text-accent"
                      )}>
                        {Math.max(0, daysLeft)}
                      </p>
                      <p className="text-white/70 text-sm uppercase font-semibold">Days Left</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Check-in Card */}
          <div className="card border-0 shadow-card overflow-hidden p-0">
            <div className="bg-slate-50/50 border-b border-border pb-4 px-6 pt-6">
              <h3 className="text-lg font-bold">Your Check-in Pass</h3>
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center">
              {profile.qr_code_url ? (
                <>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-4 inline-block">
                    <img src={profile.qr_code_url} alt="QR Code" className="w-48 h-48 md:w-56 md:h-56" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{profile.member_code}</p>
                  <p className="text-xs text-slate-500 mt-1">Scan at the front desk to check in</p>
                </>
              ) : (
                <div className="py-8 text-slate-400">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>QR Code not generated</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Stats & Actions */}
        <div className="md:col-span-7 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="card border-0 shadow-card">
              <div className="p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold font-display text-slate-900">{profile.attendance?.length || 0}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Total Visits</p>
              </div>
            </div>

            <div className="card border-0 shadow-card">
              <div className="p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold font-display text-slate-900">Level 1</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Fitness Rank</p>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-card">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-lg font-bold">Recent Check-ins</h3>
              <Link to="/member/plan" className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div>
              {profile.attendance?.length > 0 ? (
                <div className="space-y-4">
                  {profile.attendance.slice(0, 3).map((record: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{format(new Date(record.checked_in_at), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-slate-500">{format(new Date(record.checked_in_at), 'hh:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                        Attended
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-4 text-center">No recent check-ins.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
