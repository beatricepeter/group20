import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboad from './pages/AdminDashboad'
import AdminExperts from './pages/AdminExperts'
import AdminUsers from './pages/AdminUsers'
import AdminPermissions from './pages/AdminPermissions'
import AdminReports from './pages/AdminReports'
import VisitorsPage from './pages/VisitorsPage'
import RegisterVisitorPage from './pages/RegisterVisitorPage'
import VisitorInsightsPage from './pages/VisitorInsightsPage'
import Home from './pages/Home'
import './App.css'

function AppContent() {
  return (
    <AuthProvider>
      <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist', 'expert']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboad />
              </ProtectedRoute>
            }
          />
          {/* old links to /admin still work, just redirect to the real page */}
          <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />

          <Route
            path="/admin/experts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminExperts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/permissions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPermissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/visitors"
            element={
              <ProtectedRoute
                allowedRoles={['admin', 'receptionist', 'expert']}
                requiredPermission="visitors.view"
              >
                <VisitorsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/insights"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VisitorInsightsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register"
            element={
              <ProtectedRoute
                allowedRoles={['admin', 'receptionist', 'expert']}
                requiredPermission="visitors.register"
              >
                <RegisterVisitorPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </AuthProvider>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
