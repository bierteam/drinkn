import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { webcrypto } from 'node:crypto'
import axios from 'axios'
import pwned from '../pwned.js'

vi.mock('axios', () => ({
  default: { get: vi.fn() }
}))

// jsdom ships crypto.getRandomValues but not always subtle, which pwned.js
// needs for its SHA-1 digest
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

// SHA-1 of 'hunter2', which the range API would split after five characters
const HUNTER2 = 'F3BBBD66A63D4BF1747940578EC3D0103530E21D'

beforeEach(() => {
  axios.get.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pwned', () => {
  it('queries only the first five characters of the hash', async () => {
    axios.get.mockResolvedValue({ data: '' })
    await pwned('hunter2')

    expect(axios.get).toHaveBeenCalledWith(
      `https://api.pwnedpasswords.com/range/${HUNTER2.slice(0, 5)}`
    )
    // the rest of the hash must never leave the browser
    const [url] = axios.get.mock.calls[0]
    expect(url).not.toContain(HUNTER2.slice(5))
  })

  it('reports a breached password when the suffix is in the range', async () => {
    axios.get.mockResolvedValue({ data: `${HUNTER2.slice(5)}:12345\nAAAAA:1` })
    expect(await pwned('hunter2')).toBe(true)
  })

  it('reports a clean password when the suffix is absent', async () => {
    axios.get.mockResolvedValue({ data: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1' })
    expect(await pwned('hunter2')).toBe(false)
  })

  it('only matches at the start of a line', async () => {
    // a suffix appearing as a count or mid-line must not count as a hit
    axios.get.mockResolvedValue({ data: `AAAAA:1\nBBBBB:${HUNTER2.slice(5)}` })
    expect(await pwned('hunter2')).toBe(false)
  })

  it('fails open when the range service is unreachable', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'))
    // returning false keeps a network outage from blocking the form
    expect(await pwned('hunter2')).toBe(false)
  })
})
