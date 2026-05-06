import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Store, Shield, Bell, CreditCard, Laptop, Loader2, Zap } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('gym')
  const queryClient = useQueryClient()

  const { data: gymData, isLoading } = useQuery({
    queryKey: ['gym-profile'],
    queryFn: () => api.get('/gym/profile').then(r => r.data.data),
  })

  const updateGym = useMutation({
    mutationFn: (data: any) => api.patch('/gym/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-profile'] })
      toast.success('Gym profile updated!')
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Update failed'),
  })

  const tabs = [
    { id: 'gym', label: 'Gym Profile', icon: Store },
    { id: 'billing', label: 'Billing & GST', icon: CreditCard },
    { id: 'auth', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Laptop },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="flex gap-4">
          <div className="skeleton h-64 w-48 rounded-xl" />
          <div className="flex-1 skeleton h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your gym profile and system preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-60 flex-shrink-0">
          <div className="card p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'gym' && (
            <div className="card space-y-6 animate-slide-up">
              <div>
                <h3 className="font-display font-semibold text-slate-800 border-b border-border pb-3 mb-4">Gym Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Gym Name</label>
                    <input type="text" className="input" defaultValue={gymData?.name} placeholder="e.g. GDK Fitness Hub" />
                  </div>
                  <div>
                    <label className="label">Public Email</label>
                    <input type="email" className="input" defaultValue={gymData?.email} placeholder="contact@gym.com" />
                  </div>
                  <div>
                    <label className="label">Public Phone</label>
                    <input type="text" className="input" defaultValue={gymData?.phone} placeholder="+91 9876543210" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <textarea className="input resize-none h-20" defaultValue={gymData?.address} placeholder="Full address..." />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display font-semibold text-slate-800 border-b border-border pb-3 mb-4">Branding</h3>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 relative group cursor-pointer overflow-hidden">
                    {gymData?.logo_url ? (
                      <img src={gymData.logo_url} className="w-full h-full object-contain" alt="Gym Logo" />
                    ) : (
                      <Zap className="w-8 h-8 text-slate-300 group-hover:text-primary-700 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-white font-semibold">Change Logo</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">Gym Logo</p>
                    <p className="text-xs text-slate-400">PNG, JPG or SVG. Max 2MB.</p>
                    <button className="btn-outline btn-sm mt-2">Upload Image</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button className="btn-primary">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card space-y-6 animate-slide-up">
              <div>
                <h3 className="font-display font-semibold text-slate-800 border-b border-border pb-3 mb-4">Tax & Invoicing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">GSTIN</label>
                    <input type="text" className="input" defaultValue={gymData?.gstin} placeholder="29ABCDE1234F1Z5" />
                  </div>
                  <div>
                    <label className="label">Invoice Prefix</label>
                    <input type="text" className="input" defaultValue="GDK-INV-" />
                  </div>
                  <div>
                    <label className="label">Default GST Rate (%)</label>
                    <input type="number" className="input" defaultValue={18} />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="tax_inclusive" className="w-4 h-4 accent-primary-700" defaultChecked />
                    <label htmlFor="tax_inclusive" className="text-sm text-slate-700 cursor-pointer">Prices are tax-inclusive by default</label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display font-semibold text-slate-800 border-b border-border pb-3 mb-4">Payment Integrations</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#3395FF]/10 flex items-center justify-center">
                        <img src="https://razorpay.com/favicon.png" className="w-6 h-6 grayscale opacity-50" alt="Razorpay" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Razorpay</p>
                        <p className="text-xs text-slate-400">Collect online payments via UPI, Cards, Netbanking</p>
                      </div>
                    </div>
                    <button className="btn-outline btn-sm">Configure</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button className="btn-primary">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card space-y-6 animate-slide-up">
              <div>
                <h3 className="font-display font-semibold text-slate-800 border-b border-border pb-3 mb-4">WhatsApp Automations</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Welcome Message', desc: 'Send automatically when a member joins', enabled: true },
                    { title: 'Payment Receipt', desc: 'Send automatically after successful payment', enabled: true },
                    { title: 'Expiry Reminder (3 days)', desc: 'Send reminder 3 days before plan expiry', enabled: false },
                    { title: 'Expiry Reminder (Day of)', desc: 'Send reminder on the day plan expires', enabled: true },
                    { title: 'Attendance Check-in', desc: 'Send a daily greeting on check-in', enabled: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <div className={cn(
                        'w-10 h-5 rounded-full relative cursor-pointer transition-colors',
                        item.enabled ? 'bg-primary-700' : 'bg-slate-200'
                      )}>
                        <div className={cn(
                          'absolute top-1 w-3 h-3 bg-white rounded-full transition-all',
                          item.enabled ? 'right-1' : 'left-1'
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary-700" />
                <div>
                  <p className="text-sm font-semibold text-primary-900">Wati.io Integration</p>
                  <p className="text-xs text-primary-700">Connect your WhatsApp Business API to enable these automations.</p>
                </div>
                <button className="btn-primary btn-sm ml-auto">Connect</button>
              </div>
            </div>
          )}

          {['auth', 'system'].includes(activeTab) && (
            <div className="card py-16 text-center">
              <Laptop className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-slate-700">More settings coming soon</h3>
              <p className="text-sm text-slate-400 mt-1">We are working on adding more customization options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
