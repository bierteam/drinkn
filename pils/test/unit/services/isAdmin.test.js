/* global describe, it, expect, jest, afterEach */
const isAdmin = require('../../../services/isAdmin')

const mockRes = () => {
  const res = {}
  res.status = jest.fn(() => res)
  res.send = jest.fn(() => res)
  return res
}

describe('isAdmin', () => {
  it('lets an admin session through', () => {
    const next = jest.fn()
    const res = mockRes()

    isAdmin({ session: { userId: 'user-1', admin: true } }, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('refuses a signed-in non-admin with 403', () => {
    const next = jest.fn()
    const res = mockRes()

    isAdmin({ session: { userId: 'user-1', admin: false } }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('refuses a session with no admin flag at all', () => {
    const next = jest.fn()
    const res = mockRes()

    // this is the boundary the client-side isAdmin toggle cannot cross:
    // flipping localStorage reveals the menu, but the API still says no
    isAdmin({ session: { userId: 'user-1' } }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('refuses an anonymous request with 401', () => {
    const next = jest.fn()
    const res = mockRes()

    isAdmin({ session: {} }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('refuses a request with no session object at all', () => {
    const next = jest.fn()
    const res = mockRes()

    isAdmin({}, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('does not treat a truthy non-boolean admin value as a rejection', () => {
    const next = jest.fn()
    const res = mockRes()

    isAdmin({ session: { userId: 'user-1', admin: 'yes' } }, res, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('isAdmin with DEVMODE', () => {
  const original = process.env.DEVMODE

  afterEach(() => {
    process.env.DEVMODE = original
    if (original === undefined) delete process.env.DEVMODE
    jest.resetModules()
  })

  it('grants admin to anyone', () => {
    process.env.DEVMODE = '1'
    jest.resetModules()
    const devIsAdmin = require('../../../services/isAdmin')

    const next = jest.fn()
    const res = mockRes()
    jest.spyOn(console, 'log').mockImplementation(() => {})

    devIsAdmin({}, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
