import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const getBaseURL = () => {
  // If we are running on a mobile device (Capacitor)
  const isNative = window.location.protocol === 'capacitor:'
  const isMobileView = window.innerWidth < 768

  if (isNative || (window.location.hostname === 'localhost' && isMobileView)) {
    // Check if we are in an Android Emulator
    const ua = navigator.userAgent.toLowerCase()
    const isEmulator = ua.includes('android') && (ua.includes('google') || ua.includes('sdk') || ua.includes('emulator'))
    
    if (isEmulator) {
      return 'http://10.0.2.2:4000/api/v1'
    }
    
    // Default to local IP for physical devices (Update this to your PC's IP if needed)
    return 'http://192.168.0.102:4000/api/v1'
  }

  // Otherwise use the relative path (works for web and dev proxy)
  return '/api/v1'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── REQUEST INTERCEPTOR — attach token ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── RESPONSE INTERCEPTOR — token refresh ────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        const { data } = await api.post('/auth/refresh', { refreshToken })
        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken)
        processQueue(null, data.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
