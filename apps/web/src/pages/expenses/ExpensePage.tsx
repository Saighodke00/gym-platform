import { useState, useEffect } from 'react'
import { Plus, IndianRupee, Tag, Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalExpense, setTotalExpense] = useState(0)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('/api/v1/expenses')
      setExpenses(res.data.data)
      const total = res.data.data.reduce((sum: number, exp: any) => sum + exp.amount, 0)
      setTotalExpense(total)
    } catch (err) {
      console.error('Failed to fetch expenses', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Expense Tracker</h1>
          <p className="text-slate-500 text-sm">Monitor and manage your gym's operational costs.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-danger/10 text-danger">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outflow</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900">₹{totalExpense.toLocaleString()}</h3>
          <p className="text-xs text-slate-500 mt-1">Total expenses tracked to date</p>
        </div>
        
        {/* Placeholder for Revenue Comparison */}
        <div className="bg-white p-6 rounded-3xl border border-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-success/10 text-success">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900">Calculated...</h3>
          <p className="text-xs text-slate-500 mt-1">Operating margin estimate</p>
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
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No expenses recorded yet.</td>
                </tr>
              ) : expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                        <Tag className="w-3 h-3" />
                      </div>
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
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    -₹{exp.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
