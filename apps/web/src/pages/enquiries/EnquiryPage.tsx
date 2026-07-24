import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Phone, Mail, Calendar, MoreHorizontal, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function EnquiryPage() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', interested_in: '', source: '', notes: ''
  })

  useEffect(() => { fetchEnquiries() }, [])

  const fetchEnquiries = async () => {
    try {
      const res = await api.get('/enquiries')
      setEnquiries(res.data.data)
    } catch (err) {
      console.error('Failed to fetch enquiries', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) return toast.error('Name and phone are required')
    setSubmitting(true)
    try {
      await api.post('/enquiries', form)
      toast.success('Enquiry added successfully!')
      setShowForm(false)
      setForm({ name: '', phone: '', email: '', interested_in: '', source: '', notes: '' })
      fetchEnquiries()
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add enquiry')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = enquiries.filter((e: any) =>
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Enquiry Management</h1>
          <p className="text-slate-500 text-sm">Track and manage potential gym members.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl">
          <Plus className="w-4 h-4" /> New Enquiry
        </button>
      </div>

      {/* Add Enquiry Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-primary-200 shadow-md p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-800">New Enquiry</h3>
            <button onClick={() => setShowForm(false)} className="btn-ghost btn-sm p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="rahul@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Interested In</label>
                <select className="input" value={form.interested_in} onChange={e => setForm(f => ({ ...f, interested_in: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="Monthly Membership">Monthly Membership</option>
                  <option value="Annual Membership">Annual Membership</option>
                  <option value="Personal Training">Personal Training</option>
                  <option value="Group Classes">Group Classes</option>
                </select>
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Referral">Referral</option>
                  <option value="Google">Google</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Any notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Enquiry'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-primary-700/20"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="p-2 rounded-xl border border-border hover:bg-slate-50">
            <Filter className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Interested In</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading enquiries...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No enquiries found.</td></tr>
              ) : filtered.map((enq: any) => (
                <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">{enq.name}</p>
                    <p className="text-xs text-slate-500">{enq.source || 'Direct Walk-in'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600"><Phone className="w-3 h-3" /> {enq.phone}</div>
                      {enq.email && <div className="flex items-center gap-2 text-xs text-slate-600"><Mail className="w-3 h-3" /> {enq.email}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      enq.status === 'new' ? 'bg-primary-50 text-primary-700' :
                      enq.status === 'joined' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-600'
                    }`}>{enq.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{enq.interested_in || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(enq.created_at), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
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
