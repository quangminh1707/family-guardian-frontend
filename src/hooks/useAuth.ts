// useAuth hook
import useAuthStore from '../store/authStore'
import type { User } from '../types/user.types'

export const useAuth = () => {
  const { user, isAuthenticated, logout, updateToken } = useAuthStore()

  return {
    user: user as User | null,
    isAuthenticated,
    isGuardian: user?.role === 'guardian',
    isChild: user?.role === 'child',
    isAdmin: user?.role === 'admin',
    logout,
    updateToken,
  }
}

