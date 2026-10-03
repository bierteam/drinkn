const sources = require('../../../sources')

test('every registered source satisfies the adapter contract', () => {
  // the pipeline calls exactly these four and knows nothing else about a source
  expect(sources.length).toBeGreaterThan(0)
  for (const source of sources) {
    expect(typeof source.name).toBe('string')
    expect(typeof source.enabled).toBe('function')
    expect(typeof source.fetch).toBe('function')
    expect(typeof source.normalise).toBe('function')
  }
})

test('registers biernet and ah', () => {
  expect(sources.map(s => s.name).sort()).toEqual(['ah', 'biernet'])
})
