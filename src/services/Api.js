import axios from 'axios'

export default() => {
  if (process.env.NODE_ENV === 'development') {
    return axios.create({
      baseURL: `http://localhost:3000`
    })
  } else {
    return axios.create({
    })
  }
}
