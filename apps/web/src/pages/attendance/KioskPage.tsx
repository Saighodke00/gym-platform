import { Link } from 'react-router-dom'
import { ChevronLeft, Maximize, Settings } from 'lucide-react'
import KioskQR from '@/components/attendance/KioskQR'

export default function KioskPage() {
  return (
    <div className="min-h-screen bg-slate-900 print:bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Kiosk Header */}
      <div className="absolute top-6 left-6 flex items-center gap-4 print:hidden">
        <Link to="/attendance" className="btn-ghost text-slate-400 hover:text-white btn-sm">
          <ChevronLeft className="w-4 h-4" /> Exit Kiosk
        </Link>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2 print:hidden">
         <button className="btn-ghost text-slate-500 hover:text-white btn-sm" title="Print Desk Poster" onClick={() => window.print()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
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
      <div className="absolute bottom-10 flex flex-col items-center print:hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Kiosk Active & Online</p>
        </div>
        <p className="mt-4 text-slate-500 text-[10px]">Please scan the QR code to mark attendance. Contact staff for help.</p>
      </div>
    </div>
  )
}
