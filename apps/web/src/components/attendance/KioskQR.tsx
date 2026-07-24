import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Monitor, RefreshCw, Smartphone, Zap } from 'lucide-react'

export default function KioskQR() {
  const [port] = useState(window.location.port || '5173')
  const [qrUrl, setQrUrl] = useState(`http://${window.location.hostname}:${window.location.port || '5173'}/checkin`)

  useEffect(() => {
    // 1. Primary: Always use the public Cloud URL so it works on Mobile Data
    const cloudUrl = 'https://sai-ban111-gym-app.hf.space'
    setQrUrl(`${cloudUrl}/checkin`)

    // 2. Secondary (Fallback): Try Electron IPC for local IP if cloud is unreachable
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron')
        ipcRenderer.send('get-local-ip')
        ipcRenderer.on('local-ip', (_event: any, ip: string) => {
          if (ip && ip !== '127.0.0.1' && qrUrl === 'http://localhost:5173/checkin') {
             setQrUrl(`http://${ip}:${port}/checkin`)
          }
        })
      } catch (e) {
        console.warn('Electron IPC not available', e)
      }
    }

    // 3. Fallback: Ask the backend for its local network IP OR Public URL
    fetch('/api/v1/system/local-ip')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          if (res.data.public_url && !res.data.public_url.includes('ngrok')) {
            setQrUrl(`${res.data.public_url}/checkin`)
          }
        }
      })
      .catch(err => console.error('Failed to fetch system info from backend:', err))
  }, [])

  const checkinUrl = qrUrl

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-elevated border border-border max-w-md mx-auto print:shadow-none print:border-none print:max-w-full print:w-[100vw] print:h-[100vh] print:p-0">
      <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center mb-6 shadow-glow print:hidden">
        <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
      </div>
      
      <h2 className="text-2xl font-display font-bold text-slate-800 text-center mb-2">Member Check-in</h2>
      <p className="text-slate-500 text-center mb-8 text-sm px-4">
        Scan this QR code with Google Lens or your phone camera to mark your attendance.
      </p>

      <div className="p-6 bg-white rounded-2xl border-2 border-primary-100 mb-8 relative group print:border-0 print:mb-2 print:scale-150 print:mt-12">
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

      <div className="flex flex-col gap-3 w-full print:hidden">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <Smartphone className="w-5 h-5 text-primary-700" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Mobile Web Access</p>
            <p className="text-[10px] text-slate-500 font-mono">{checkinUrl}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${checkinUrl.includes('hf.space') ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${checkinUrl.includes('hf.space') ? 'bg-green-500' : 'bg-amber-500'}`} />
          <div className="flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${checkinUrl.includes('hf.space') ? 'text-green-900' : 'text-amber-900'}`}>
              {checkinUrl.includes('hf.space') ? 'Internet Mode' : 'Local WiFi Mode'}
            </p>
            <p className={`text-[10px] ${checkinUrl.includes('hf.space') ? 'text-green-700' : 'text-amber-700'}`}>
              {checkinUrl.includes('hf.space') ? 'Accessible via Mobile Data (4G/5G)' : 'Connect to same WiFi to scan'}
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
