const parseDutchDate = require('../../../services/parseDutchDate')

const on = iso => new Date(iso)

test('parses a weekday-day-month string', () => {
  const result = parseDutchDate('zaterdag 5 september', on('2026-08-30T12:00:00Z'))
  expect(result.getFullYear()).toBe(2026)
  expect(result.getMonth()).toBe(8) // september
  expect(result.getDate()).toBe(5)
})

test('rolls an end date over the year boundary', () => {
  // the bug this file exists for: moment(raw, 'dddd DD MMMM') defaults to the
  // current year and then rejects the parse because the weekday no longer
  // matches, so the importer stored no validity and the read path -- which
  // filters on validity -- dropped every offer spanning New Year.
  const result = parseDutchDate('donderdag 2 januari', on('2026-12-20T12:00:00Z'))
  expect(result.getFullYear()).toBe(2027)
  expect(result.getMonth()).toBe(0)
  expect(result.getDate()).toBe(2)
})

test('does not push a recently expired date a year out', () => {
  const result = parseDutchDate('maandag 10 augustus', on('2026-08-30T12:00:00Z'))
  expect(result.getFullYear()).toBe(2026)
})

test('ignores a weekday that contradicts the date', () => {
  // 15 August 2026 is a Saturday, not a Tuesday. The day and month are the
  // information; the weekday is decoration.
  const result = parseDutchDate('dinsdag 15 augustus', on('2026-08-30T12:00:00Z'))
  expect(result).not.toBeNull()
  expect(result.getDate()).toBe(15)
})

test('returns null for input that is not a date', () => {
  expect(parseDutchDate('', on('2026-08-30T12:00:00Z'))).toBeNull()
  expect(parseDutchDate(null, on('2026-08-30T12:00:00Z'))).toBeNull()
  expect(parseDutchDate('binnenkort', on('2026-08-30T12:00:00Z'))).toBeNull()
})
