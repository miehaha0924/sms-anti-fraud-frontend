import smsApi from './sms'

export const rulesApi = {
  getRules() {
    return smsApi.get('/rules')
  },
  createKeywordRule(data) {
    return smsApi.post('/rules/keyword', data)
  },
  updateKeywordRule(id, data) {
    return smsApi.put('/rules/keyword/' + id, data)
  },
  deleteKeywordRule(id) {
    return smsApi.delete('/rules/keyword/' + id)
  },
  toggleKeywordRule(id, enabled) {
    return smsApi.patch('/rules/keyword/' + id + '/toggle', { enabled })
  },
  toggleComboRule(id, enabled) {
    return smsApi.patch('/rules/combo/' + id + '/toggle', { enabled })
  }
}

export default rulesApi
