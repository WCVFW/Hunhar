import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import { RoleRoute, GuestRoute } from './components/auth/RoleRoute'
import DashboardLayout from './components/dashboard/DashboardLayout'

/** Old deep links (submit / chat / milestones / review) all live inside the project workspace now. */
function WorkspaceRedirect(): React.JSX.Element {
  const { projectId = '' } = useParams<{ projectId: string }>()
  return <Navigate to={`/freelancer/projects/${projectId}`} replace />
}
import FreelancerDashboard from './pages/freelancer/FreelancerDashboard'
import BrowseProjectsPage from './pages/freelancer/BrowseProjectsPage'
import ProjectDetailsPage from './pages/freelancer/ProjectDetailsPage'
import SubmitProposalPage from './pages/freelancer/SubmitProposalPage'
import MyBidsPage from './pages/freelancer/MyBidsPage'
import CreditsPage from './pages/freelancer/CreditsPage'
import WalletPage from './pages/freelancer/WalletPage'
import LeadershipBoardPage from './pages/freelancer/LeadershipBoardPage'
import FreelancerProfilePage from './pages/freelancer/FreelancerProfilePage'
import ActiveProjectsPage from './pages/freelancer/ActiveProjectsPage'
import WorkspaceOverviewPage from './pages/freelancer/WorkspaceOverviewPage'
import MessagesPage from './pages/freelancer/MessagesPage'
import CalendarPage from './pages/freelancer/CalendarPage'
import TeamCollabPage from './pages/freelancer/TeamCollabPage'
import FreelancerSettingsPage from './pages/freelancer/FreelancerSettingsPage'
import FreelancerNotificationsPage from './pages/freelancer/FreelancerNotificationsPage'

import ClientDashboardLayout from './components/dashboard/ClientDashboardLayout'
import ClientDashboardPage from './pages/client/ClientDashboardPage'
import CreateProjectPage from './pages/client/CreateProjectPage'
import ClientProjectsPage from './pages/client/ClientProjectsPage'
import ClientMessagesPage from './pages/client/ClientMessagesPage'
import ClientCalendarPage from './pages/client/ClientCalendarPage'
import ClientPaymentsPage from './pages/client/ClientPaymentsPage'
import ClientSettingsPage from './pages/client/ClientSettingsPage'

import AdminDashboardLayout from './components/dashboard/AdminDashboardLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminProjectsPage from './pages/admin/AdminProjectsPage'
import AdminVerificationsPage from './pages/admin/AdminVerificationsPage'
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage'
import AdminDisputesPage from './pages/admin/AdminDisputesPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

        {/* Freelancer Dashboard Shell & Subroutes */}
        <Route element={<RoleRoute allow={['FREELANCER', 'ADMIN']} />}>
          <Route path="/freelancer" element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FreelancerDashboard />} />
            <Route path="browse" element={<BrowseProjectsPage />} />
            <Route path="browse/:projectId" element={<ProjectDetailsPage />} />
            <Route path="browse/:projectId/bid" element={<SubmitProposalPage />} />
            <Route path="bids" element={<MyBidsPage />} />
            <Route path="credits" element={<CreditsPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="leaderboard" element={<LeadershipBoardPage />} />
            <Route path="profile" element={<FreelancerProfilePage />} />
            <Route path="projects" element={<ActiveProjectsPage />} />
            <Route path="projects/:projectId" element={<WorkspaceOverviewPage />} />
            <Route path="projects/:projectId/submit" element={<WorkspaceRedirect />} />
            <Route path="projects/:projectId/chat" element={<WorkspaceRedirect />} />
            <Route path="projects/:projectId/milestones" element={<WorkspaceRedirect />} />
            <Route path="projects/:projectId/review" element={<WorkspaceRedirect />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="team" element={<TeamCollabPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="notifications" element={<FreelancerNotificationsPage />} />
            <Route path="settings" element={<FreelancerSettingsPage />} />
          </Route>
        </Route>

        {/* Client Dashboard Shell & Subroutes */}
        <Route element={<RoleRoute allow={['CLIENT', 'ADMIN']} />}>
          <Route path="/client" element={<ClientDashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboardPage />} />
            <Route path="create-project" element={<CreateProjectPage />} />
            <Route path="projects" element={<ClientProjectsPage />} />
            <Route path="messages" element={<ClientMessagesPage />} />
            <Route path="calendar" element={<ClientCalendarPage />} />
            <Route path="payments" element={<ClientPaymentsPage />} />
            <Route path="settings" element={<ClientSettingsPage />} />
          </Route>
        </Route>

        {/* Admin Dashboard Shell & Subroutes */}
        <Route element={<RoleRoute allow={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="verifications" element={<AdminVerificationsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="disputes" element={<AdminDisputesPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

