import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
  })

  api.interceptors.request.use((config) => {
    const access = localStorage.getItem('access_token')
    if (access) config.headers.Authorization = `Bearer ${access}`
    return config
  })

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          try {
            const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
            localStorage.setItem('access_token', res.data.access)
            original.headers.Authorization = `Bearer ${res.data.access}`
            return api(original)
          } catch {
            logout()
          }
        }
      }
      return Promise.reject(error)
    }
  )

  const fetchUser = useCallback(async () => {
    const access = localStorage.getItem('access_token')
    if (!access) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me/')
      setUser(res.data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    setUser(res.data.user)
    return res.data
  }

  const register = async (username, email, password, password_confirm) => {
    const res = await api.post('/auth/register/', { username, email, password, password_confirm })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      try { await api.post('/auth/logout/', { refresh }) } catch {}
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, api, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}