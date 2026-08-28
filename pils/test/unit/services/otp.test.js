/* global describe, it, expect */
const { authenticator } = require('otplib')
const otp = require('../../../services/otp')

const mockReq = () => ({
  session: { username: 'oscar' },
  hostname: 'pils.example',
  headers: { host: 'pils.example' }
})

describe('generate', () => {
  it('returns a secret and stores it on the session', () => {
    const req = mockReq()

    const result = otp.generate(req)

    expect(result.secret).toEqual(expect.any(String))
    expect(result.secret.length).toBeGreaterThan(0)
    // the secret has to survive on the session so the follow-up check can
    // verify against it before it is persisted to the user
    expect(req.session.secret).toBe(result.secret)
  })

  it('builds an otpauth uri carrying the same secret', () => {
    const req = mockReq()

    const { uri, secret } = otp.generate(req)

    expect(uri.startsWith('otpauth://totp/')).toBe(true)
    expect(uri).toContain(`secret=${secret}`)
    expect(uri).toContain('algorithm=SHA1')
    expect(uri).toContain('digits=6')
    expect(uri).toContain('period=30')
  })

  it('labels the entry with the service and the user', () => {
    const req = mockReq()

    const { uri } = otp.generate(req)

    expect(uri).toContain('pils.example:oscar')
  })

  it('issues a different secret each time', () => {
    expect(otp.generate(mockReq()).secret).not.toBe(otp.generate(mockReq()).secret)
  })
})

describe('check', () => {
  it('accepts a token generated from the same secret', () => {
    const { secret } = otp.generate(mockReq())
    const token = authenticator.generate(secret)

    expect(otp.check(token, secret)).toBe(true)
  })

  it('rejects a token from a different secret', () => {
    const { secret } = otp.generate(mockReq())
    const otherToken = authenticator.generate(authenticator.generateSecret())

    expect(otp.check(otherToken, secret)).toBe(false)
  })

  it('rejects a malformed token', () => {
    const { secret } = otp.generate(mockReq())

    expect(otp.check('000000', secret)).toBe(false)
    expect(otp.check('not-a-token', secret)).toBe(false)
  })
})
