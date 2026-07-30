import smsApi from './sms'

export const rulesApi = {
  getRules() {
    return smsApi.get('/api/rules')
  },
  createKeywordRule(data) {
    return smsApi.post('/api/rules/keyword', data)
  },
  updateKeywordRule(id, data) {
    return smsApi.put('/api/rules/keyword/' + id, data)
  },
  deleteKeywordRule(id) {
    return smsApi.delete('/api/rules/keyword/' + id)
  },
  toggleKeywordRule(id, enabled) {
    return smsApi.patch('/api/rules/keyword/' + id + '/toggle', { enabled })
  },
  toggleComboRule(id, enabled) {
    return smsApi.patch('/api/rules/combo/' + id + '/toggle', { enabled })
  }
}

export default rulesApi
