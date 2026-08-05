import smsApi from './sms'

export const maskApi = {
  getRules() {
    return smsApi.get('/mask-rules')
  },
  createRule(data) {
    return smsApi.post('/mask-rules', data)
  },
  updateRule(id, data) {
    return smsApi.put('/mask-rules/' + id, data)
  },
  deleteRule(id) {
    return smsApi.delete('/mask-rules/' + id)
  },
  toggleRule(id) {
    return smsApi.patch('/mask-rules/' + id + '/toggle')
  },
  preview(phone) {
    return smsApi.get('/mask-rules/preview', { params: { phone } })
  }
}

export default maskApi
