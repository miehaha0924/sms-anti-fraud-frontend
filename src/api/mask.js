import smsApi from './sms'

export const maskApi = {
  getRules() {
    return smsApi.get('/api/mask-rules')
  },
  createRule(data) {
    return smsApi.post('/api/mask-rules', data)
  },
  updateRule(id, data) {
    return smsApi.put('/api/mask-rules/' + id, data)
  },
  deleteRule(id) {
    return smsApi.delete('/api/mask-rules/' + id)
  },
  toggleRule(id) {
    return smsApi.patch('/api/mask-rules/' + id + '/toggle')
  },
  preview(phone) {
    return smsApi.get('/api/mask-rules/preview', { params: { phone } })
  }
}

export default maskApi
