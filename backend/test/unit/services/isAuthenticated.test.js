const isAuthenticated = require('../../../services/isAuthenticated')

const mockRes = () => {
  const res = {}
  res.status = jest.fn(() => res)
  res.send = jest.fn(() => res)
  return res
}

describe('isAuthenticated', () => {
  it('lets a request with a session through', () => {
    const next = jest.fn()
    const res = mockRes()

    isAuthenticated({ session: { userId: 'user-1' } }, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('rejects a request with no session', () => {
    const next = jest.fn()
    const res = mockRes()

    isAuthenticated({ session: {} }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('rejects a request with no session object at all', () => {
    const next = jest.fn()
    const res = mockRes()

    // the optional chain means a missing session must not throw
    isAuthenticated({}, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('does not accept a session that only carries a username', () => {
    const next = jest.fn()
    const res = mockRes()

    isAuthenticated({ session: { username: 'oscar' } }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })
})

describe('isAuthenticated with DEVMODE', () => {
  const original = process.env.DEVMODE

  afterEach(() => {
    process.env.DEVMODE = original
    if (original === undefined) delete process.env.DEVMODE
    jest.resetModules()
  })

  it('waves everything through', () => {
    // devmode is read at module load, so the module has to be re-required
    process.env.DEVMODE = '1'
    jest.resetModules()
    const devIsAuthenticated = require('../../../services/isAuthenticated')

    const next = jest.fn()
    const res = mockRes()
    jest.spyOn(console, 'log').mockImplementation(() => {})

    devIsAuthenticated({}, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
