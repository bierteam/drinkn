// uuid v14 is esm-only, and jest can't require() it on the node the test image
// runs. the model wants it for the _id default, which nothing here asserts on,
// so a factory mock keeps the real module from ever loading.
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000000' }))

// the api tests all jest.mock the user model, so the real schema — and its
// middleware — was never loaded by the suite. these load it for real.
const bcrypt = require('bcryptjs')
const user = require('../../../models/user')

// mongoose registers its own callback-style hooks alongside ours; ours are the
// anonymous async ones
const appHooks = name => (user.schema.s.hooks._pres.get(name) || [])
  .map(pre => pre.fn)
  .filter(fn => fn.constructor.name === 'AsyncFunction')

describe('user model middleware', () => {
  // mongoose 9 stopped passing `next` to async middleware, so a hook that
  // declares one dies with "next is not a function" the first time it runs
  it.each(['save', 'updateOne', 'findOneAndUpdate'])(
    'registers a %s hook that takes no callback argument',
    name => {
      const hooks = appHooks(name)
      expect(hooks).toHaveLength(1)
      expect(hooks[0].length).toBe(0)
    }
  )

  it('hashes the password before saving', async () => {
    const doc = new user({ username: 'oscar', password: 'hunter2' })

    await appHooks('save')[0].call(doc)

    expect(doc.password).not.toBe('hunter2')
    expect(await bcrypt.compare('hunter2', doc.password)).toBe(true)
  })

  it('hashes the password on update', async () => {
    const context = { _update: { $set: { password: 'hunter2' } } }

    await appHooks('findOneAndUpdate')[0].call(context)

    const hash = context._update.$set.password
    expect(hash).not.toBe('hunter2')
    expect(await bcrypt.compare('hunter2', hash)).toBe(true)
  })

  it('leaves updates without a password alone', async () => {
    const context = { _update: { $set: { admin: true } } }

    await appHooks('updateOne')[0].call(context)

    expect(context._update.$set).toEqual({ admin: true })
  })
})
