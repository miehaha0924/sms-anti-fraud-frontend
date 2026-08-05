import smsApi from './sms'

export const authApi = {
  login(username, password) {
    return smsApi.post('/auth/login', { username, password })
  },
  logout() {
    return smsApi.post('/auth/logout')
  },
  getMe() {
    return smsApi.get('/auth/me')
  }
}

export default authApi
