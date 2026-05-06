import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, QrCode, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

type ScanResult = {
  status: 'success' | 'expired' | 'already_checked_in' | 'error'
  message: string
  member?: {
    name: string
    member_code: string
    plan_name?: string
    plan_expires?: string
  }
  checked_in_at?: string
  days_overdue?: number
}

export default function QrScannerPage() {
  const [memberCode, setMemberCode] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus the hidden input for USB QR scanner
    inputRef.current?.focus()
    // Reset result after 5 seconds
    if (result) {
      const t = setTimeout(() => {
        setResult(null)
        setMemberCode('')
        inputRef.current?.focus()
      }, 5000)
      return () => clearTimeout(t)
    }
  }, [result])

  const handleScan = async (code: string) => {
    if (!code.trim() || loading) return
    setLoading(true)
    try {
      // Strip GDK: prefix if present
      const cleanCode = code.replace('GDK:', '').trim()
      const res = await api.post('/attendance/qr-checkin', { member_code: cleanCode })
      setResult(res.data.data)
    } catch (err: any) {
      setResult({
        status: 'error',
        message: err.response?.data?.error?.message || 'Scan failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleScan(memberCode)
  }

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemberCode(e.target.value)
  }

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-success',
      border: 'border-success',
      text: 'text-success',
      title: 'Welcome! ✅',
    },
    expired: {
      icon: XCircle,
      bg: 'bg-danger',
      border: 'border-danger',
      text: 'text-danger',
      title: 'Membership Expired ❌',
    },
    already_checked_in: {
      icon: AlertCircle,
      bg: 'bg-warning',
      border: 'border-warning',
      text: 'text-warning',
      title: 'Already Checked In ℹ️',
    },
    error: {
      icon: XCircle,
      bg: 'bg-danger',
      border: 'border-danger',
      text: 'text-danger',
      title: 'Error',
    },
  }

  const config = result ? statusConfig[result.status] : null

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="absolute top-4 left-4">
        <Link to="/attendance" className="btn-ghost text-slate-400 hover:text-white btn-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse-glow">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">GDK Check-in</h1>
          <p className="text-slate-400 text-sm mt-1">Scan member QR code or enter member ID</p>
        </div>

        {/* Scanner Area */}
        <div className={cn(
          'rounded-2xl border-2 p-8 transition-all duration-500 mb-6',
          !result ? 'border-primary-600 bg-primary-900/30' :
          result.status === 'success' ? 'border-success bg-success/10' :
          result.status === 'expired' ? 'border-danger bg-danger/10' :
          result.status === 'already_checked_in' ? 'border-warning bg-warning/10' :
          'border-danger bg-danger/10'
        )}>
          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Verifying membership...</p>
            </div>
          ) : !result ? (
            <div className="text-center">
              {/* QR Scan Animation */}
              <div className="relative w-40 h-40 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-primary-500 rounded-xl" />
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
                {/* Scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary-400 top-1/2 -translate-y-1/2 animate-pulse" />
                <QrCode className="absolute inset-0 m-auto w-16 h-16 text-primary-500 opacity-30" />
              </div>
              <p className="text-slate-400 text-sm">Point QR code at camera or use USB scanner</p>
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              {config && (
                <>
                  <config.icon className={cn('w-16 h-16 mx-auto mb-3', config.text)} />
                  <h2 className={cn('text-xl font-display font-bold mb-1', config.text)}>{config.title}</h2>
                  {result.member && (
                    <p className="text-white text-lg font-semibold">{result.member.name}</p>
                  )}
                  <p className="text-slate-300 text-sm mt-2">{result.message}</p>
                  {result.member?.plan_name && result.status === 'success' && (
                    <div className="mt-3 px-4 py-2 bg-white/10 rounded-lg">
                      <p className="text-xs text-slate-400">Plan: <span className="text-white font-medium">{result.member.plan_name}</span></p>
                    </div>
                  )}
                  {result.days_overdue && (
                    <div className="mt-3 px-4 py-2 bg-danger/20 rounded-lg">
                      <p className="text-xs text-danger font-semibold">{result.days_overdue} days overdue — Please renew</p>
                    </div>
                  )}
                  <p className="text-slate-500 text-xs mt-4">Resetting in 5 seconds...</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={memberCode}
              onChange={handleManualInput}
              onKeyDown={handleKeyDown}
              placeholder="Enter Member ID (e.g. GDK-2026-0001)"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 text-sm font-mono"
            />
          </div>
          <button
            onClick={() => handleScan(memberCode)}
            disabled={loading || !memberCode.trim()}
            className="w-full btn bg-primary-700 text-white font-semibold py-3 hover:bg-primary-600 disabled:opacity-50 rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Manual Check-in
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          GDK Gym · Attendance Scanner · {new Date().toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  )
}
