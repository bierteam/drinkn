import axios from 'axios'

const sha1Hash = async (input) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('')
}

const pwned = async (password) => {
  try {
    const hash = (await sha1Hash(password)).toUpperCase()
    const suffix = hash.slice(5)
    const match = new RegExp(`^${suffix}:`, 'm')

    const response = await axios.get(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`)
    const data = response.data

    return match.test(data)
  } catch (error) {
    console.error('An error occurred:', error)
    return false
  }
}

export default pwned
