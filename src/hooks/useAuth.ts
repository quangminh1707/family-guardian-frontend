// useAuth hook
import useAuthStore from '../store/authStore'
import type { User } from '../types/user.types'

export const useAuth = () => {
  const { user, isAuthenticated, logout, updateToken } = useAuthStore()

  return {
    user: user as User | null,
    isAuthenticated,
    isGuardian: user && user.role === 'Guardian',
    isChild: user && user.role === 'Child',
    isAdmin: user && user.role === 'Admin',
    logout,
    updateToken,
  }
}

