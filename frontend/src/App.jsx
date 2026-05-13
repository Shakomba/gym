import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import AppLayout from './components/layout/AppLayout'

import Login from './pages/Login'
import Register from './pages/Register'

import AdminDashboard  from './pages/admin/AdminDashboard'
import Members         from './pages/admin/MemberRequests'
import AttendanceAdmin from './pages/admin/AttendanceAdmin'

import TrainerDashboard from './pages/trainer/TrainerDashboard'
import TrainerMembers   from './pages/trainer/TrainerMembers'
import WorkoutCourses   from './pages/trainer/WorkoutCourses'

import MemberDashboard  from './pages/member/MemberDashboard'
import MemberCourses    from './pages/member/MemberCourses'
import MemberAttendance from './pages/member/MemberAttendance'

import Machines from './pages/Machines'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin')   return <Navigate to="/admin" replace />
  if (user.role === 'trainer') return <Navigate to="/trainer" replace />
  return <Navigate to="/member" replace />
}

function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/"         element={<RoleRedirect />} />

            <Route element={<AppLayout />}>
              {/* Admin */}
              <Route path="/admin"            element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
              <Route path="/admin/members"    element={<RequireRole role="admin"><Members /></RequireRole>} />
              <Route path="/admin/attendance" element={<RequireRole role="admin"><AttendanceAdmin /></RequireRole>} />

              {/* Trainer */}
              <Route path="/trainer"          element={<RequireRole role="trainer"><TrainerDashboard /></RequireRole>} />
              <Route path="/trainer/members"  element={<RequireRole role="trainer"><TrainerMembers /></RequireRole>} />
              <Route path="/trainer/courses"  element={<RequireRole role="trainer"><WorkoutCourses /></RequireRole>} />

              {/* Member */}
              <Route path="/member"            element={<RequireRole role="member"><MemberDashboard /></RequireRole>} />
              <Route path="/member/courses"    element={<RequireRole role="member"><MemberCourses /></RequireRole>} />
              <Route path="/member/attendance" element={<RequireRole role="member"><MemberAttendance /></RequireRole>} />

              {/* Shared */}
              <Route path="/machines" element={<Machines />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
