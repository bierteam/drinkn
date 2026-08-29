import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Storemapping from '../Storemapping.vue'

const get = vi.hoisted(() => vi.fn())
const post = vi.hoisted(() => vi.fn())
const del = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ get, post, delete: del })
}))

// the API returns the mapping document, mongo bookkeeping fields included
const document = () => ({ _id: 'doc-1', __v: 0, ah: 'Albert Heijn', jum: 'Jumbo' })

const mountStoremapping = async () => {
  const wrapper = mount(Storemapping)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  del.mockReset()
  get.mockResolvedValue({ data: document() })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Get', () => {
  it('loads the mapping and strips the mongo fields', async () => {
    const wrapper = await mountStoremapping()

    expect(get).toHaveBeenCalledWith('/api/v1/stores', {})
    expect(wrapper.vm.stores).toEqual({ ah: 'Albert Heijn', jum: 'Jumbo' })
    expect(wrapper.vm.stores._id).toBe(undefined)
    expect(wrapper.vm.stores.__v).toBe(undefined)
  })

  it('renders a row per mapped store', async () => {
    const wrapper = await mountStoremapping()
    // the table ends with a static spacer row, so there is one extra <tr>
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0].find('input').element.value).toBe('Albert Heijn')
    expect(rows[1].find('input').element.value).toBe('Jumbo')
  })

  it('logs and keeps going when the load fails', async () => {
    get.mockRejectedValue(new Error('Boom'))
    const wrapper = await mountStoremapping()

    expect(wrapper.vm.stores).toEqual({})
  })
})

describe('Update', () => {
  it('posts the pending edits and clears the draft', async () => {
    post.mockResolvedValue({ data: { _id: 'doc-1', __v: 1, ah: 'AH', jum: 'Jumbo' } })
    const wrapper = await mountStoremapping()
    wrapper.vm.newStores = { ah: 'AH' }

    wrapper.vm.Update()
    await flushPromises()

    expect(post).toHaveBeenCalledWith('/api/v1/stores', { newStores: { ah: 'AH' } })
    expect(wrapper.vm.stores).toEqual({ ah: 'AH', jum: 'Jumbo' })
    expect(wrapper.vm.newStores).toEqual({})
    expect(wrapper.vm.isSaved).toBe(true)
    expect(wrapper.vm.isSaving).toBe(false)
  })

  it('flags an error and stops the spinner when the save fails', async () => {
    post.mockRejectedValue(new Error('Boom'))
    const wrapper = await mountStoremapping()

    wrapper.vm.Update()
    await flushPromises()

    expect(wrapper.vm.isError).toBe(true)
    expect(wrapper.vm.isSaving).toBe(false)
    expect(wrapper.vm.isSaved).toBe(false)
  })
})

describe('Cancel', () => {
  it('drops pending edits without touching the server', async () => {
    const wrapper = await mountStoremapping()
    wrapper.vm.newStores = { ah: 'AH' }

    wrapper.vm.Cancel()

    expect(wrapper.vm.newStores).toEqual({})
    expect(post).not.toHaveBeenCalled()
  })
})

describe('Delete', () => {
  it('sends the store to remove in the request body', async () => {
    del.mockResolvedValue({ status: 200 })
    const wrapper = await mountStoremapping()

    wrapper.vm.Delete('ah')
    await flushPromises()

    expect(del).toHaveBeenCalledWith('/api/v1/stores', { data: { remove: 'ah' } })
  })

  it('swallows a delete failure', async () => {
    del.mockRejectedValue(new Error('Boom'))
    const wrapper = await mountStoremapping()

    wrapper.vm.Delete('ah')
    await flushPromises()

    expect(console.error).toHaveBeenCalled()
  })
})
