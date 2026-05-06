import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Monitor, RefreshCw, Smartphone, Zap } from 'lucide-react'

export default function KioskQR() {
  const [port] = useState(window.location.port || '5173')
  const [qrUrl, setQrUrl] = useState(`http://${window.location.hostname}:${window.location.port || '5173'}/checkin`)

  useEffect(() => {
    // 1. Try Electron IPC (most reliable in desktop app)
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron')
        ipcRenderer.send('get-local-ip')
        ipcRenderer.on('local-ip', (_event: any, ip: string) => {
          if (ip && ip !== '127.0.0.1') setQrUrl(`http://${ip}:${port}/checkin`)
        })
      } catch (e) {
        console.warn('Electron IPC not available', e)
      }
    }

    // 2. Fallback: Ask the backend for its local network IP OR Public URL
    fetch('/api/v1/system/local-ip')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          if (res.data.public_url) {
            // Priority: Use the tunnel/public URL if available
            setQrUrl(`${res.data.public_url}/checkin`)
          } else if (res.data.ip && res.data.ip !== '127.0.0.1') {
            // Secondary: Use the local network IP
            setQrUrl(`http://${res.data.ip}:${port}/checkin`)
          }
        }
      })
      .catch(err => console.error('Failed to fetch system info from backend:', err))
  }, [])

  const checkinUrl = qrUrl

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-elevated border border-border max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center mb-6 shadow-glow">
        <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
      </div>
      
      <h2 className="text-2xl font-display font-bold text-slate-800 text-center mb-2">Member Check-in</h2>
      <p className="text-slate-500 text-center mb-8 text-sm px-4">
        Scan this QR code with Google Lens or your phone camera to mark your attendance.
      </p>

      <div className="p-6 bg-white rounded-2xl border-2 border-primary-100 mb-8 relative group">
        <QRCodeSVG 
          value={checkinUrl} 
          size={240}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "/gdk-logo.svg",
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-xl">
           <RefreshCw className="w-8 h-8 text-primary-700 animate-spin" />
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <Smartphone className="w-5 h-5 text-primary-700" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Mobile Web Access</p>
            <p className="text-[10px] text-slate-500 font-mono">{checkinUrl}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${checkinUrl.includes('trycloudflare.com') ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${checkinUrl.includes('trycloudflare.com') ? 'bg-green-500' : 'bg-amber-500'}`} />
          <div className="flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${checkinUrl.includes('trycloudflare.com') ? 'text-green-900' : 'text-amber-900'}`}>
              {checkinUrl.includes('trycloudflare.com') ? 'Internet Mode' : 'Local WiFi Mode'}
            </p>
            <p className={`text-[10px] ${checkinUrl.includes('trycloudflare.com') ? 'text-green-700' : 'text-amber-700'}`}>
              {checkinUrl.includes('trycloudflare.com') ? 'Accessible via Mobile Data' : 'Connect to same WiFi to scan'}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
        GDK Gym Management · Local Node
      </p>
    </div>
  )
}
