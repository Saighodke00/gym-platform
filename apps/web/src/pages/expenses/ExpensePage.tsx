import { useState, useEffect } from 'react'
import { Plus, IndianRupee, Tag, Calendar, Download, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const CATEGORIES = ['Rent', 'Electricity', 'Equipment', 'Salaries', 'Maintenance', 'Marketing', 'Supplies', 'Other']

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalExpense, setTotalExpense] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] })

  useEffect(() => { fetchExpenses() }, [])

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses')
      setExpenses(res.data.data)
      const total = res.data.data.reduce((sum: number, exp: any) => sum + exp.amount, 0)
      setTotalExpense(total)
    } catch (err) {
      console.error('Failed to fetch expenses', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category || !form.amount) return toast.error('Category and amount are required')
    setSubmitting(true)
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) })
      toast.success('Expense recorded!')
      setShowForm(false)
      setForm({ category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] })
      fetchExpenses()
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to record expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Expense Tracker</h1>
          <p className="text-slate-500 text-sm">Monitor and manage your gym's operational costs.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-md p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-800">Record Expense</h3>
            <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount (₹) *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="number" className="input pl-8" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary bg-rose-600 hover:bg-rose-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-danger/10 text-danger"><TrendingDown className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outflow</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900">₹{totalExpense.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-1">Total expenses tracked to date</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-success/10 text-success"><TrendingUp className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Month</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900">
            ₹{expenses.filter((e: any) => new Date(e.expense_date).getMonth() === new Date().getMonth()).reduce((s: number, e: any) => s + e.amount, 0).toLocaleString()}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Current month expenses</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-primary-50 text-primary-700"><Tag className="w-6 h-6" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Entries</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900">{expenses.length}</h3>
          <p className="text-xs text-slate-500 mt-1">Expense records logged</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
          <button className="text-xs font-bold text-primary-700 flex items-center gap-1">
            <Download className="w-3 h-3" /> Export Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading expenses...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No expenses recorded yet. Click "Add Expense" to start.</td></tr>
              ) : expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><Tag className="w-3 h-3" /></div>
                      <span className="text-sm font-semibold text-slate-900">{exp.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{exp.description || 'No description'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(exp.expense_date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">-₹{exp.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
