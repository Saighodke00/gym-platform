import { Link } from 'react-router-dom'
import { ChevronLeft, Maximize, Settings } from 'lucide-react'
import KioskQR from '@/components/attendance/KioskQR'

export default function KioskPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Kiosk Header */}
      <div className="absolute top-6 left-6 flex items-center gap-4">
        <Link to="/attendance" className="btn-ghost text-slate-400 hover:text-white btn-sm">
          <ChevronLeft className="w-4 h-4" /> Exit Kiosk
        </Link>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2">
         <button className="btn-ghost text-slate-500 hover:text-white btn-sm" title="Settings">
            <Settings className="w-4 h-4" />
         </button>
         <button className="btn-ghost text-slate-500 hover:text-white btn-sm" title="Toggle Fullscreen" onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
         }}>
            <Maximize className="w-4 h-4" />
         </button>
      </div>

      <div className="animate-fade-in">
        <KioskQR />
      </div>

      {/* Real-time Status */}
      <div className="absolute bottom-10 flex flex-col items-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Kiosk Active & Online</p>
        </div>
        <p className="mt-4 text-slate-500 text-[10px]">Please scan the QR code to mark attendance. Contact staff for help.</p>
      </div>
    </div>
  )
}
