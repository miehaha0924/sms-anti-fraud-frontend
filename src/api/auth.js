import smsApi from './sms'

export const authApi = {
  login(username, password) {
    return smsApi.post('/api/auth/login', { username, password })
  },
  logout() {
    return smsApi.post('/api/auth/logout')
  },
  getMe() {
    return smsApi.get('/api/auth/me')
  }
}

export default authApi
