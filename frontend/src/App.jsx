import { Routes, Route, Navigate } from 'react-router-dom'
import useAuth from './hooks/useAuth'
import Layout from './components/layout/Layout'

import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import DashboardPage        from './pages/DashboardPage'
import ProfileSetupPage     from './pages/ProfileSetupPage'
import ProfileEditPage      from './pages/ProfileEditPage'
import ProjectsPage         from './pages/ProjectsPage'
import ProjectEditPage      from './pages/ProjectEditPage'
import SharePage            from './pages/SharePage'
import PreviewPage          from './pages/PreviewPage'
import PublicPortfolioPage  from './pages/PublicPortfolioPage'
import AdminPage            from './pages/AdminPage'
import ReviewsPage          from './pages/ReviewsPage'

function Guard({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/portfolio/:token" element={<PublicPortfolioPage />} />

      {/* Protected */}
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"         element={<DashboardPage />} />
        <Route path="profile/setup"     element={<ProfileSetupPage />} />
        <Route path="profile/edit"      element={<ProfileEditPage />} />
        <Route path="projects"          element={<ProjectsPage />} />
        <Route path="projects/new"      element={<ProjectEditPage />} />
        <Route path="projects/:id/edit" element={<ProjectEditPage />} />
        <Route path="share"             element={<SharePage />} />
        <Route path="preview"           element={<PreviewPage />} />
        <Route path="reviews" element={
          <Guard roles={['admin','coach']}><ReviewsPage /></Guard>
        } />
        <Route path="admin" element={
          <Guard roles={['admin','coach']}><AdminPage /></Guard>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
