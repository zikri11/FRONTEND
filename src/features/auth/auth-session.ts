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
