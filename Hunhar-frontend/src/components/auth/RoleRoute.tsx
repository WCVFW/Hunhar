import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { dashboardPathFor, getSessionRole, type UserRole } from '../../services/api'

interface RoleRouteProps {
  allow: UserRole[]
}

/**
 * Guards a dashboard section: logged-out users go to /login,
 * logged-in users with another role go to their own dashboard.
 */
export function RoleRoute({ allow }: RoleRouteProps): React.JSX.Element {
  const location = useLocation()
  const role = getSessionRole()

  if (!role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!allow.includes(role)) {
    return <Navigate to={dashboardPathFor(role)} replace />
  }
  return <Outlet />
}

/** Login / signup pages: already logged-in users go straight to their dashboard. */
export function GuestRoute({ children }: { children: React.JSX.Element }): React.JSX.Element {
  const role = getSessionRole()
  return role ? <Navigate to={dashboardPathFor(role)} replace /> : children
}
