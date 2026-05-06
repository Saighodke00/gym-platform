import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data)
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🎉`)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please try again.'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-modal mb-4 animate-pulse-glow">
            <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">GDK</h1>
          <p className="text-primary-200 text-sm mt-1">Gym Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-modal">
          <h2 className="text-xl font-display font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-primary-200 text-sm mb-6">Sign in to your gym dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label text-primary-100">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@gdkgym.com"
                autoComplete="email"
                className={cn(
                  'w-full rounded-lg border bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-primary-300',
                  'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors',
                  errors.email ? 'border-red-400' : 'border-white/20'
                )}
              />
              {errors.email && <p className="error-text text-red-300 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label text-primary-100">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full rounded-lg border bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder:text-primary-300 pr-10',
                    'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors',
                    errors.password ? 'border-red-400' : 'border-white/20'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-text text-red-300 mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn bg-white text-primary-700 font-semibold hover:bg-primary-50 active:scale-[0.98] py-2.5 mt-2 shadow-md"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-primary-200 font-medium mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs text-primary-300">
              <p>👑 Admin: <span className="text-white">admin@gdkgym.com</span> / <span className="text-white">Admin@GDK123</span></p>
              <p>🏋️ Trainer: <span className="text-white">trainer@gdkgym.com</span> / <span className="text-white">Trainer@GDK123</span></p>
            </div>
          </div>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          © 2026 GDK Gym Platform. Built for Indian gym owners.
        </p>
      </div>
    </div>
  )
}
