import { useLocation } from 'react-router-dom'

export type RoleBase = '/freelancer' | '/client'

/** Which dashboard a shared page (messages, calendar, notifications) is being shown in. */
export function useRoleBase(): RoleBase {
  return useLocation().pathname.startsWith('/client') ? '/client' : '/freelancer'
}
