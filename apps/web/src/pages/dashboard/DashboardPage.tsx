import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Users, TrendingUp, TrendingDown, CalendarCheck,
  AlertCircle, ArrowUpRight, Clock, IndianRupee,
  UserPlus, Activity, Monitor, Search, Bell,
  ChevronRight, MoreVertical,
} from 'lucide-react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import api from '@/lib/api'
import { formatCurrency, daysUntil, getMemberStatusColor, cn, formatDate, formatDateTime } from '@/lib/utils'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLORS = ['#1A56A0', '#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#BD10E0']

function StatCard({
  label, value, change, trend, icon: Icon, iconColor, subtext
}: {
  label: string
  value: string | number
  change?: string | number
  trend?: 'up' | 'down'
  icon: React.ElementType
  iconColor: string
  subtext?: string
}) {
  return (
    <div className="card group hover:shadow-elevated transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl text-white shadow-sm', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        {change && change !== '+0' && change !== '0%' && (
          <div className={cn('flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full', trend === 'up' ? 'text-success bg-success/10' : 'text-danger bg-danger/10')}>
            {trend === 'up' ? '↗' : '↘'} {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h2 className="text-2xl font-display font-bold text-slate-800">{value}</h2>
        <p className="text-[11px] font-medium text-slate-500 mt-1">{label}</p>
        {subtext && <p className="text-[10px] text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

function MiniStat({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-5">
      <p className="text-2xl font-display font-bold text-primary-700">{value}</p>
      <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{subtext}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
    refetchInterval: 3000, // Fast polling for "Live" feel
  })

  const { data: revenueChart } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => api.get('/dashboard/revenue-chart').then(r => r.data.data),
  })

  const stats = statsData?.kpis
  const planDist = statsData?.plan_distribution ?? []
  const checkins = statsData?.todays_checkins_list ?? []
  const topMembers = statsData?.top_members ?? []
  const upcomingRenewals = statsData?.upcoming_renewals ?? []
  const overdueMembers = statsData?.overdue_members ?? []

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{greeting()}, Admin! 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening at GDK Gym today</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <Link to="/kiosk" className="btn-outline btn-sm gap-1.5 shadow-sm">
            <Monitor className="w-4 h-4" /> Kiosk View
          </Link>
          <Link to="/members/new" className="btn-primary btn-sm shadow-md">
            <UserPlus className="w-4 h-4" /> Add Member
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Active Members" 
          value={stats?.total_active_members ?? 0} 
          change={stats?.new_members_this_month > 0 ? `+${stats.new_members_this_month}` : undefined} 
          trend="up" 
          icon={Users} 
          iconColor="bg-primary-700" 
          subtext="this month"
        />
        <StatCard 
          label="Revenue This Month" 
          value={formatCurrency(stats?.revenue_this_month ?? 0)} 
          change={stats?.revenue_change_pct !== 0 ? `${stats?.revenue_change_pct}%` : undefined} 
          trend={(stats?.revenue_change_pct ?? 0) >= 0 ? 'up' : 'down'} 
          icon={IndianRupee} 
          iconColor="bg-emerald-600" 
          subtext="vs last month"
        />
        <StatCard 
          label="Today's Check-ins" 
          value={stats?.todays_checkins ?? 0} 
          icon={CalendarCheck} 
          iconColor="bg-orange-500" 
          subtext="vs yesterday"
        />
        <StatCard 
          label="Expiring This Week" 
          value={stats?.expiring_soon_count ?? 0} 
          icon={AlertCircle} 
          iconColor="bg-rose-500" 
          subtext="vs last week"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800">Revenue Overview</h3>
              <p className="text-xs text-slate-500 mt-1">Last 12 months performance</p>
            </div>
            {stats?.revenue_change_pct > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> +{stats.revenue_change_pct}% Growth
              </div>
            )}
          </div>
          <div className="h-[280px]">
            {revenueChart?.some((d: any) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A56A0" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1A56A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.split('-')[1]} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1A56A0" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <Activity className="w-10 h-10 opacity-20" />
                <p className="text-sm italic">No revenue data to display yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card">
          <h3 className="font-display font-bold text-slate-800">Plan Distribution</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">Members by plan type</p>
          <div className="h-[200px] flex items-center justify-center">
            {planDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs italic">No active memberships</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {planDist.length > 0 ? planDist.slice(0, 5).map((p: any, i: number) => (
              <div key={p.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 font-medium">{p.name}</span>
                </div>
                <span className="text-slate-800 font-bold">{p.value}</span>
              </div>
            )) : (
              <p className="text-[10px] text-center text-slate-400">Add members to see distribution</p>
            )}
          </div>
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Check-ins */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800">Today's Check-ins</h3>
              <p className="text-xs text-slate-500 mt-1">{stats?.todays_checkins ?? 0} logged today</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/5 border border-success/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
            </div>
          </div>
          <div className="space-y-4">
            {checkins.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm italic">No check-ins yet today</div>
            ) : checkins.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {a.member?.profile_photo_url ? (
                    <img src={a.member.profile_photo_url} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                      {a.member?.user?.name?.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.member?.user?.name}</p>
                    <p className="text-[10px] text-slate-400">Checked in at {new Date(a.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className={cn('text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider', a.method === 'qr' ? 'text-success border-success/20 bg-success/5' : 'text-orange-600 border-orange-200 bg-orange-50')}>
                  {a.method}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="card bg-slate-50/50 border-dashed border-2 border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800">Alerts & Actions</h3>
              <p className="text-xs text-slate-500 mt-1">Requires your attention</p>
            </div>
            {upcomingRenewals.length + overdueMembers.length > 0 && (
              <span className="badge badge-danger">{upcomingRenewals.length + overdueMembers.length} alerts</span>
            )}
          </div>
          <div className="space-y-3">
            {upcomingRenewals.length === 0 && overdueMembers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm italic">Everything looks good! No pending alerts.</div>
            ) : (
              <>
                {upcomingRenewals.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-warning/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-warning/10">
                        <Clock className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{r.member?.user?.name}</p>
                        <p className="text-[10px] text-slate-400">Expires {formatDate(r.end_date)}</p>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-primary-700 hover:underline">Remind</button>
                  </div>
                ))}
                {overdueMembers.slice(0, 2).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-100">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{o.member?.user?.name}</p>
                        <p className="text-[10px] text-slate-500">Overdue: {formatCurrency(o.plan?.price ?? 0)}</p>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-primary-700 hover:underline">View</button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Mini Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat 
          label="Avg Attendance Rate" 
          value={`${stats?.avg_attendance_rate ?? 0}%`} 
          subtext="This month" 
        />
        <MiniStat 
          label="Total Revenue" 
          value={formatCurrency(stats?.revenue_this_month ?? 0)} 
          subtext="Confirmed payments" 
        />
        <MiniStat 
          label="Plans Expiring (30d)" 
          value={stats?.expiring_soon_count?.toString() ?? '0'} 
          subtext="Requires renewal" 
        />
        <MiniStat 
          label="Members Gained" 
          value={stats?.new_members_this_month?.toString() ?? '0'} 
          subtext="vs 0 last month" 
        />
      </div>

      {/* Top Members Streaks */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-slate-800">Top Members — Attendance Streaks</h3>
          <Link to="/members" className="text-xs text-primary-700 font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-5">
          {topMembers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm italic">Add members to track attendance performance</div>
          ) : topMembers.map((m: any, i: number) => (
            <div key={m.id} className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase overflow-hidden">
                {m.photo ? <img src={m.photo} className="w-full h-full object-cover" /> : m.name?.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-slate-800">{m.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400">{m.attendance_rate}%</span>
                    <span className="text-[11px] font-bold text-orange-500 flex items-center gap-1">⚡ {m.attendance_count}d</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-700 rounded-full transition-all duration-1000" 
                    style={{ width: `${m.attendance_rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
