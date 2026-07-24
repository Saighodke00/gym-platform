import { useState, useEffect, useRef } from 'react'
import { Camera, Scale, Plus, ImageIcon, Upload, X } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function MemberProgressPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const res = await api.get('/members/me/profile')
      setLogs(res.data.data.progress_logs || [])
    } catch (err) {
      toast.error('Failed to load progress logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight && !photoPreview) {
      toast.error('Please enter your weight or upload a photo')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        weight_kg: weight,
        notes: notes,
        photos: photoPreview ? [photoPreview] : []
      }

      await api.post('/members/me/progress', payload)
      toast.success('Progress saved successfully! 🎉')
      setShowModal(false)
      setWeight('')
      setNotes('')
      setPhotoPreview(null)
      fetchProgress()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save progress')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 pb-24 md:pb-8 relative">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Progress Tracking
          </h1>
          <p className="text-slate-500 mt-1">Track your fitness journey</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary shadow-glow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Log Progress</span>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="card border-0 shadow-card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Start Your Journey</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Log your current weight and take a starting photo. Watching your progress over time is the best motivation!
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log: any) => {
            const photos = JSON.parse(log.photos || '[]')
            const hasPhoto = photos.length > 0

            return (
              <div key={log.id} className="card border-0 shadow-card overflow-hidden p-0 group">
                <div className="p-4 border-b border-border bg-white flex justify-between items-center">
                  <p className="font-semibold text-slate-900">{format(new Date(log.logged_at), 'MMMM d, yyyy')}</p>
                </div>
                
                {hasPhoto ? (
                  <div className="aspect-[4/5] bg-slate-100 relative">
                    <img src={photos[0]} alt="Progress" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/5] bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                    <p className="text-xs uppercase tracking-wider font-semibold">No Photo Uploaded</p>
                  </div>
                )}

                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-primary-700 font-bold bg-primary-50 px-3 py-1.5 rounded-lg">
                      <Scale className="w-4 h-4" />
                      {log.weight_kg ? `${log.weight_kg} kg` : '--'}
                    </div>
                  </div>
                  {log.notes && (
                    <p className="text-sm text-slate-600 italic">"{log.notes}"</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button 
          onClick={() => setShowModal(true)}
          className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-elevated active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-elevated relative animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg text-slate-900">Log Progress</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Photo Upload Area */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Progress Photo</p>
                <div 
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden ${photoPreview ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: photoPreview ? 'auto' : '200px' }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full object-cover max-h-[300px]" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-600">Tap to upload a photo</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>

              {/* Weight Input */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Current Weight (kg)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Scale className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 75.5"
                    className="input pl-10"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Notes / How do you feel?</label>
                <textarea
                  placeholder="Feeling stronger!"
                  className="input min-h-[80px] resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Saving...' : 'Save Progress Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
