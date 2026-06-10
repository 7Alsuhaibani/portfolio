import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './hooks/useAuth'

// Layout
import Layout from './components/layout/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import ProfileEditPage from './pages/ProfileEditPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectEditPage from './pages/ProjectEditPage'
import SharePage from './pages/SharePage'
import PublicPortfolioPage from './pages/PublicPortfolioPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ReviewsPage from './pages/ReviewsPage'

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/portfolio/:token" element={<PublicPortfolioPage />} />
        <Route path="/p/:token" element={<PublicPortfolioPage />} />

        {/* Protected — nested under Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile/setup" element={<ProfileSetupPage />} />
          <Route path="profile/edit" element={<ProfileEditPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<ProjectEditPage />} />
          <Route path="projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="share" element={<SharePage />} />
          <Route
            path="reviews"
            element={
              <ProtectedRoute roles={['admin', 'coach']}>
                <ReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['admin', 'coach']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}