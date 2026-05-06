import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save, Loader2, User, HeartPulse } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid 10-digit phone number'),
  dob: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergency_contact: z.string().optional().or(z.literal('')),
  trainer_id: z.string().optional().or(z.literal('')),
  height_cm: z.coerce.number().positive().optional().or(z.literal('')),
  weight_kg: z.coerce.number().positive().optional().or(z.literal('')),
  body_fat_pct: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  medical_conditions: z.string().optional().or(z.literal('')),
  fitness_goal: z.string().optional().or(z.literal('')),
  activity_level: z.string().optional().or(z.literal('')),
  dietary_preference: z.string().optional().or(z.literal('')),
  fitness_experience: z.string().optional().or(z.literal('')),
})

type EditForm = z.infer<typeof editSchema>

export default function EditMemberPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: member, isLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: () => api.get(`/members/${id}`).then(r => r.data.data),
  })

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.user?.name || '',
        email: member.user?.email || '',
        phone: member.user?.phone || '',
        dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
        address: member.address || '',
        emergency_contact: member.emergency_contact || '',
        trainer_id: member.trainer_id || '',
        height_cm: member.height_cm || '',
        weight_kg: member.weight_kg || '',
        body_fat_pct: member.body_fat_pct || '',
        medical_conditions: member.medical_conditions || '',
        fitness_goal: member.fitness_goal || '',
        activity_level: member.activity_level || '',
        dietary_preference: member.dietary_preference || '',
        fitness_experience: member.fitness_experience || '',
      })
    }
  }, [member, form])

  const updateMember = useMutation({
    mutationFn: (data: EditForm) => api.put(`/members/${id}`, data),
    onSuccess: () => {
      toast.success('Profile updated successfully! ✨')
      queryClient.invalidateQueries({ queryKey: ['members', id] })
      navigate(`/members/${id}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/members/${id}`} className="btn-icon bg-white border border-border shadow-sm">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Edit Profile</h1>
          <p className="text-slate-500 text-sm">{member?.user?.name} — {member?.member_code}</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((data) => updateMember.mutate(data))} className="space-y-6">
        {/* Personal Details */}
        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-700" /> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Full Name</label>
              <input {...form.register('name')} className="input" placeholder="e.g. John Doe" />
              {form.formState.errors.name && <p className="text-[10px] text-danger">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <input {...form.register('email')} className="input" placeholder="john@example.com" />
              {form.formState.errors.email && <p className="text-[10px] text-danger">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Phone Number</label>
              <input {...form.register('phone')} className="input" placeholder="10-digit number" />
              {form.formState.errors.phone && <p className="text-[10px] text-danger">{form.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
              <input {...form.register('dob')} type="date" className="input" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Address</label>
              <textarea {...form.register('address')} className="input min-h-[80px]" placeholder="Home address..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Emergency Contact</label>
              <input {...form.register('emergency_contact')} className="input" placeholder="Name / Relation / Phone" />
            </div>
          </div>
        </div>

        {/* Health & Fitness */}
        <div className="card">
          <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-primary-700" /> Health & Fitness
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Height (cm)</label>
              <input {...form.register('height_cm')} type="number" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Weight (kg)</label>
              <input {...form.register('weight_kg')} type="number" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Body Fat (%)</label>
              <input {...form.register('body_fat_pct')} type="number" step="0.1" className="input" />
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Medical Conditions</label>
              <textarea {...form.register('medical_conditions')} className="input min-h-[60px]" placeholder="Any injuries or health issues..." />
            </div>
            <div className="sm:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Fitness Goal</label>
                <select {...form.register('fitness_goal')} className="input">
                  <option value="">Select goal</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="general_fitness">General Fitness</option>
                  <option value="athletic_performance">Athletic Performance</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Activity Level</label>
                <select {...form.register('activity_level')} className="input">
                  <option value="">Select level</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to={`/members/${id}`} className="btn-outline">Cancel</Link>
          <button 
            type="submit" 
            disabled={updateMember.isPending} 
            className="btn-primary min-w-[120px]"
          >
            {updateMember.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
