import axios from "axios";
import { store } from '@/store'

axios.interceptors.response.use(function (response) {
  return response
}, async function (error) {
  if (error.response.status === 401) {
    await httpClient.refreshToken()
  }
  return Promise.reject(error)
})

export const httpClient = {
  post(endpoint, body){
    return axios
      .post("/api/v2/auth/login", body, {
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
    return axios
      .post("/api/v2/auth/login/refresh", { refreshToken:  window.$cookies.get("refreshToken" )})
      .then(result => console.log(result))
      .catch(window.location.href = "login")
  },
  postForm(form){
    return axios
      .post("/api/v2/auth/login", form)
  }
}
