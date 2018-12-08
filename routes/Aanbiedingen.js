import Api from '@/services/Api'

export default {
  fetchPosts () {
    return Api().get('/api/v1/aanbiedingen')
  }
}
