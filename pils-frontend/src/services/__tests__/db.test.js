// must come first: db.js opens the database at module scope, so the global
// indexedDB has to exist before that module is evaluated
import 'fake-indexeddb/auto'

import { describe, it, expect } from 'vitest'
import { openDB } from 'idb'
import { getCachedData, setCachedData } from '../db.js'

describe('db', () => {
  it('creates the data object store on first open', async () => {
    // forces db.js to run its upgrade callback
    await setCachedData('bootstrap', 1)

    const db = await openDB('cache-db', 1)
    expect([...db.objectStoreNames]).toContain('data')
    db.close()
  })

  it('round-trips a value', async () => {
    await setCachedData('discounts', [{ id: 'a', brand: 'Alfa' }])
    expect(await getCachedData('discounts')).toEqual([{ id: 'a', brand: 'Alfa' }])
  })

  it('returns undefined for a key that was never written', async () => {
    // the caching code leans on this being falsy rather than throwing
    expect(await getCachedData('never-written')).toBe(undefined)
  })

  it('overwrites an existing key rather than appending', async () => {
    await setCachedData('onlineCounter', 2)
    await setCachedData('onlineCounter', 5)
    expect(await getCachedData('onlineCounter')).toBe(5)
  })

  it('keeps separate keys independent', async () => {
    await setCachedData('stores', ['AH', 'Jumbo'])
    await setCachedData('volumes', ['330ml', '500ml'])

    expect(await getCachedData('stores')).toEqual(['AH', 'Jumbo'])
    expect(await getCachedData('volumes')).toEqual(['330ml', '500ml'])
  })

  it('stores the shapes Discounts actually caches', async () => {
    const discounts = [
      { id: 'a', brand: 'Alfa', pricing: { newPrice: 100, literPrice: 200 }, uri: null },
      { id: 'b', brand: 'Brand', pricing: { newPrice: 150, literPrice: 500 }, uri: 'https://x' }
    ]
    await setCachedData('discounts', discounts)
    await setCachedData('literAverage', [200, 500])
    await setCachedData('onlineCounter', 1)

    expect(await getCachedData('discounts')).toEqual(discounts)
    expect(await getCachedData('literAverage')).toEqual([200, 500])
    expect(await getCachedData('onlineCounter')).toBe(1)
  })

  it('persists through a separate connection', async () => {
    await setCachedData('percentageAverage', [50, 50])

    // read it back outside the module's own cached connection, proving the
    // value really landed in the store
    const db = await openDB('cache-db', 1)
    expect(await db.get('data', 'percentageAverage')).toEqual([50, 50])
    db.close()
  })
})
