import api from './index'

export const workerModeApi = {
  getCurrent: () => api.get('/api/worker-mode/current'),
  update: (mode, autoRun) => api.put('/api/worker-mode', { mode, auto_run: autoRun }),
}
