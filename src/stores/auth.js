import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import smsApi from '@/api/sms'

const SESSION_COOKIE = 'fraud_sms_session'

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function setCookie(name, value, days = 1) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/'
}

function clearCookie(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const savedToken = localStorage.getItem('access_token')
  const savedUser = localStorage.getItem('user')

  const token = ref(savedToken || null)
  const user = ref(savedUser ? JSON.parse(savedUser) : null)

  // Sync token to shared axios instance on init
  if (token.value) {
    smsApi.defaults.headers.common['Authorization'] = 'Bearer ' + token.value
  }

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const { data } = await smsApi.post('/auth/login', { username, password })
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setCookie(SESSION_COOKIE, data.access_token)
    smsApi.defaults.headers.common['Authorization'] = 'Bearer ' + data.access_token
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    clearCookie(SESSION_COOKIE)
    delete smsApi.defaults.headers.common['Authorization']
    router.push('/login')
  }

  return { token, user, isAdmin, isLoggedIn, login, logout }
})
