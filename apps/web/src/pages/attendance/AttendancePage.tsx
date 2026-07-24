import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Search, Clock, CheckCircle2, XCircle, Users, Activity, Monitor, QrCode } from 'lucide-react'
import { formatDateTime, formatTime, cn } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

function CheckinCard({ checkin }: { checkin: any }) {
  const name = checkin.member?.user?.name ?? 'Unknown'
  const plan = checkin.member?.member_plans?.[0]?.plan?.name ?? 'No Plan'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 text-sm truncate">{name}</p>
        <p className="text-xs text-slate-400">{plan}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-slate-600">{formatTime(checkin.checked_in_at)}</p>
        <span className={cn('text-[10px] font-medium', checkin.method === 'qr' ? 'text-success' : 'text-slate-400')}>
          {checkin.method === 'qr' ? '📱 QR' : '✋ Manual'}
        </span>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const [manualMemberId, setManualMemberId] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then(r => r.data.data),
    refetchInterval: 3000, // Fast polling for "Live" feel
  })

  const { data: statsData } = useQuery({
    queryKey: ['attendance-stats'],
    queryFn: () => api.get('/attendance/stats').then(r => r.data.data),
  })

  const { data: membersData } = useQuery({
    queryKey: ['members-search', memberSearch],
    queryFn: () => api.get('/members', { params: { search: memberSearch, limit: 10 } }).then(r => r.data.data),
    enabled: memberSearch.length > 2,
  })

  const manualCheckin = useMutation({
    mutationFn: (member_id: string) => api.post('/attendance/manual-checkin', { member_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      toast.success(`${res.data.data.member_name} manually checked in ✅`)
      setManualMemberId('')
      setMemberSearch('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Check-in failed'),
  })

  const checkins = todayData?.checkins ?? []
  const today = todayData?.date ?? new Date().toISOString().split('T')[0]

  // Peak hour from stats
  const hourlyMap = statsData?.hourly_heatmap ?? {}
  const peakHour = Object.entries(hourlyMap).sort(([,a],[,b]) => (b as number) - (a as number))[0]?.[0]

  const filtered = checkins.filter((c: any) =>
    !memberSearch || c.member?.user?.name?.toLowerCase().includes(memberSearch.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Real-time check-in tracking — {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/kiosk" className="btn-outline btn-sm gap-1.5">
            <Monitor className="w-4 h-4" /> Kiosk Mode
          </Link>
          <Link to="/attendance/scan" className="btn-primary btn-sm gap-1.5">
            <QrCode className="w-4 h-4" /> Scan QR
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-success/10 text-success w-fit">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="stat-value mt-2">{todayData?.total_checkins ?? '—'}</p>
          <p className="stat-label">Today's Check-ins</p>
        </div>
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-primary-50 text-primary-700 w-fit">
            <Users className="w-4 h-4" />
          </div>
          <p className="stat-value mt-2">{statsData?.last_30_days ?? '—'}</p>
          <p className="stat-label">Last 30 Days</p>
        </div>
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-accent/10 text-accent w-fit">
            <Activity className="w-4 h-4" />
          </div>
          <p className="stat-value mt-2">{statsData?.avg_per_day ?? '—'}</p>
          <p className="stat-label">Avg / Day</p>
        </div>
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-warning/10 text-warning w-fit">
            <Clock className="w-4 h-4" />
          </div>
          <p className="stat-value mt-2">{peakHour ? `${peakHour}:00` : '—'}</p>
          <p className="stat-label">Peak Hour</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Check-ins */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800">
              Today's Attendance
              <span className="ml-2 badge badge-active">{todayData?.total_checkins ?? 0}</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="input pl-8 w-44 text-xs py-1.5"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No check-ins yet today</p>
              <p className="text-xs mt-1">Members will appear here as they arrive</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map((c: any) => <CheckinCard key={c.id} checkin={c} />)}
            </div>
          )}
        </div>

        {/* Manual Check-in + Hourly Heatmap */}
        <div className="space-y-4">
          {/* Manual Check-in */}
          <div className="card">
            <h3 className="font-display font-semibold text-slate-800 mb-3">Manual Check-in</h3>
            <p className="text-xs text-slate-500 mb-3">For members whose QR code isn't working</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member by name..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="input pl-8"
              />
            </div>

            {memberSearch.length > 2 && (
              <div className="border border-border rounded-lg overflow-hidden">
                {(membersData ?? []).slice(0, 5).map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setManualMemberId(m.id)
                      setMemberSearch(m.user?.name)
                      manualCheckin.mutate(m.id)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 transition-colors text-left border-b border-border last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                      {m.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.user?.name}</p>
                      <p className="text-xs text-slate-400">{m.member_code}</p>
                    </div>
                  </button>
                ))}
                {(membersData ?? []).length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-slate-400">No members found</div>
                )}
              </div>
            )}
          </div>

          {/* Hourly Heatmap */}
          <div className="card">
            <h3 className="font-display font-semibold text-slate-800 mb-3">Peak Hours (30 days)</h3>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, h) => {
                const count = hourlyMap[h] ?? 0
                const max = Math.max(...Object.values(hourlyMap) as number[], 1)
                const intensity = Math.round((count / max) * 5)
                const colors = ['bg-slate-100', 'bg-primary-100', 'bg-primary-200', 'bg-primary-400', 'bg-primary-600', 'bg-primary-800']
                return (
                  <div
                    key={h}
                    className={cn(
                      'h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-default shadow-sm border border-black/5',
                      colors[intensity],
                      intensity > 3 ? 'text-white' : 'text-slate-600'
                    )}
                    title={`${h}:00 — ${count} check-ins`}
                  >
                    {h}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-slate-100 border border-slate-200" /> Low
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-primary-400" /> High
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
