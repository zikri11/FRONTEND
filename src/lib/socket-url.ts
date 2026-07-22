/**
 * Origin (protocol+host, tanpa path) buat koneksi socket.io. Diturunkan dari
 * VITE_API_BASE_URL yang sama dipakai axios (src/lib/axios.ts) — bukan env
 * var baru. Kalau base URL relatif (proxy dev server), pakai origin browser.
 */
export function getSocketOrigin(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '')
  }
  return window.location.origin
}

/**
 * Base URL backend yang BISA DIPANGGIL DARI LUAR aplikasi ini — dipakai
 * dokumentasi API (mesin kasir memanggilnya dari jaringan outlet, bukan dari
 * browser yang membuka panel).
 *
 * Beda dari axios: saat dev, `VITE_API_BASE_URL` bernilai `/api` yang hanya
 * berarti lewat proxy dev server. Alamat itu tak berguna dicantumkan di
 * dokumentasi, jadi origin sebenarnya diambil dari `VITE_BACKEND_ORIGIN`.
 */
export function getPublicApiBaseUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/$/, '')
  }
  const origin = import.meta.env.VITE_BACKEND_ORIGIN
  if (origin) return `${origin.replace(/\/$/, '')}/api`
  return `${window.location.origin}/api`
}
