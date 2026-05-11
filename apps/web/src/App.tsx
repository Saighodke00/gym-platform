import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { initMobileFeatures } from './lib/mobile'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import MembersPage from '@/pages/members/MembersPage'
import MemberDetailPage from '@/pages/members/MemberDetailPage'
import AddMemberPage from '@/pages/members/AddMemberPage'
import EditMemberPage from '@/pages/members/EditMemberPage'
import PlansPage from '@/pages/plans/PlansPage'
import AttendancePage from '@/pages/attendance/AttendancePage'
import QrScannerPage from '@/pages/attendance/QrScannerPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import MemberCheckin from '@/pages/public/MemberCheckin'
import KioskPage from '@/pages/attendance/KioskPage'
import PaymentsPage from '@/pages/payments/PaymentsPage'
import WorkoutsPage from '@/pages/workouts/WorkoutsPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import EnquiryPage from '@/pages/enquiries/EnquiryPage'
import ExpensePage from '@/pages/expenses/ExpensePage'
import BulkMessagePage from '@/pages/notifications/BulkMessagePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  useEffect(() => {
    initMobileFeatures()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Mobile Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/checkin" element={<MemberCheckin />} />
        
        {/* Desktop Kiosk View */}
        <Route path="/kiosk" element={<KioskPage />} />
        
        <Route path="/attendance/scan" element={<QrScannerPage />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="members/new" element={<AddMemberPage />} />
          <Route path="members/:id" element={<MemberDetailPage />} />
          <Route path="members/:id/edit" element={<EditMemberPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="enquiries" element={<EnquiryPage />} />
          <Route path="expenses" element={<ExpensePage />} />
          <Route path="broadcast" element={<BulkMessagePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
