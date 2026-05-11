import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Phone, Mail, Calendar, MoreHorizontal, UserPlus } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

export default function EnquiryPage() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    try {
      const res = await axios.get('/api/v1/enquiries')
      setEnquiries(res.data.data)
    } catch (err) {
      console.error('Failed to fetch enquiries', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Enquiry Management</h1>
          <p className="text-slate-500 text-sm">Track and manage potential gym members.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl">
          <Plus className="w-4 h-4" />
          New Enquiry
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search enquiries..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-primary-700/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading enquiries...</td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No enquiries found.</td>
                </tr>
              ) : enquiries.map((enq: any) => (
                <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">{enq.name}</p>
                    <p className="text-xs text-slate-500">{enq.source || 'Direct Walk-in'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="w-3 h-3" /> {enq.phone}
                      </div>
                      {enq.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3" /> {enq.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      enq.status === 'new' ? 'bg-primary-50 text-primary-700' :
                      enq.status === 'joined' ? 'bg-success/10 text-success' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {enq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{enq.interested_in || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(new Date(enq.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
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
