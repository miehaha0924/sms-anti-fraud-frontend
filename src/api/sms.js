import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Restore token from localStorage
const token = localStorage.getItem('access_token')
if (token) {
  api.defaults.headers.common['Authorization'] = 'Bearer ' + token
}

// Response interceptor
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // 清理认证状态并跳转登录页
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    } else {
      ElMessage.error(err.response?.data?.detail || '请求失败')
    }
    return Promise.reject(err)
  }
)

export default api

// ── Task ──
export function getTask(taskDate) {
  return api.get('/tasks/' + taskDate)
}

export function listTasks(params) {
  return api.get('/tasks', { params })
}

export function createTask(taskDate, mode) {
  return api.post('/tasks/' + taskDate + '?mode=' + (mode || 'rule_only'))
}

export function finishTask(taskDate, mode) {
  return api.post('/tasks/' + taskDate + '/finish?mode=' + (mode || 'rule_only'))
}

export function getTaskProgress(taskDate) {
  return api.get('/tasks/' + taskDate + '/progress')
}

// ── Callers ──
export function getCallers(params) {
  return api.get('/callers', { params })
}

export function getCaller(caller, params) {
  return api.get('/callers/' + encodeURIComponent(caller), { params })
}

export function getCallerMessages(caller, params) {
  return api.get('/callers/' + encodeURIComponent(caller) + '/messages', { params })
}

// ── SMS detail ──
export function getMessage(smsId) {
  return api.get('/messages/' + smsId)
}

// ── Day-end analysis ──
export function getFraudClusters(params) {
  return api.get('/day-end/clusters', { params })
}

export function getDayEndDiffs(params) {
  return api.get('/day-end/diffs', { params })
}

export function getCandidateRules(params) {
  return api.get('/day-end/candidate-rules', { params })
}

export function approveCandidateRule(candidateId) {
  return api.post('/day-end/candidate-rules/' + candidateId + '/approve')
}

export function simulateCandidateRule(candidateId) {
  return api.post('/day-end/candidate-rules/' + candidateId + '/simulate')
}

export function getBlacklistTraceback(params) {
  return api.get('/day-end/blacklist-traceback', { params })
}

// ── Rules ──
export function getRules() {
  return api.get('/rules')
}

// ── LLM logs ──
export function getLlmLogsSummary(params) {
  return api.get('/llm-call-logs/summary', { params })
}

export function getLlmLogs(params) {
  return api.get('/llm-call-logs', { params })
}

// ── Import ──
export function getImportFiles(params) {
  return api.get('/import/files', { params })
}

export function getImportBatches(params) {
  return api.get('/import/batches', { params })
}

export function getImportBatch(batchId) {
  return api.get('/import/batches/' + batchId)
}

// ── Overview stats ──
export function getOverview() {
  return api.get('/stats/overview')
}

// ── Analysis status (debug) ──
export function getAnalysisStatus(params) {
  return api.get('/analysis-status', { params })
}
