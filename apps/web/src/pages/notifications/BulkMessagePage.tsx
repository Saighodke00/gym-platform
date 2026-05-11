import { useState, useEffect } from 'react'
import { Send, Users, MessageSquare, Layout, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

export default function BulkMessagePage() {
  const [members, setMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('GDK Gym Update')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [membersRes, templatesRes] = await Promise.all([
        api.get('/members'),
        api.get('/templates')
      ])

      if (membersRes.data?.success) {
        setMembers(Array.isArray(membersRes.data.data) ? membersRes.data.data : [])
      }
      if (templatesRes.data?.success) {
        setTemplates(Array.isArray(templatesRes.data.data) ? templatesRes.data.data : [])
      }
    } catch (err) {
      console.error('Failed to fetch data', err)
    }
  }

  const handleSend = async () => {
    if (selectedMembers.length === 0) return setStatus({ type: 'error', message: 'Please select members' })
    if (!message) return setStatus({ type: 'error', message: 'Message cannot be empty' })

    setLoading(true)
    try {
      const res = await api.post('/notifications/bulk', {
        memberIds: selectedMembers,
        message,
        subject,
        channel: 'email'
      })
      
      if (res.data?.success) {
        setStatus({ type: 'success', message: `Successfully sent to ${String(res.data.data.sent_count)} members!` })
        setMessage('')
        setSelectedMembers([])
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to send messages' })
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(String(id)) ? prev.filter(mid => mid !== String(id)) : [...prev, String(id)]
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Broadcast Center</h1>
          <p className="text-slate-500 text-sm">Send bulk messages and announcements to your members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Member Selection */}
        <div className="bg-white rounded-3xl border border-border shadow-card flex flex-col h-[600px]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-700" /> Select Members
            </h3>
            <button 
              onClick={() => members?.length > 0 && setSelectedMembers(members.map((m: any) => String(m.id)))}
              className="text-[10px] font-bold text-primary-700 uppercase tracking-widest"
            >
              Select All
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {members.length > 0 ? members.map((member: any) => (
              <label 
                key={String(member.id)} 
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedMembers.includes(String(member.id)) ? 'bg-primary-50 border-primary-100' : 'hover:bg-slate-50 border-transparent'
                } border`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedMembers.includes(String(member.id))}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 rounded text-primary-700 border-slate-300 focus:ring-primary-700/20"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-900 truncate">{String(member?.user?.name || 'Unknown')}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{String(member?.member_code || '')}</p>
                </div>
              </label>
            )) : (
              <div className="py-10 text-center text-slate-400 text-sm italic">
                No members found
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-slate-50 rounded-b-3xl">
            <p className="text-xs text-slate-500 font-medium">{String(selectedMembers.length)} members selected</p>
          </div>
        </div>

        {/* Right Column: Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-border shadow-card p-6 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Subject</span>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-primary-700/20"
                  placeholder="Enter message subject..."
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message Content</span>
                  <span className="text-[10px] text-primary-600 font-bold uppercase">Use {"{{name}}"} for personalization</span>
                </div>
                <textarea 
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-primary-700/20 resize-none"
                  placeholder="Write your announcement here..."
                />
              </label>
            </div>

            {status && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                status.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm font-medium">{String(status.message)}</p>
              </div>
            )}

            <button 
              onClick={handleSend}
              disabled={loading}
              className="w-full btn-primary py-4 rounded-2xl shadow-lg shadow-primary-700/20 flex items-center justify-center gap-2 text-base font-bold disabled:opacity-50"
            >
              {loading ? 'Sending...' : <><Send className="w-5 h-5" /> Blast Message</>}
            </button>
          </div>

          {/* Templates Section */}
          <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border bg-slate-50 flex items-center gap-2">
              <Layout className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quick Templates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
               {templates.length > 0 ? templates.map((t: any) => (
                 <button 
                  key={String(t.id)}
                  onClick={() => setMessage(String(t.content))}
                  className="p-4 rounded-2xl border border-border hover:border-primary-200 hover:bg-primary-50 transition-all text-left group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary-700 mb-1">{String(t.name)}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 italic">{String(t.content)}</p>
                </button>
               )) : (
                 <>
                  <button 
                    onClick={() => setMessage('Hello {{name}}, this is a friendly reminder that we have a special session tomorrow at 6 PM! see you there 💪')}
                    className="p-4 rounded-2xl border border-border hover:border-primary-200 hover:bg-primary-50 transition-all text-left group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary-700 mb-1">Session Reminder</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 italic">"Hello {'{{name}}'}, this is a friendly reminder..."</p>
                  </button>
                  <button 
                    onClick={() => setMessage('🎉 Happy Birthday {{name}}! Wishing you a strong and healthy year ahead. Come by the gym today for your special birthday protein shake! 🥤💪')}
                    className="p-4 rounded-2xl border border-border hover:border-primary-200 hover:bg-primary-50 transition-all text-left group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary-700 mb-1">Birthday Greetings</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 italic">"🎉 Happy Birthday {'{{name}}'}! Wishing you a strong..."</p>
                  </button>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
