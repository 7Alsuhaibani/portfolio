import { create } from 'zustand'
import api from '../utils/api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    // Backend expects OAuth2 form data
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('token', data.access_token)
    // Fetch user profile after login
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    const meRes = await api.get('/auth/me')
    const user = meRes.data
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token: data.access_token, loading: false })
    return user
  },

  register: async (email, password, username, role = 'student') => {
    set({ loading: true })
    // Backend UserCreate: {email, username, password, role}
    const { data } = await api.post('/auth/register', { email, username, password, role })
    localStorage.setItem('token', data.access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    const meRes = await api.get('/auth/me')
    const user = meRes.data
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token: data.access_token, loading: false })
    return user
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
  isCoach: () => get().user?.role === 'coach',
  isStudent: () => get().user?.role === 'student',
}))

export default useAuthStore