import { isAxiosError } from 'axios'
import { type AuthUser } from '@/stores/auth-store'

/**
 * Bentuk respons yang dikembalikan backend untuk semua endpoint auth
 * (`/auth/login`, `/auth/register`, `/auth/google`) — sama persis.
 */
export type AuthSessionData = {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    role: AuthUser['role']
    ownerId: string | null
  }
}

/** Aksi minimal dari slice auth store yang dibutuhkan untuk menyimpan sesi. */
type AuthSessionActions = {
  setAccessToken: (accessToken: string) => void
  setUser: (user: AuthUser) => void
}

/**
 * Simpan token + user ke auth store. Dipakai bersama oleh sign-in, register,
 * dan Google login supaya logika penyimpanan sesi tidak terduplikasi.
 */
export function applyAuthSession(
  data: AuthSessionData,
  auth: AuthSessionActions
) {
  auth.setAccessToken(data.accessToken)
  auth.setUser({
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
    ownerId: data.user.ownerId,
  })
}

/** Prefix rute auth — target redirect ke sini ditolak (cegah loop). */
export const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/otp']

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((a) => pathname === a || pathname.startsWith(a + '/'))
}

/**
 * Bersihkan nilai `redirect` sebelum dipakai navigate setelah login. Ambil
 * pathname saja (buang query bersarang `?redirect=...`), tolak URL eksternal
 * dan rute auth (agar tak balik ke /sign-in). Fallback ke /dashboard.
 */
export function safeRedirect(raw?: string): string {
  if (!raw) return '/dashboard'
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // biarkan raw bila decode gagal
  }
  const pathname = decoded.split('?')[0]
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return '/dashboard'
  if (isAuthPath(pathname)) return '/dashboard'
  return pathname
}

/**
 * Ambil pesan error dari respons backend (axios). Kembalikan `fallback` bila
 * bukan error axios atau backend tidak menyertakan `message`.
 */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || fallback
  }
  return fallback
}
