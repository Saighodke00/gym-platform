import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, Users, CalendarCheck, FileText, IndianRupee,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#1A56A0', '#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#BD10E0']

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then(r => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-700 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Crunching data...</p>
      </div>
    )
  }

  const trends = Array.isArray(analytics?.trends) ? analytics.trends : []
  const latestEnquiries = Array.isArray(analytics?.latestEnquiries) ? analytics.latestEnquiries : []
  const latestExpenses = Array.isArray(analytics?.latestExpenses) ? analytics.latestExpenses : []

  // Derived summary
  const totalRevenue = trends.reduce((sum: number, t: any) => sum + (Number(t.revenue) || 0), 0)
  const totalExpenses = trends.reduce((sum: number, t: any) => sum + (Number(t.expenses) || 0), 0)
  const totalNewMembers = trends.reduce((sum: number, t: any) => sum + (Number(t.new_members) || 0), 0)
  const totalEnquiries = trends.reduce((sum: number, t: any) => sum + (Number(t.enquiries) || 0), 0)

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Gym Analytics & Growth</h1>
        <p className="text-slate-500 text-sm mt-1">Deep dive into your gym's performance metrics</p>
      </div>

      {/* Top Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-primary-800 text-white p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white/70 font-semibold text-[10px] uppercase tracking-widest">Revenue (6M)</h3>
            <p className="text-2xl font-display font-bold mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="card bg-rose-600 text-white p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white/70 font-semibold text-[10px] uppercase tracking-widest">Expenses (6M)</h3>
            <p className="text-2xl font-display font-bold mt-1">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="card bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest">New Members</h3>
          <p className="text-2xl font-display font-bold text-slate-800 mt-1">{String(totalNewMembers)}</p>
        </div>

        <div className="card bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest">Leads/Enquiries</h3>
          <p className="text-2xl font-display font-bold text-slate-800 mt-1">{String(totalEnquiries)}</p>
        </div>
      </div>

      {/* Growth Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 border border-slate-100">
          <h3 className="font-display font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" /> Financial Performance
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1A56A0" strokeWidth={3} fill="#1A56A0" fillOpacity={0.1} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#E11D48" strokeWidth={3} fill="#E11D48" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 border border-slate-100">
          <h3 className="font-display font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Conversion Funnel
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="enquiries" name="Enquiries" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="new_members" name="Conversions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Enquiries */}
        <div className="card p-6 border border-slate-100">
          <h3 className="font-display font-bold text-slate-800 text-lg mb-6">Latest Enquiries</h3>
          <div className="space-y-4">
            {latestEnquiries.length > 0 ? latestEnquiries.map((enq: any) => (
              <div key={String(enq.id)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">{String(enq.name || 'No Name')}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{String(enq.source || 'Walk-in')} • {String(enq.phone || 'No Phone')}</p>
                </div>
                <span className="text-[10px] font-black text-primary-700 bg-primary-50 px-2 py-1 rounded uppercase tracking-tighter">
                  {String(enq.status || 'new')}
                </span>
              </div>
            )) : <p className="text-slate-400 text-sm py-10 text-center">No recent enquiries</p>}
          </div>
        </div>

        {/* Latest Expenses */}
        <div className="card p-6 border border-slate-100">
          <h3 className="font-display font-bold text-slate-800 text-lg mb-6">Recent Expenses</h3>
          <div className="space-y-4">
            {latestExpenses.length > 0 ? latestExpenses.map((exp: any) => (
              <div key={String(exp.id)} className="flex items-center justify-between p-3 bg-rose-50/30 rounded-xl border border-rose-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{String(exp.category || 'General')}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{String(exp.description || 'No description')}</p>
                </div>
                <p className="text-sm font-black text-rose-600">-{formatCurrency(Number(exp.amount) || 0)}</p>
              </div>
            )) : <p className="text-slate-400 text-sm py-10 text-center">No expenses recorded</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
