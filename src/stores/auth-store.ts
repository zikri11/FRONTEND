import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'OWNER' | 'TEKNISI'
  ownerId: string | null
}

interface AuthState {
  auth: {
    user: AuthUser | null
    accessToken: string
    setUser: (user: AuthUser | null) => void
    setAccessToken: (accessToken: string) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      auth: {
        user: null,
        accessToken: '',
        setUser: (user) =>
          set((state) => ({ auth: { ...state.auth, user } })),
        setAccessToken: (accessToken) =>
          set((state) => ({ auth: { ...state.auth, accessToken } })),
        // Kosongkan user + token TANPA mengganti setter — mengganti seluruh
        // objek auth membuat setAccessToken/setUser jadi no-op, sehingga login
        // berikutnya (tanpa reload) gagal menyimpan sesi.
        reset: () =>
          set((state) => ({
            auth: { ...state.auth, user: null, accessToken: '' },
          })),
      },
    }),
    {
      name: 'egnet-auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        auth: {
          user: state.auth.user,
          accessToken: state.auth.accessToken,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          | { auth?: { user?: AuthUser | null; accessToken?: string } }
          | undefined
        return {
          ...currentState,
          auth: {
            ...currentState.auth,
            user: persisted?.auth?.user ?? null,
            accessToken: persisted?.auth?.accessToken ?? '',
          },
        }
      },
    }
  )
)
