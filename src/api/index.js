import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Restore token from localStorage
const token = localStorage.getItem('access_token')
if (token) {
  api.defaults.headers.common['Authorization'] = 'Bearer ' + token
}

// Response interceptor: handle 401 only for write operations
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isWriteOperation = ['post', 'put', 'patch', 'delete'].includes(err.config.method?.toLowerCase())

    if (err.response?.status === 401) {
      if (isWriteOperation) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        window.location.href = '/login'
      } else {
        ElMessage.error('登录已过期，请刷新页面')
      }
    } else {
      ElMessage.error(err.response?.data?.detail || '请求失败')
    }
    return Promise.reject(err)
  }
)

export default api
