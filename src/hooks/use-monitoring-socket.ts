import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth-store'
import { getSocketOrigin } from '@/lib/socket-url'
import type {
  RouterResources,
  SnapshotActiveUser,
  TrafficInterface,
} from '@/features/dashboard/components/router-health-panel'

type MonitoringSocketState = {
  resources: RouterResources | null
  activeUsers: SnapshotActiveUser[]
  traffic: TrafficInterface[]
  wsStatus: 'connecting' | 'live' | 'unavailable'
  routerConnected: boolean | null
}

const INITIAL_STATE: MonitoringSocketState = {
  resources: null,
  activeUsers: [],
  traffic: [],
  wsStatus: 'unavailable',
  routerConnected: null,
}

/**
 * WS primer untuk data monitoring (resources/active users/traffic), dengan
 * REST sebagai fallback di pemanggil (lihat spec docs/superpowers/specs/
 * 2026-07-12-websocket-monitoring-design.md). No-op (tidak connect socket
 * sama sekali) kalau `enabled=false` (role OWNER) atau `serverId` null.
 */
export function useMonitoringSocket(
  serverId: string | null,
  enabled: boolean
): MonitoringSocketState {
  const [state, setState] = useState<MonitoringSocketState>(INITIAL_STATE)
  const socketRef = useRef<Socket | null>(null)
  const subscribedServerId = useRef<string | null>(null)
  const desiredServerId = useRef<string | null>(serverId)
  const active = enabled && !!serverId

  useEffect(() => {
    desiredServerId.current = serverId
  }, [serverId])

  // Socket dibuat sekali per mount hook (bukan per serverId).
  useEffect(() => {
    if (!active) return

    const token = useAuthStore.getState().auth.accessToken
    const socket: Socket = io(`${getSocketOrigin()}/monitoring`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })
    socketRef.current = socket

    const subscribe = (id: string) => {
      if (subscribedServerId.current && subscribedServerId.current !== id) {
        socket.emit('unsubscribe', { serverId: subscribedServerId.current })
      }
      subscribedServerId.current = id
      socket.emit('subscribe', { serverId: id }, (ack?: { ok?: boolean }) => {
        setState((s) => ({ ...s, wsStatus: ack?.ok ? 'live' : 'unavailable' }))
      })
    }

    socket.on('connect', () => {
      // Reset data lama sebelum subscribe ulang (mis. reconnect setelah
      // sempat 'unavailable' lalu socket.io berhasil connect lagi).
      setState({ ...INITIAL_STATE, wsStatus: 'connecting' })
      subscribe(desiredServerId.current as string)
    })

    socket.on(
      'snapshot',
      (payload: {
        serverId: string
        activeUsers?: SnapshotActiveUser[]
        resources?: RouterResources | null
        traffic?: TrafficInterface[]
      }) => {
        // Guard race: abaikan snapshot yang bukan buat router aktif sekarang
        // (mis. baru saja ganti router lewat dropdown).
        if (payload.serverId !== subscribedServerId.current) return
        setState((s) => ({
          ...s,
          resources: payload.resources ?? null,
          activeUsers: payload.activeUsers ?? [],
          traffic: Array.isArray(payload.traffic) ? payload.traffic : [],
        }))
      }
    )

    socket.on(
      'status',
      (payload: { serverId: string; connected: boolean }) => {
        if (payload.serverId !== subscribedServerId.current) return
        setState((s) => ({ ...s, routerConnected: payload.connected }))
      }
    )

    socket.on('unauthorized', () => {
      // Token session ini dianggap invalid buat WS — tidak retry.
      setState((s) => ({ ...s, wsStatus: 'unavailable' }))
      socket.disconnect()
    })

    // 'reconnect_failed' adalah event Manager, bukan Socket (socket.io-client
    // v4) — kalau didengar lewat `socket.on(...)` tidak akan pernah terpanggil.
    socket.io.on('reconnect_failed', () => {
      // reconnectionAttempts habis → REST fallback ambil alih permanen.
      setState((s) => ({ ...s, wsStatus: 'unavailable' }))
    })

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') return
      setState((s) =>
        s.wsStatus === 'live' ? { ...s, wsStatus: 'connecting' } : s
      )
    })

    return () => {
      if (subscribedServerId.current) {
        socket.emit('unsubscribe', { serverId: subscribedServerId.current })
      }
      socket.disconnect()
      socketRef.current = null
      subscribedServerId.current = null
    }
  }, [active])

  // Ganti serverId di router yang sama (dropdown) → unsubscribe lama +
  // subscribe baru lewat socket connection yang sudah ada, tanpa reconnect.
  useEffect(() => {
    const socket = socketRef.current
    if (!active || !socket?.connected || !serverId) return
    if (subscribedServerId.current === serverId) return
    if (subscribedServerId.current) {
      socket.emit('unsubscribe', { serverId: subscribedServerId.current })
    }
    subscribedServerId.current = serverId
    socket.emit('subscribe', { serverId }, (ack?: { ok?: boolean }) => {
      if (ack?.ok) setState((s) => ({ ...s, wsStatus: 'live' }))
    })
  }, [active, serverId])

  return active ? state : INITIAL_STATE
}
