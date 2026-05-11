import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, Zap, Smartphone, User } from 'lucide-react'
import axios from 'axios'
import { cn } from '@/lib/utils'
import { triggerHaptic, scheduleLocalNotification } from '@/lib/mobile'
import { ImpactStyle } from '@capacitor/haptics'

type CheckinStatus = 'idle' | 'loading' | 'success' | 'error' | 'expired'

export default function MemberCheckin() {
  const [status, setStatus] = useState<CheckinStatus>('idle')
  const [memberCode, setMemberCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isAutoCheckin, setIsAutoCheckin] = useState(false)


  const handleCheckin = async (code: string) => {
    if (!code) return
    setStatus('loading')
    try {
      // Stripping potential GDK: prefix
      const cleanCode = code.replace('GDK:', '').trim()
      const res = await axios.post('/api/v1/attendance/public-checkin', { 
        member_code: cleanCode 
      }, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      const data = res.data.data
      setResult(data)
      
      // Save for next time (One-time login)
      localStorage.setItem('gdk_member_code', cleanCode)
      
      if (data.status === 'already_checked_in') {
        setStatus('success') // Still show success-ish UI but with the warning message
        triggerHaptic(ImpactStyle.Medium)
      } else {
        setStatus('success')
        triggerHaptic(ImpactStyle.Heavy)
        scheduleLocalNotification(
          'GDK Gym Check-in',
          `Successfully checked in as ${data.member?.name}!`,
          0
        )
      }
    } catch (err: any) {
      const errorStatus = err.response?.data?.data?.status
      if (errorStatus === 'expired') {
        setStatus('expired')
      } else {
        setStatus('error')
      }
      setResult(err.response?.data?.data || { message: 'Something went wrong' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCheckin(memberCode)
  }

  useEffect(() => {
    // Check if member code is saved in local storage (One-time login)
    const savedCode = localStorage.getItem('gdk_member_code')
    if (savedCode) {
      setMemberCode(savedCode)
      setIsAutoCheckin(true)
      handleCheckin(savedCode)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">GDK Gym</h1>
          <p className="text-slate-500 text-sm mt-1">Smart Attendance System</p>
        </div>

        {/* Status Card */}
        <div className={cn(
          "bg-white rounded-3xl p-8 shadow-card border-2 transition-all duration-500",
          status === 'success' ? 'border-success' : 
          status === 'error' || status === 'expired' ? 'border-danger' : 
          'border-transparent'
        )}>
          {status === 'idle' && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 text-primary-700 mb-6 bg-primary-50 p-3 rounded-xl">
                <Smartphone className="w-5 h-5" />
                <p className="text-xs font-semibold uppercase tracking-wider">Member Verification</p>
              </div>
              <p className="text-slate-600 mb-6 text-sm">Please enter your Member ID to mark your attendance for today.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                    placeholder="GDK-2026-XXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20 text-sm font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-primary-700/20 flex items-center justify-center gap-2"
                >
                  Confirm Attendance
                </button>
              </form>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
              <Loader2 className="w-12 h-12 text-primary-700 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">
                {isAutoCheckin ? 'Checking you in...' : 'Verifying membership...'}
              </p>
              {isAutoCheckin && (
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-bold">Logged in as {memberCode}</p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="text-center animate-slide-up">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 mb-2">
                {result?.status === 'already_checked_in' ? 'Already Checked In' : 'Check-in Successful!'}
              </h2>
              <p className="text-slate-600 font-medium mb-1">{result?.member?.name}</p>
              <p className="text-xs text-slate-400 mb-6">{result?.message}</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Membership Plan</p>
                <p className="text-sm font-semibold text-slate-800">{result?.member?.plan_name}</p>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={() => setStatus('idle')}
                  className="text-sm font-bold text-primary-700 hover:underline"
                >
                  Mark another?
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('gdk_member_code')
                    setMemberCode('')
                    setStatus('idle')
                  }}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-danger"
                >
                  Logout / Switch Account
                </button>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="text-center animate-slide-up">
              <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-danger" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 mb-2">
                {status === 'expired' ? 'Membership Expired' : 'Check-in Failed'}
              </h2>
              <p className="text-slate-600 text-sm px-4 mb-6">{result?.message || 'We could not verify your membership.'}</p>

              <button 
                onClick={() => setStatus('idle')}
                className="w-full btn-outline py-3 rounded-xl text-sm font-bold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] mt-10">
          Powered by GDK Management
        </p>
      </div>
    </div>
  )
}
