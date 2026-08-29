// Replaces the two vue2-filters mixin helpers the tables actually use.
// Behaviour is deliberately identical to vue2-filters 0.14, including the
// quirks: a null or undefined search returns the list untouched, an empty
// string matches everything, and the search walks nested plain objects and
// arrays but stringifies anything else (a Date compares by its toString,
// it is not descended into).

const isPlainObject = value => Object.prototype.toString.call(value) === '[object Object]'

const contains = (value, search) => {
  if (isPlainObject(value)) {
    return Object.values(value).some(entry => contains(entry, search))
  }
  if (Array.isArray(value)) {
    return value.some(entry => contains(entry, search))
  }
  if (value === null || value === undefined) {
    return false
  }
  return value.toString().toLowerCase().includes(search)
}

const getPath = (object, path) =>
  path.split('.').reduce((step, key) => (step === null || step === undefined ? undefined : step[key]), object)

export const filterBy = (array, search) => {
  if (!Array.isArray(array)) return []
  if (search === null || search === undefined) return array

  const needle = String(search).toLowerCase()
  return array.filter(item => contains(item, needle))
}

export const orderBy = (array, key, order = 1) => {
  if (!Array.isArray(array)) return []
  if (!key) return array

  const direction = order < 0 ? -1 : 1
  const value = item => {
    const raw = (typeof item === 'object' && item !== null) ? getPath(item, key) : item
    return typeof raw === 'string' ? raw.toLowerCase() : raw
  }

  // sorts a copy, so the caller's array is left alone
  return array.slice().sort((a, b) => {
    const left = value(a)
    const right = value(b)
    if (left === right) return 0
    return left > right ? direction : -direction
  })
}

export const useArrayFilters = () => ({ filterBy, orderBy })
