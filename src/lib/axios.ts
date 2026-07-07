import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor untuk menyisipkan Token JWT
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor untuk menangani 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau tidak valid
      useAuthStore.getState().auth.reset()
      // Redirect ke login ditangani di level router atau guard
    }
    return Promise.reject(error)
  }
)
