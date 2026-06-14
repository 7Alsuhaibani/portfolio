import { create } from 'zustand'
import api from '../utils/api'

const useAuth = create((set, get) => ({
  user:  JSON.parse(localStorage.getItem('user')  || 'null'),
  token: localStorage.getItem('token') || null,

  // Backend login expects OAuth2 form data, then we fetch /auth/me for user object
  login: async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('token', data.access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    const me = await api.get('/auth/me')
    localStorage.setItem('user', JSON.stringify(me.data))
    set({ user: me.data, token: data.access_token })
    return me.data
  },

  // Backend register expects { email, username, password, role }
  register: async (email, password, username, role = 'student') => {
    const { data } = await api.post('/auth/register', { email, username, password, role })
    localStorage.setItem('token', data.access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    const me = await api.get('/auth/me')
    localStorage.setItem('user', JSON.stringify(me.data))
    set({ user: me.data, token: data.access_token })
    return me.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!get().token,
  isAdmin:  () => ['admin', 'coach'].includes(get().user?.role),
  isStudent:() => get().user?.role === 'student',
}))

export default useAuth
