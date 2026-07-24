import { useEffect, useState } from 'react'
import { CreditCard, History, Zap, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function MemberPlanPage() {
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
      toast.error(err.response?.data?.error || 'Failed to load plan details')
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

  const activePlan = profile?.member_plans?.[0]

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
          My Plan
        </h1>
        <p className="text-slate-500 mt-1">Manage your active membership</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Current Plan Details */}
        <div className="card border-0 shadow-card p-0">
          <div className="bg-slate-50/50 border-b border-border pb-4 px-6 pt-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600" /> Current Membership
            </h3>
          </div>
          <div className="p-6">
            {activePlan ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{activePlan.plan.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                    <span className="text-sm font-medium text-slate-500">
                      ₹{activePlan.plan.price} / {activePlan.plan.duration_days} days
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Started On</p>
                    <p className="font-medium text-slate-900">{format(new Date(activePlan.start_date), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Valid Until</p>
                    <p className="font-medium text-slate-900">{format(new Date(activePlan.end_date), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full btn-primary py-2.5">Renew Membership</button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center">
                <CreditCard className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">No Active Plan</h3>
                <p className="text-slate-500 mb-6">You don't have an active membership plan.</p>
                <button className="btn-primary">Browse Plans</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance / Invoice History stub */}
        <div className="card border-0 shadow-card p-0">
          <div className="bg-slate-50/50 border-b border-border pb-4 px-6 pt-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" /> Recent Activity
            </h3>
          </div>
          <div className="p-0">
            {profile?.attendance?.length > 0 ? (
              <div className="divide-y divide-border">
                {profile.attendance.map((record: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Gym Check-in</p>
                        <p className="text-xs text-slate-500">{format(new Date(record.checked_in_at), 'hh:mm a')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">{format(new Date(record.checked_in_at), 'MMM dd')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">No recent activity.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
