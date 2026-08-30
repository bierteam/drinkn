jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn()
}))

const webauthn = require('@simplewebauthn/server')
const passkey = require('../../../services/passkey')

const buildReq = (session = {}) => ({
  session,
  hostname: 'pils.example.test',
  protocol: 'https',
  get: header => (header === 'host' ? 'pils.example.test' : undefined)
})

const account = { _id: 'user-1', username: 'oscar', credentials: [] }

// the two bytes 0x01 0x02 are 'AQI' in base64url
const publicKeyBytes = new Uint8Array([1, 2])
const publicKeyText = 'AQI'

const storedCredential = {
  credentialID: 'cred-1',
  publicKey: publicKeyText,
  counter: 4,
  transports: ['internal']
}

const { RP_ID, RP_ORIGIN } = process.env

beforeEach(() => {
  delete process.env.RP_ID
  delete process.env.RP_ORIGIN
  webauthn.generateRegistrationOptions.mockResolvedValue({ challenge: 'challenge-1' })
  webauthn.generateAuthenticationOptions.mockResolvedValue({ challenge: 'challenge-2' })
})

afterAll(() => {
  if (RP_ID) process.env.RP_ID = RP_ID
  if (RP_ORIGIN) process.env.RP_ORIGIN = RP_ORIGIN
})

describe('registrationOptions', () => {
  it('keeps the challenge in the session for the verify step', async () => {
    const req = buildReq()
    const options = await passkey.registrationOptions(req, account)

    expect(options.challenge).toBe('challenge-1')
    expect(req.session.passkeyChallenge).toBe('challenge-1')
  })

  it('asks for a discoverable credential so login needs no username', async () => {
    await passkey.registrationOptions(buildReq(), account)

    expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticatorSelection: expect.objectContaining({ residentKey: 'required' })
      })
    )
  })

  it('copes with an account that has no credentials field at all', async () => {
    await passkey.registrationOptions(buildReq(), { _id: 'user-1', username: 'oscar' })

    expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({ excludeCredentials: [] })
    )
  })

  it('excludes the keys the account already holds', async () => {
    await passkey.registrationOptions(buildReq(), { ...account, credentials: [storedCredential] })

    const { excludeCredentials } = webauthn.generateRegistrationOptions.mock.calls[0][0]
    expect(excludeCredentials).toHaveLength(1)
    expect(excludeCredentials[0].id).toBe('cred-1')
    expect(excludeCredentials[0].publicKey).toEqual(publicKeyBytes)
  })

  it('asks for the kind of authenticator the caller named', async () => {
    await passkey.registrationOptions(buildReq(), account, 'cross-platform')

    expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticatorSelection: expect.objectContaining({ authenticatorAttachment: 'cross-platform' })
      })
    )
  })

  it('leaves the kind out entirely when none was named', async () => {
    await passkey.registrationOptions(buildReq(), account)

    const { authenticatorSelection } = webauthn.generateRegistrationOptions.mock.calls[0][0]
    expect('authenticatorAttachment' in authenticatorSelection).toBe(false)
  })

  it('ignores a kind it does not recognise rather than passing it on', async () => {
    await passkey.registrationOptions(buildReq(), account, 'something-else')

    const { authenticatorSelection } = webauthn.generateRegistrationOptions.mock.calls[0][0]
    expect('authenticatorAttachment' in authenticatorSelection).toBe(false)
  })

  it('falls back to the request host when nothing is configured', async () => {
    await passkey.registrationOptions(buildReq(), account)

    expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({ rpID: 'pils.example.test' })
    )
  })

  it('prefers the configured relying party id', async () => {
    process.env.RP_ID = 'pils.oscarr.nl'
    await passkey.registrationOptions(buildReq(), account)

    expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({ rpID: 'pils.oscarr.nl' })
    )
  })
})

describe('verifyRegistration', () => {
  const verified = {
    verified: true,
    registrationInfo: {
      credential: {
        id: 'cred-1',
        publicKey: publicKeyBytes,
        counter: 0,
        transports: ['internal']
      }
    }
  }

  it('returns the credential in the shape mongo stores', async () => {
    webauthn.verifyRegistrationResponse.mockResolvedValue(verified)
    const req = buildReq({ passkeyChallenge: 'challenge-1' })

    const credential = await passkey.verifyRegistration(req, { id: 'cred-1' })

    expect(credential).toEqual({
      credentialID: 'cred-1',
      publicKey: publicKeyText,
      counter: 0,
      transports: ['internal']
    })
  })

  it('stores an empty transport list when the authenticator reports none', async () => {
    webauthn.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: { id: 'cred-1', publicKey: publicKeyBytes, counter: 0 }
      }
    })
    const req = buildReq({ passkeyChallenge: 'challenge-1' })

    const credential = await passkey.verifyRegistration(req, { id: 'cred-1' })

    expect(credential.transports).toEqual([])
  })

  it('checks the response against the stored challenge and origin', async () => {
    webauthn.verifyRegistrationResponse.mockResolvedValue(verified)
    const req = buildReq({ passkeyChallenge: 'challenge-1' })

    await passkey.verifyRegistration(req, { id: 'cred-1' })

    expect(webauthn.verifyRegistrationResponse).toHaveBeenCalledWith({
      response: { id: 'cred-1' },
      expectedChallenge: 'challenge-1',
      expectedOrigin: 'https://pils.example.test',
      expectedRPID: 'pils.example.test'
    })
  })

  it('prefers the configured origin', async () => {
    process.env.RP_ORIGIN = 'https://pils.oscarr.nl'
    webauthn.verifyRegistrationResponse.mockResolvedValue(verified)
    const req = buildReq({ passkeyChallenge: 'challenge-1' })

    await passkey.verifyRegistration(req, { id: 'cred-1' })

    expect(webauthn.verifyRegistrationResponse).toHaveBeenCalledWith(
      expect.objectContaining({ expectedOrigin: 'https://pils.oscarr.nl' })
    )
  })

  it('spends the challenge so the same body cannot be replayed', async () => {
    webauthn.verifyRegistrationResponse.mockResolvedValue(verified)
    const req = buildReq({ passkeyChallenge: 'challenge-1' })

    await passkey.verifyRegistration(req, { id: 'cred-1' })
    expect(req.session.passkeyChallenge).toBe(undefined)

    await expect(passkey.verifyRegistration(req, { id: 'cred-1' })).rejects.toThrow('No passkey registration in progress')
  })

  it('refuses when there is no challenge to check against', async () => {
    await expect(passkey.verifyRegistration(buildReq(), { id: 'cred-1' })).rejects.toThrow('No passkey registration in progress')
    expect(webauthn.verifyRegistrationResponse).not.toHaveBeenCalled()
  })

  it('refuses an unverified response', async () => {
    webauthn.verifyRegistrationResponse.mockResolvedValue({ verified: false })
    const req = buildReq({ passkeyChallenge: 'challenge-1' })

    await expect(passkey.verifyRegistration(req, { id: 'cred-1' })).rejects.toThrow('could not be verified')
  })
})

describe('authenticationOptions', () => {
  it('keeps the challenge in the session', async () => {
    const req = buildReq()
    const options = await passkey.authenticationOptions(req)

    expect(options.challenge).toBe('challenge-2')
    expect(req.session.passkeyChallenge).toBe('challenge-2')
  })

  it('names no credentials, so the authenticator offers what it holds', async () => {
    await passkey.authenticationOptions(buildReq())

    expect(webauthn.generateAuthenticationOptions).toHaveBeenCalledWith(
      expect.objectContaining({ allowCredentials: [] })
    )
  })
})

describe('verifyAuthentication', () => {
  it('returns the new signature counter', async () => {
    webauthn.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 5 }
    })
    const req = buildReq({ passkeyChallenge: 'challenge-2' })

    const counter = await passkey.verifyAuthentication(req, { id: 'cred-1' }, storedCredential)

    expect(counter).toBe(5)
  })

  it('hands the stored credential back as bytes', async () => {
    webauthn.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 5 }
    })
    const req = buildReq({ passkeyChallenge: 'challenge-2' })

    await passkey.verifyAuthentication(req, { id: 'cred-1' }, storedCredential)

    expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: 'challenge-2',
        credential: {
          id: 'cred-1',
          publicKey: publicKeyBytes,
          counter: 4,
          transports: ['internal']
        }
      })
    )
  })

  it('spends the challenge', async () => {
    webauthn.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 5 }
    })
    const req = buildReq({ passkeyChallenge: 'challenge-2' })

    await passkey.verifyAuthentication(req, { id: 'cred-1' }, storedCredential)

    expect(req.session.passkeyChallenge).toBe(undefined)
  })

  it('refuses when there is no challenge to check against', async () => {
    await expect(
      passkey.verifyAuthentication(buildReq(), { id: 'cred-1' }, storedCredential)
    ).rejects.toThrow('No passkey login in progress')
  })

  it('refuses an unverified response', async () => {
    webauthn.verifyAuthenticationResponse.mockResolvedValue({ verified: false })
    const req = buildReq({ passkeyChallenge: 'challenge-2' })

    await expect(
      passkey.verifyAuthentication(req, { id: 'cred-1' }, storedCredential)
    ).rejects.toThrow('could not be verified')
  })
})
