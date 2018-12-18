import Api from '@/services/Api'

export default {
  fetchPils () {
    return Api().get('api/v1/aanbiedingen')
  }
}
