import Api from '@/services/Api'

export default {
  fetchLogs () {
    return Api().get('api/v1/logging/logs')
  },
  deleteLogs () {
    Api().delete(`api/v1/logging/logs`)
  }
}
