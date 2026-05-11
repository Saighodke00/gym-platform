import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  IndianRupee, Download, Plus,
  TrendingUp, AlertCircle, FileText, Send,
  CreditCard, Smartphone, Wallet, Share2,
  CheckCircle2, Loader2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const [filter, setFilter] = useState('All')
  const queryClient = useQueryClient()

  const { data: stats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => api.get('/payments/stats').then(r => r.data.data),
    staleTime: 30000,
  })

  const { data: payments, isLoading: isPaymentsLoading, isError: isPaymentsError } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then(r => r.data.data),
    staleTime: 30000,
  })

  const confirmPayment = useMutation({
    mutationFn: (id: string) => api.patch(`/payments/${id}/confirm`),
    onSuccess: () => {
      toast.success('Payment confirmed! 💸')
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
    },
    onError: () => toast.error('Failed to confirm payment'),
  })

  const sendReminder = useMutation({
    mutationFn: (data: { member_id: string, amount: number, plan_name: string }) => 
      api.post('/payments/send-reminder', data),
    onSuccess: () => toast.success('Reminder sent via WhatsApp! 📱'),
    onError: () => toast.error('Failed to send WhatsApp reminder'),
  })

  if (isStatsLoading || isPaymentsLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-700 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Preparing financial data...</p>
      </div>
    )
  }

  if (isStatsError || isPaymentsError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-fade-in text-center p-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Connection Error</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">We couldn't connect to the financial server. Please try refreshing or log in again.</p>
        <button onClick={() => window.location.reload()} className="btn-primary btn-sm px-8 shadow-glow mt-2">Refresh Page</button>
      </div>
    )
  }

  const summary = stats?.summary || { revenue_this_month: 0, total_revenue: 0, outstanding_dues: 0, active_members: 0 }
  const methods = stats?.methods || {}
  const trend = stats?.trend || []
  const overdue = stats?.overdue || []

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Billing & Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage payments, invoices, and financial overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline bg-white border-slate-200 text-slate-700 gap-2 px-6">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="btn-primary gap-2 px-6 shadow-glow">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-primary-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between h-40">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold">{formatCurrency(summary.revenue_this_month)}</h2>
            <p className="text-xs text-white/60 mt-1 uppercase tracking-wider font-semibold">Revenue This Month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">{formatCurrency(summary.total_revenue)}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Total Revenue</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">{formatCurrency(summary.outstanding_dues)}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Outstanding Dues</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">{summary.active_members}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Active Subscriptions</p>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display font-bold text-slate-800 text-lg">Revenue Trend</h3>
          <select className="input text-xs py-1.5 w-36 bg-slate-50 border-transparent">
            <option>Last 6 months</option>
            <option>Last 12 months</option>
          </select>
        </div>
        {trend.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => [formatCurrency(val as number), 'Revenue']}
                />
                <Bar dataKey="value" fill="#1A56A0" radius={[6, 6, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="text-slate-400 text-sm font-medium">No revenue data to display yet</p>
          </div>
        )}
      </div>

      {/* Payment Method Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#fdf4ff] border border-purple-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-bold text-purple-900 text-sm">Card / Bank Transfer</h4>
          </div>
          <h3 className="text-2xl font-display font-bold text-purple-900">{formatCurrency(methods?.bank?._sum?.amount || 0)}</h3>
          <p className="text-[11px] text-purple-500 mt-1 font-medium">{methods?.bank?._count?.id || 0} transactions processed</p>
        </div>

        <div className="bg-[#f0f9ff] border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-bold text-blue-900 text-sm">UPI Payments</h4>
          </div>
          <h3 className="text-2xl font-display font-bold text-blue-900">{formatCurrency(methods?.upi?._sum?.amount || 0)}</h3>
          <p className="text-[11px] text-blue-500 mt-1 font-medium">{methods?.upi?._count?.id || 0} transactions via UPI</p>
        </div>

        <div className="bg-[#f0fdf4] border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-bold text-emerald-900 text-sm">Cash Collected</h4>
          </div>
          <h3 className="text-2xl font-display font-bold text-emerald-900">{formatCurrency(methods?.cash?._sum?.amount || 0)}</h3>
          <p className="text-[11px] text-emerald-500 mt-1 font-medium">{methods?.cash?._count?.id || 0} manual receipts</p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50">
          <h3 className="text-xl font-display font-bold text-slate-800">Income (Transactions)</h3>
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            {['All', 'Paid', 'Pending', 'Overdue'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                  filter === tab ? 'bg-primary-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50 min-h-[200px]">
          {payments && payments.length > 0 ? (
            payments.map((p: any) => (
              <div key={p.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    {p.member?.profile_photo_url ? (
                      <img src={p.member.profile_photo_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{p.member?.user?.name?.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.member?.user?.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.member_plan?.plan?.name || 'Top-up'} • {p.invoice_number || `INV-${p.id.slice(0, 8)}`}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(p.amount)}</p>
                    <p className="text-[10px] text-slate-400">+GST ₹{(p.amount * 0.18).toFixed(0)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-48 justify-end">
                    <span className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider flex items-center gap-1.5',
                      ['card', 'bank_transfer'].includes(p.method) ? 'text-purple-600 bg-purple-50 border-purple-100' :
                      p.method === 'upi' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                      'text-emerald-600 bg-emerald-50 border-emerald-100'
                    )}>
                      {['card', 'bank_transfer'].includes(p.method) ? <CreditCard className="w-3 h-3" /> : p.method === 'upi' ? <Smartphone className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                      {p.method.replace('_', ' ')}
                    </span>
                    
                    <button 
                      onClick={() => p.status !== 'confirmed' && confirmPayment.mutate(p.id)}
                      disabled={confirmPayment.isPending}
                      className={cn(
                        'text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider transition-all min-w-[80px]',
                        p.status === 'confirmed' 
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100 cursor-default' 
                          : 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                      )}
                    >
                      {confirmPayment.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (p.status === 'confirmed' ? 'paid' : 'Mark as Paid')}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:text-primary-700 transition-colors"><FileText className="w-4 h-4" /></button>
                    <button className="p-2 text-slate-400 hover:text-primary-700 transition-colors"><Share2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Section */}
      <div className="card p-0 overflow-hidden border-rose-100">
        <div className="p-6 flex items-center justify-between border-b border-rose-50 bg-rose-50/20">
          <h3 className="text-xl font-display font-bold text-slate-800">Outflow (Expenses)</h3>
          <button className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg transition-colors">
             <Plus className="w-3.5 h-3.5" /> Record Expense
          </button>
        </div>
        <div className="divide-y divide-rose-50/50">
          {stats?.latestExpenses?.length > 0 ? (
            stats.latestExpenses.map((exp: any) => (
              <div key={exp.id} className="p-5 flex items-center justify-between hover:bg-rose-50/10 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                      <Wallet className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{exp.category}</p>
                     <p className="text-[11px] text-slate-500">{exp.description || 'General gym expense'}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-rose-600">-{formatCurrency(exp.amount)}</p>
                   <p className="text-[10px] text-slate-400">{(new Date(exp.expense_date)).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400">
              <p className="text-sm">No expenses recorded recently</p>
            </div>
          )}
        </div>
      </div>


      {/* Overdue Members Alert Section */}
      <div className="card p-6 border-rose-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-slate-800 text-lg">Overdue Members</h3>
          <button className="btn-outline btn-xs gap-2 text-slate-500">
            <Send className="w-3.5 h-3.5" /> Send All Reminders
          </button>
        </div>
        <div className="space-y-3">
          {overdue && overdue.length > 0 ? (
            overdue.map((m: any) => (
              <div key={m.id} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-rose-200 overflow-hidden bg-white">
                    {m.photo ? (
                      <img src={m.photo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">GDK</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[11px] text-slate-500">{m.plan_name} • <span className="font-bold text-rose-600">{formatCurrency(m.due_amount)} due</span></p>
                    <p className="text-[10px] text-rose-500 font-bold mt-0.5">{m.days_overdue} days overdue</p>
                  </div>
                </div>
                <button 
                  onClick={() => sendReminder.mutate({ 
                    member_id: m.id, 
                    amount: m.due_amount, 
                    plan_name: m.plan_name 
                  })}
                  disabled={sendReminder.isPending}
                  className="btn-primary btn-sm px-5 shadow-sm"
                >
                  {sendReminder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Link'}
                </button>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No overdue payments. Great job! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
