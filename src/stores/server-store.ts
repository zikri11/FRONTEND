import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api } from '@/lib/axios'

export interface MikrotikServer {
  id: string
  name: string
  host: string
  port: number
  username: string
  useSSL: boolean
  lastStatus: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

interface ServerState {
  servers: MikrotikServer[]
  activeServerId: string | null
  isLoading: boolean
  error: string | null
  fetchServers: () => Promise<void>
  setActiveServerId: (id: string | null) => void
}

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: null,
      isLoading: false,
      error: null,
      fetchServers: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.get('/servers')
          const servers: MikrotikServer[] = response.data

          const currentActiveId = get().activeServerId
          let newActiveId = currentActiveId

          if (servers.length === 0) {
            newActiveId = null
          } else {
            const exists = servers.find((s) => s.id === currentActiveId)
            if (!exists) newActiveId = servers[0].id
          }

          set({
            servers,
            isLoading: false,
            activeServerId: newActiveId,
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },
      setActiveServerId: (id) => set({ activeServerId: id }),
    }),
    {
      name: 'egnet-server-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist only the selected router id; the server list is always
      // refetched fresh from the API on load (fetchServers re-validates the
      // persisted id against the fresh list and falls back to the first server).
      partialize: (state) => ({ activeServerId: state.activeServerId }),
    }
  )
)
