import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TasksPage from './pages/TasksPage'
import UsersPage from './pages/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projets" element={<ProjectsPage />} />
          <Route path="/projets/:id" element={<ProjectDetailPage />} />
          <Route path="/taches" element={<TasksPage />} />

          {/* Managers only: the backend also rejects employees on every user route */}
          <Route element={<ProtectedRoute role="manager" />}>
            <Route path="/utilisateurs" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}