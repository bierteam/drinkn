import { openDB } from 'idb'

const dbPromise = openDB('cache-db', 1, {
  upgrade (db) {
    if (!db.objectStoreNames.contains('data')) {
      db.createObjectStore('data')
    }
  }
})

export async function getCachedData (key) {
  const db = await dbPromise
  return db.get('data', key)
}

export async function setCachedData (key, value) {
  const db = await dbPromise
  return db.put('data', value, key)
}
