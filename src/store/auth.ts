import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Role {
  id: number
  name: string
  guard_name: string
}

interface User {
  id: number
  username: string
  email: string
  name: string
  surname: string
  role_ids: number[]
  roles: Role[]
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
) 