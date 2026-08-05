import api from './index'

export const workerModeApi = {
  getCurrent: () => api.get('/worker-mode/current'),
  update: (mode, autoRun) => api.put('/worker-mode', { mode, auto_run: autoRun }),
}
