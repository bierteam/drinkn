import { describe, it, expect, vi, afterEach } from 'vitest'
import { describe as shape, tag, log } from '../passkeyError'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('shape', () => {
  it('pulls the wrapper and the original apart', () => {
    // @simplewebauthn wraps the DOMException, so the useful detail is split
    // between the two objects
    const error = Object.assign(new Error('outer'), {
      name: 'NotAllowedError',
      code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
      cause: Object.assign(new Error('inner'), { name: 'AbortError' })
    })

    expect(shape(error)).toEqual({
      name: 'NotAllowedError',
      code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
      message: 'outer',
      causeName: 'AbortError',
      causeMessage: 'inner'
    })
  })

  it('survives something that is not an error at all', () => {
    expect(shape(undefined)).toEqual({
      name: undefined,
      code: undefined,
      message: undefined,
      causeName: undefined,
      causeMessage: undefined
    })
  })
})

describe('tag', () => {
  it('joins what it has, most specific first', () => {
    expect(tag({ code: 'ERROR_CEREMONY_ABORTED', name: 'AbortError', causeName: 'AbortError' }))
      .toBe('ERROR_CEREMONY_ABORTED / AbortError / AbortError')
  })

  it('skips the parts that are missing', () => {
    expect(tag({ name: 'NotAllowedError' })).toBe('NotAllowedError')
  })

  it('says so rather than rendering an empty string', () => {
    expect(tag({})).toBe('no error name')
  })
})

describe('log', () => {
  it('writes the detail out and hands it back', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = Object.assign(new Error('nope'), { name: 'NotAllowedError' })

    const detail = log('registration', error)

    expect(detail.name).toBe('NotAllowedError')
    expect(spy).toHaveBeenCalledWith('[passkey] registration', detail, error)
  })
})
