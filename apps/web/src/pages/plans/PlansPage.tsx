import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, X, ToggleLeft, ToggleRight, Users, IndianRupee, Edit2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'

const planSchema = z.object({
  name: z.string().min(2, 'Plan name required'),
  description: z.string().optional(),
  duration_days: z.coerce.number().int().positive('Duration must be a positive number'),
  price: z.coerce.number().positive('Price must be positive'),
  gst_rate: z.coerce.number().min(0).max(28).default(18),
  gst_inclusive: z.boolean().default(false),
  freeze_days_allowed: z.coerce.number().int().min(0).default(0),
  features: z.string().optional(),
})

type PlanForm = z.infer<typeof planSchema>

const durationPresets = [
  { label: 'Monthly', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: 'Annual', days: 365 },
]

function PlanCard({ plan, onToggle }: { plan: any; onToggle: (id: string, active: boolean) => void }) {
  const features = Array.isArray(plan.features) ? plan.features : []
  const gstAmount = plan.gst_inclusive ? 0 : (plan.price * plan.gst_rate) / 100
  const total = plan.price + gstAmount

  return (
    <div className={cn(
      'card relative overflow-hidden transition-all duration-200',
      !plan.is_active && 'opacity-60 grayscale-[30%]'
    )}>
      {!plan.is_active && (
        <div className="absolute top-3 right-3">
          <span className="badge badge-archived">Inactive</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-lg">{plan.name}</h3>
          {plan.description && <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-display font-bold text-primary-700">
          {formatCurrency(plan.price)}
        </span>
        <span className="text-xs text-slate-400">+GST</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Total: {formatCurrency(total)} · {plan.duration_days} days
      </p>

      {features.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {features.map((f: string, i: number) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
              <Check className="w-3.5 h-3.5 text-success flex-shrink-0" /> {f}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {plan._count?.member_plans ?? 0} active</span>
          {plan.freeze_days_allowed > 0 && <span>Freeze: {plan.freeze_days_allowed}d/yr</span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost btn-sm p-1.5">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle(plan.id, plan.is_active)}
            className={cn('btn btn-sm gap-1', plan.is_active ? 'text-slate-500 hover:text-danger' : 'text-slate-400 hover:text-success')}
            title={plan.is_active ? 'Deactivate plan' : 'Activate plan'}
          >
            {plan.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
            {plan.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(30)
  const queryClient = useQueryClient()

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data.data),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: { gst_rate: 18, gst_inclusive: false, freeze_days_allowed: 0 },
  })

  const createPlan = useMutation({
    mutationFn: (data: any) => api.post('/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan created successfully!')
      setShowForm(false)
      reset()
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed to create plan'),
  })

  const togglePlan = useMutation({
    mutationFn: (id: string) => api.patch(`/plans/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  const onSubmit = (data: PlanForm) => {
    const features = data.features?.split('\n').map(f => f.trim()).filter(Boolean) ?? []
    createPlan.mutate({ ...data, features, duration_days: selectedDuration })
  }

  const activePlans = (plans ?? []).filter((p: any) => p.is_active)
  const inactivePlans = (plans ?? []).filter((p: any) => !p.is_active)
  const totalRevenue = (plans ?? []).reduce((sum: number, p: any) => sum + (p.price * (p._count?.member_plans ?? 0)), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Membership Plans</h1>
          <p className="page-subtitle">{activePlans.length} active plans · {(plans ?? []).length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card"><p className="stat-value">{(plans ?? []).length}</p><p className="stat-label">Total Plans</p></div>
        <div className="stat-card"><p className="stat-value">{activePlans.length}</p><p className="stat-label">Active Plans</p></div>
        <div className="stat-card">
          <p className="stat-value">{(plans ?? []).reduce((s: number, p: any) => s + (p._count?.member_plans ?? 0), 0)}</p>
          <p className="stat-label">Total Enrolled</p>
        </div>
        <div className="stat-card">
          <p className="stat-value text-lg">{formatCurrency(totalRevenue)}</p>
          <p className="stat-label">Expected Revenue</p>
        </div>
      </div>

      {/* Create Plan Form */}
      {showForm && (
        <div className="card border-2 border-primary-200 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800">Create New Plan</h3>
            <button onClick={() => { setShowForm(false); reset() }} className="btn-ghost btn-sm p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Plan Name *</label>
                <input {...register('name')} className={cn('input', errors.name && 'input-error')} placeholder="e.g. Monthly Basic" />
                {errors.name && <p className="error-text">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Price (₹) *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input {...register('price')} type="number" className={cn('input pl-8', errors.price && 'input-error')} placeholder="1500" />
                </div>
                {errors.price && <p className="error-text">{errors.price.message}</p>}
              </div>
              <div>
                <label className="label">Duration *</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {durationPresets.map(p => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => { setSelectedDuration(p.days); setValue('duration_days', p.days) }}
                      className={cn('btn btn-sm', selectedDuration === p.days ? 'btn-primary' : 'btn-outline')}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={selectedDuration}
                  onChange={e => setSelectedDuration(parseInt(e.target.value))}
                  className="input"
                  placeholder="Custom days"
                />
              </div>
              <div>
                <label className="label">GST Rate (%)</label>
                <select {...register('gst_rate')} className="input">
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard)</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div>
                <label className="label">Freeze Days Allowed / Year</label>
                <input {...register('freeze_days_allowed')} type="number" className="input" placeholder="0" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input {...register('gst_inclusive')} type="checkbox" id="gst_inclusive" className="w-4 h-4 accent-primary-700" />
                <label htmlFor="gst_inclusive" className="text-sm text-slate-700 cursor-pointer">Price is GST-inclusive</label>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <input {...register('description')} className="input" placeholder="Brief description of the plan" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Features (one per line)</label>
                <textarea {...register('features')} className="input resize-none h-20" placeholder={"Gym Access\nTrainer Sessions (4/month)\nLocker Room"} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" onClick={() => { setShowForm(false); reset() }} className="btn-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-xl" />)}
        </div>
      ) : (plans ?? []).length === 0 ? (
        <div className="card text-center py-16">
          <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">No plans created yet</h3>
          <p className="text-sm text-slate-400 mb-4">Create your first membership plan to start enrolling members</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create First Plan
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlans.map((p: any) => (
              <PlanCard key={p.id} plan={p} onToggle={(id) => togglePlan.mutate(id)} />
            ))}
          </div>
          {inactivePlans.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Inactive Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactivePlans.map((p: any) => (
                  <PlanCard key={p.id} plan={p} onToggle={(id) => togglePlan.mutate(id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
