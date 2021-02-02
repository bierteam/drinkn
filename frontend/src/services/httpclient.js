import axios from "axios";
import { store, mutations } from '@/store'

axios.interceptors.response.use(function (response) {
  return response
}, async function (error) {
  if (error.response.status === 401 && error.config.url !== "/api/v2/auth/login/refresh" && error.config.url !== "/api/v2/auth/login") {
    const errorConfig = error.config
    errorConfig.headers.Authorization = store.jwt
    const result = await httpClient.refreshToken()
    mutations.setJwt(result.data.jwt)
    window.$cookies.set("refreshToken", result.data.refreshToken)
    return axios.request(errorConfig);
  }
  return Promise.reject(error)
})

export const httpClient = {
  post(endpoint, body){
    return axios
      .post(endpoint, body, {
        headers: {
          Authorization: store.jwt
        }})
  },
  get(endPoint){
    return axios
      .get(endPoint, {
        headers: {
          Authorization: store.jwt
        }})
  },
  async refreshToken(){
    try {
    var result = await axios.post("/api/v2/auth/login/refresh", { refreshToken:  window.$cookies.get("refreshToken" )})
    return result
    } catch {
      window.location.href = "/login"
    }
  },
  postForm(form){
    return axios
      .post("/api/v2/auth/login", form)
  }
}
