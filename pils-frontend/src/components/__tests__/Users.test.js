import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Users from '../Users.vue'
import { store } from '../../store.js'

const get = vi.hoisted(() => vi.fn())

vi.mock('../../services/Api', () => ({
  default: () => ({ get })
}))

const users = [
  { _id: 'user-1', username: 'oscar', admin: true },
  { _id: 'user-2', username: 'nino', admin: false }
]

const mountUsers = async () => {
  const wrapper = mount(Users, {
    global: {
      stubs: { 'router-link': { template: '<a><slot /></a>', props: ['to'] } }
    }
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  get.mockReset()
  store.logout()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Users', () => {
  it('loads the user list on create', async () => {
    get.mockResolvedValue({ status: 200, data: users })
    const wrapper = await mountUsers()

    expect(get).toHaveBeenCalledWith('/api/v1/users', {})
    expect(wrapper.vm.users).toEqual(users)
  })

  it('renders one row per user', async () => {
    get.mockResolvedValue({ status: 200, data: users })
    const wrapper = await mountUsers()

    // the table ends with a static "Add" row, so there is one extra <tr>
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(users.length + 1)
    expect(rows[0].text()).toContain('oscar')
    expect(rows[1].text()).toContain('nino')
    expect(rows[rows.length - 1].text()).toContain('Add')
  })

  it('marks which users are admins', async () => {
    get.mockResolvedValue({ status: 200, data: users })
    const wrapper = await mountUsers()

    const boxes = wrapper.findAll('tbody input[type="checkbox"]')
    expect(boxes[0].element.checked).toBe(true)
    expect(boxes[1].element.checked).toBe(false)
  })

  it('ignores a non-200 response', async () => {
    get.mockResolvedValue({ status: 204, data: users })
    const wrapper = await mountUsers()

    expect(wrapper.vm.users).toEqual([])
  })

  it('surfaces the server message on failure', async () => {
    get.mockRejectedValue({ response: { data: 'Forbidden' } })
    const wrapper = await mountUsers()

    expect(wrapper.vm.error).toBe('Forbidden')
    expect(wrapper.find('.notification.is-danger').text()).toContain('Forbidden')
  })
})
