import axios from 'axios'

export default() => {
  if (process.env.NODE_ENV === 'development') {
    return axios.create({
      baseURL: `http://localhost:3000`
      // for mobile phone testing in local network:
      // baseURL: `http://192.168.123.123:3000`
    })
  } else {
    return axios.create({
    })
  }
}
