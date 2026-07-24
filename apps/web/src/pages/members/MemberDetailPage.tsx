import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Phone, Mail, Calendar,
  Activity, CreditCard, Clock, User,
  HeartPulse, Trash2, X, Loader2, IndianRupee, Plus, CheckCircle2, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { formatDate, formatDateTime, formatCurrency, getMemberStatusColor, getMemberStatusLabel, getInitials, daysUntil, cn } from '@/lib/utils'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between text-sm py-2 border-b border-border/50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export default function MemberDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null)
  
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [discountApplied, setDiscountApplied] = useState('0')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get(`/members/${id}`).then(r => r.data.data),
    enabled: !!id,
  })

  const { data: statsData } = useQuery({
    queryKey: ['member-stats', id],
    queryFn: () => api.get(`/members/${id}/stats`).then(r => r.data.data),
    enabled: !!id,
  })

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.data),
  })

  const deleteMember = useMutation({
    mutationFn: () => api.delete(`/members/${id}`),
    onSuccess: () => {
      toast.success('Member profile deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      navigate('/members')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete member')
    },
  })

  const assignPlan = useMutation({
    mutationFn: (data: any) => api.post('/plans/assign', data),
    onSuccess: () => {
      toast.success('Plan assigned successfully! 💳')
      setShowPlanModal(false)
      setSelectedPlanId('')
      setAmountPaid('')
      queryClient.invalidateQueries({ queryKey: ['member', id] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to assign plan')
    },
  })

  const recordPayment = useMutation({
    mutationFn: (data: any) => api.post('/payments/record', data),
    onSuccess: () => {
      toast.success('Payment recorded successfully! 💰')
      setShowPaymentModal(false)
      setSelectedPlanForPayment(null)
      setPaymentAmount('')
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to record payment')
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this member profile? This action cannot be undone.')) {
      deleteMember.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-32 rounded" />
        <div className="skeleton h-40 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
        <h3 className="font-semibold text-slate-700">Member not found</h3>
        <Link to="/members" className="btn-outline btn-sm mt-4">← Back to Members</Link>
      </div>
    )
  }

  const activePlan = member.member_plans?.find((p: any) => p.status === 'active')
  const daysLeft = activePlan ? daysUntil(activePlan.end_date) : null

  return (
    <div className="space-y-5 animate-fade-in relative">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link to="/members" className="btn-ghost btn-sm">
          <ChevronLeft className="w-4 h-4" /> Members
        </Link>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFeeModal(true)} 
            className="btn-outline btn-sm gap-1.5 text-primary-700 border-primary-100 bg-primary-50/30"
          >
            <IndianRupee className="w-3.5 h-3.5" /> View Fee Details
          </button>
          <Link to={`/members/${id}/edit`} className="btn-outline btn-sm">Edit Profile</Link>
          <button 
            onClick={handleDelete}
            disabled={deleteMember.isPending}
            className="btn-outline btn-sm text-danger border-danger/30 hover:bg-danger/5 flex items-center gap-1.5"
          >
            {deleteMember.isPending ? <span className="animate-spin text-xs">...</span> : <Trash2 className="w-3.5 h-3.5" />}
            Delete Profile
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            {member.profile_photo_url ? (
              <img src={member.profile_photo_url} className="w-20 h-20 rounded-2xl object-cover border-2 border-border" alt={member.user?.name} />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(member.user?.name ?? 'NA')}
              </div>
            )}
            <span className={cn('absolute -bottom-1.5 -right-1.5 badge text-[10px]', getMemberStatusColor(member.status))}>
              {getMemberStatusLabel(member.status)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-slate-800">{member.user?.name}</h2>
            <p className="text-sm text-primary-700 font-semibold font-mono">{member.member_code}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
              {member.user?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {member.user.phone}</span>}
              {member.user?.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {member.user.email}</span>}
              {member.joined_at && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {formatDate(member.joined_at)}</span>}
            </div>
          </div>

          {member.qr_code_url && (
            <div className="hidden sm:flex flex-col items-center gap-1">
              <img src={member.qr_code_url} alt="QR" className="w-20 h-20 rounded-xl border border-border" />
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Access QR</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-primary-50 text-primary-700 w-fit"><Activity className="w-4 h-4" /></div>
          <p className="stat-value mt-2">{statsData?.attendance_last_30_days ?? '0'}</p>
          <p className="stat-label">Check-ins (30d)</p>
        </div>
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-success/10 text-success w-fit"><CreditCard className="w-4 h-4" /></div>
          <p className="stat-value mt-2 truncate max-w-full text-lg">{activePlan?.plan?.name ?? 'No Plan'}</p>
          <p className="stat-label">Current Plan</p>
        </div>
        <div className="stat-card">
          <div className={cn('p-2 rounded-xl w-fit', daysLeft !== null && daysLeft < 7 ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-500')}><Clock className="w-4 h-4" /></div>
          <p className={cn('stat-value mt-2', daysLeft !== null && daysLeft < 0 ? 'text-danger' : '')}>
            {daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`) : '—'}
          </p>
          <p className="stat-label">Expiry Status</p>
        </div>
        <div className="stat-card">
          <div className="p-2 rounded-xl bg-accent/10 text-accent w-fit"><HeartPulse className="w-4 h-4" /></div>
          <p className="stat-value mt-2 capitalize">{member.fitness_goal?.replace(/_/g, ' ') || '—'}</p>
          <p className="stat-label">Goal</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-5 lg:col-span-1">
          <div className="card">
            <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-700" /> Personal Details
            </h3>
            <InfoRow label="ID" value={member.member_code} />
            <InfoRow label="Phone" value={member.user?.phone} />
            <InfoRow label="Email" value={member.user?.email} />
            <InfoRow label="Address" value={member.address} />
            <InfoRow label="Emergency" value={member.emergency_contact} />
          </div>

          <div className="card">
            <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-primary-700" /> Health Stats
            </h3>
            <InfoRow label="Height" value={member.height_cm ? `${member.height_cm} cm` : null} />
            <InfoRow label="Weight" value={member.weight_kg ? `${member.weight_kg} kg` : null} />
            <InfoRow label="Body Fat" value={member.body_fat_pct ? `${member.body_fat_pct}%` : null} />
            <InfoRow label="Conditions" value={member.medical_conditions} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Membership History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-700" /> Plan History & Payments
              </h3>
              <button onClick={() => setShowPlanModal(true)} className="btn-primary btn-xs">+ Assign Plan</button>
            </div>
            <div className="space-y-3">
              {member.member_plans?.length === 0 ? (
                <p className="text-center py-4 text-slate-400 text-sm italic">No plans assigned yet</p>
              ) : member.member_plans.map((mp: any) => {
                const totalDue = (mp.plan?.price || 0) - (mp.discount_applied || 0);
                const balance = totalDue - (mp.amount_paid || 0);
                
                return (
                  <div key={mp.id} className={cn('p-4 rounded-xl border', mp.status === 'active' ? 'border-success/30 bg-success/5' : 'border-slate-200 bg-slate-50')}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">{mp.plan?.name}</p>
                          <span className={cn('badge text-[9px]', mp.status === 'active' ? 'badge-active' : 'badge-archived')}>{mp.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(mp.start_date)} → {formatDate(mp.end_date)}</p>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-slate-500">Paid:</span>
                          <span className="text-sm font-bold text-slate-800">{formatCurrency(mp.amount_paid)}</span>
                        </div>
                        {balance > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] text-rose-500 font-bold uppercase">Balance Due:</span>
                            <span className="text-sm font-black text-rose-600">{formatCurrency(balance)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {balance > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-end">
                        <button 
                          onClick={() => {
                            setSelectedPlanForPayment(mp);
                            setPaymentAmount(balance.toString());
                            setShowPaymentModal(true);
                          }}
                          className="btn-outline btn-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <IndianRupee className="w-3 h-3" /> Record Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance History */}
          <div className="card">
            <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-700" /> Recent Attendance
            </h3>
            <div className="space-y-2">
              {member.attendance?.length === 0 ? (
                <p className="text-center py-4 text-slate-400 text-sm italic">No attendance records</p>
              ) : member.attendance.slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm text-slate-700">{formatDateTime(a.checked_in_at)}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.method}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800">Assign New Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="btn-icon btn-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Select Plan</label>
                <select 
                  className="input" 
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value)
                    const plan = plansData?.find((p: any) => p.id === e.target.value)
                    if (plan) setAmountPaid(plan.price.toString())
                  }}
                >
                  <option value="">Choose plan...</option>
                  {plansData?.map((p: any) => <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Start Date</label>
                  <input type="date" className="input text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Paid (₹)</label>
                  <input type="number" className="input text-xs" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Discount (₹)</label>
                <input type="number" className="input text-xs" value={discountApplied} onChange={(e) => setDiscountApplied(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="btn-outline flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => assignPlan.mutate({
                    member_id: id, plan_id: selectedPlanId, start_date: startDate,
                    amount_paid: parseFloat(amountPaid), discount_applied: parseFloat(discountApplied),
                  })}
                  disabled={!selectedPlanId || !amountPaid || assignPlan.isPending}
                  className="btn-primary flex-1 py-3"
                >
                  {assignPlan.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Assign Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-slate-800">Record Balance Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="btn-icon btn-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">Target Plan</p>
                <p className="text-sm font-bold text-slate-800">{selectedPlanForPayment?.plan?.name}</p>
                <p className="text-xs text-slate-500 mt-1">Total Due: {formatCurrency((selectedPlanForPayment?.plan?.price || 0) - (selectedPlanForPayment?.discount_applied || 0))}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  className="input font-bold text-lg text-primary-700" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Payment Method</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-outline flex-1 py-3"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => recordPayment.mutate({
                    member_id: id,
                    member_plan_id: selectedPlanForPayment.id,
                    amount: parseFloat(paymentAmount),
                    method: paymentMethod
                  })}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || recordPayment.isPending}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {recordPayment.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Payment</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fee Details Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary-700 text-white">
              <div>
                <h3 className="font-display font-bold text-lg">Fee Summary</h3>
                <p className="text-xs text-white/70">Payment status for {member.user?.name}</p>
              </div>
              <button onClick={() => setShowFeeModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {!activePlan ? (
                <div className="text-center py-6 text-slate-500">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No active plan found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-slate-500 text-sm">
                      <span>Plan Price ({activePlan.plan?.name})</span>
                      <span className="font-bold text-slate-800">{formatCurrency(activePlan.plan?.price || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-sm">
                      <span>Discount Applied</span>
                      <span className="font-bold text-rose-500">- {formatCurrency(activePlan.discount_applied || 0)}</span>
                    </div>
                    <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-700">Net Payable</span>
                      <span className="text-xl font-black text-slate-900">{formatCurrency((activePlan.plan?.price || 0) - (activePlan.discount_applied || 0))}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Paid</span>
                      <span className="text-lg font-black text-emerald-600">{formatCurrency(activePlan.amount_paid || 0)}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(((activePlan.amount_paid || 0) / ((activePlan.plan?.price || 1) - (activePlan.discount_applied || 0))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {((activePlan.plan?.price || 0) - (activePlan.discount_applied || 0) - (activePlan.amount_paid || 0)) > 0 ? (
                    <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Remaining Balance</span>
                        <span className="text-2xl font-black text-rose-700">
                          {formatCurrency((activePlan.plan?.price || 0) - (activePlan.discount_applied || 0) - (activePlan.amount_paid || 0))}
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-400 mt-2 font-medium">Please collect the balance as soon as possible.</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="text-sm font-bold uppercase tracking-wide">Fully Paid</p>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setShowFeeModal(false);
                      const balance = (activePlan.plan?.price || 0) - (activePlan.discount_applied || 0) - (activePlan.amount_paid || 0);
                      if (balance > 0) {
                        setSelectedPlanForPayment(activePlan);
                        setPaymentAmount(balance.toString());
                        setShowPaymentModal(true);
                      }
                    }}
                    className="btn-primary w-full py-4 text-sm font-bold shadow-glow"
                  >
                    {((activePlan.plan?.price || 0) - (activePlan.discount_applied || 0) - (activePlan.amount_paid || 0)) > 0 
                      ? 'Record Balance Payment' 
                      : 'Close Summary'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
