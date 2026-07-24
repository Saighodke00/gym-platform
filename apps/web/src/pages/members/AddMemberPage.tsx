import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, User, HeartPulse, CreditCard, Loader2, Check, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'

const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid 10-digit phone number'),
  dob: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  trainer_id: z.string().optional(),
})

const step2Schema = z.object({
  height_cm: z.coerce.number().positive().optional().or(z.literal('')),
  weight_kg: z.coerce.number().positive().optional().or(z.literal('')),
  body_fat_pct: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  medical_conditions: z.string().optional(),
  fitness_goal: z.string().optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active', '']).optional(),
  dietary_preference: z.string().optional(),
  fitness_experience: z.enum(['beginner', 'intermediate', 'advanced', '']).optional(),
})

type Step1Form = z.infer<typeof step1Schema>
type Step2Form = z.infer<typeof step2Schema>

const steps = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Health & Fitness', icon: HeartPulse },
  { id: 3, label: 'Membership Plan', icon: CreditCard },
]

export default function AddMemberPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Form | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [amountPaid, setAmountPaid] = useState('')
  const [discountApplied, setDiscountApplied] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [fullPayment, setFullPayment] = useState(true)
  const navigate = useNavigate()

  const { data: trainersData } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => api.get('/members', { params: { role: 'trainer' } }).then(r => r.data.data),
  })

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.data),
  })

  const form1 = useForm<Step1Form>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Form>({ resolver: zodResolver(step2Schema) })

  const createMember = useMutation({
    mutationFn: async (memberData: any) => {
      // Step 1: create member
      const memberRes = await api.post('/members', memberData)
      const memberId = memberRes.data.data.id

      // Step 2: assign plan if selected
      if (selectedPlanId && amountPaid) {
        await api.post('/plans/assign', {
          member_id: memberId,
          plan_id: selectedPlanId,
          start_date: startDate,
          amount_paid: parseFloat(amountPaid),
          discount_applied: parseFloat(discountApplied || '0'),
          payment_method: paymentMethod
        })
      }

      return memberRes.data.data
    },
    onSuccess: (member) => {
      toast.success(`${member.user?.name ?? 'Member'} added successfully! 🎉`)
      navigate(`/members/${member.id}`)
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.error?.message || 'Failed to add member'
      const details = err.response?.data?.error?.details
      
      if (details && Array.isArray(details)) {
        toast.error(`${errorMsg}: ${details.map((d: any) => d.message).join(', ')}`)
      } else {
        toast.error(errorMsg)
      }
    },
  })

  const handleStep1 = form1.handleSubmit((data) => {
    setStep1Data(data)
    setCurrentStep(2)
  })

  const handleStep2 = form2.handleSubmit((data) => {
    setStep2Data(data)
    setCurrentStep(3)
  })

  const handleFinish = () => {
    if (!step1Data) return
    const payload: any = { ...step1Data, ...step2Data }

    // Clean up empty strings and nulls to avoid backend validation errors
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key]
      }
    })

    // Specifically handle trainer_id if it's an empty string
    if (payload.trainer_id === '') delete payload.trainer_id

    createMember.mutate(payload)
  }

  const selectedPlan = plansData?.find((p: any) => p.id === selectedPlanId)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/members')} className="btn-ghost btn-sm mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to Members
        </button>
        <h1 className="page-title">Add New Member</h1>
        <p className="page-subtitle">Fill in the member details to onboard them to GDK</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                currentStep > step.id
                  ? 'bg-success border-success text-white'
                  : currentStep === step.id
                    ? 'bg-primary-700 border-primary-700 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
              )}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                currentStep === step.id ? 'text-primary-700' : currentStep > step.id ? 'text-success' : 'text-slate-400'
              )}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 transition-colors', currentStep > step.id ? 'bg-success' : 'bg-slate-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Personal Info */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1} className="card space-y-4 animate-slide-up">
          <h2 className="font-display font-semibold text-slate-800">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...form1.register('name')} className={cn('input', form1.formState.errors.name && 'input-error')} placeholder="e.g. Priya Sharma" />
              {form1.formState.errors.name && <p className="error-text">{form1.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input {...form1.register('phone')} className={cn('input', form1.formState.errors.phone && 'input-error')} placeholder="9876543210" />
              {form1.formState.errors.phone && <p className="error-text">{form1.formState.errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input {...form1.register('email')} type="email" className={cn('input', form1.formState.errors.email && 'input-error')} placeholder="priya@gmail.com" />
              {form1.formState.errors.email && <p className="error-text">{form1.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input {...form1.register('dob')} type="date" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <textarea {...form1.register('address')} className="input resize-none h-16" placeholder="123 MG Road, Bangalore..." />
            </div>
            <div>
              <label className="label">Emergency Contact</label>
              <input {...form1.register('emergency_contact')} className="input" placeholder="Name & phone" />
            </div>
            <div>
              <label className="label">Assign Trainer</label>
              <select {...form1.register('trainer_id')} className="input">
                <option value="">No trainer assigned</option>
                {(trainersData ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => navigate('/members')} className="btn-outline text-slate-500">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Next: Health Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Health & Fitness */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2} className="card space-y-4 animate-slide-up">
          <h2 className="font-display font-semibold text-slate-800">Health & Fitness Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Height (cm)</label>
              <input {...form2.register('height_cm')} type="number" className="input" placeholder="170" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input {...form2.register('weight_kg')} type="number" className="input" placeholder="70" />
            </div>
            <div>
              <label className="label">Body Fat %</label>
              <input {...form2.register('body_fat_pct')} type="number" className="input" placeholder="20" />
            </div>
            <div>
              <label className="label">Fitness Goal</label>
              <select {...form2.register('fitness_goal')} className="input">
                <option value="">Select goal</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_building">Muscle Building</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>
            <div>
              <label className="label">Activity Level</label>
              <select {...form2.register('activity_level')} className="input">
                <option value="">Select level</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very Active</option>
              </select>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select {...form2.register('fitness_experience')} className="input">
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="label">Dietary Preference</label>
              <select {...form2.register('dietary_preference')} className="input">
                <option value="">Select preference</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Medical Conditions / Notes</label>
              <textarea {...form2.register('medical_conditions')} className="input resize-none h-16" placeholder="Any injuries, allergies, or health conditions..." />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setCurrentStep(1)} className="btn-outline">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" className="btn-primary">
              Next: Membership Plan <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — Plan Assignment */}
      {currentStep === 3 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="font-display font-semibold text-slate-800">Assign Membership Plan</h2>
          <p className="text-sm text-slate-500">Optional — you can assign a plan later from the member profile.</p>

          <div className="grid grid-cols-1 gap-3">
            {(plansData ?? []).filter((p: any) => p.is_active).map((plan: any) => (
              <label
                key={plan.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedPlanId === plan.id
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-border hover:border-primary-300 bg-white'
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlanId === plan.id}
                  onChange={() => {
                    setSelectedPlanId(plan.id)
                    setAmountPaid(String(plan.price))
                  }}
                  className="accent-primary-700"
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{plan.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {plan.duration_days} days · {
                      typeof plan.features === 'string'
                        ? JSON.parse(plan.features).join(' · ')
                        : (plan.features as string[]).join(' · ')
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-700">₹{plan.price.toLocaleString('en-IN')}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedPlan && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg w-fit">
                <input 
                  type="checkbox" 
                  id="full_payment" 
                  checked={fullPayment} 
                  onChange={(e) => {
                    setFullPayment(e.target.checked)
                    if (e.target.checked) {
                      setAmountPaid(String(selectedPlan.price - parseFloat(discountApplied || '0')))
                    }
                  }}
                  className="accent-primary-700"
                />
                <label htmlFor="full_payment" className="text-xs font-bold text-primary-700 cursor-pointer">Full Payment Received</label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input text-sm" />
                </div>
                <div>
                  <label className="label">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={discountApplied} 
                    onChange={e => {
                      const disc = e.target.value
                      setDiscountApplied(disc)
                      if (fullPayment) {
                        setAmountPaid(String(selectedPlan.price - parseFloat(disc || '0')))
                      }
                    }} 
                    className="input text-sm" 
                  />
                </div>
                <div>
                  <label className="label">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    value={amountPaid} 
                    disabled={fullPayment}
                    onChange={e => setAmountPaid(e.target.value)} 
                    className={cn('input text-sm font-bold', fullPayment ? 'bg-slate-50 text-slate-500' : 'text-primary-700')} 
                  />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input text-sm">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              
              {!fullPayment && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-xs font-bold text-rose-600">Balance Due: {formatCurrency((selectedPlan.price - parseFloat(discountApplied || '0')) - parseFloat(amountPaid || '0'))}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setCurrentStep(2)} className="btn-outline">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={handleFinish} disabled={createMember.isPending} className="btn-outline">
                {createMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Skip Plan & Save
              </button>
              {selectedPlanId && (
                <button type="button" onClick={handleFinish} disabled={createMember.isPending} className="btn-primary">
                  {createMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Add Member & Assign Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
