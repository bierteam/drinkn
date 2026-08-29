// Both list pages mirror their active filters into the URL so a filtered view
// can be linked to. This is the part they had copied between them.

// shallow, order-insensitive compare so we skip redundant router navigations
export const sameQuery = (a, b) => {
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  return aKeys.length === bKeys.length
    && aKeys.every((key, index) => key === bKeys[index] && String(a[key]) === String(b[key]))
}

// drops the keys the page owns from the current query and lays the active
// filters back over it, so parameters belonging to anything else survive
export const mergedQuery = (current, keys, filters) => {
  const next = { ...current }
  for (const key of keys) {
    delete next[key]
  }
  return { ...next, ...filters }
}
