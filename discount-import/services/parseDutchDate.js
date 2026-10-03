const moment = require('moment')
require('moment/locale/nl')
moment.locale('nl')

// biernet writes offer end dates as "dinsdag 15 augustus" -- a weekday, a day
// and a month, with no year.
//
// The obvious parse, moment(raw, 'dddd DD MMMM'), is wrong in a way that hides
// itself. moment cross-checks the named weekday against the weekday the parsed
// date actually falls on, and defaults the year to the current one. So an offer
// ending "donderdag 2 januari", read in December, is resolved against *this*
// year, lands on a different weekday, and moment returns an invalid date. The
// importer then stores no validity at all, and the read path -- which filters on
// `validity: { $gte: now }` -- drops the offer entirely. Every offer that spans
// New Year disappears from the app.
//
// The weekday is redundant with the day and month, so it is dropped rather than
// validated, and the year is chosen instead of assumed.
const parseDutchDate = (raw, now = new Date()) => {
  if (!raw) return null

  // strip the leading weekday name; what is left is "15 augustus"
  const withoutWeekday = String(raw).trim().replace(/^\p{L}+\s+/u, '')
  const reference = moment(now)

  const parsed = moment(withoutWeekday, 'D MMMM', 'nl')
  if (!parsed.isValid()) return null

  parsed.year(reference.year())

  // an end date that already looks well past is next year's, not this year's.
  // The month of slack keeps a genuinely just-expired offer from being pushed
  // twelve months into the future.
  if (parsed.diff(reference, 'days') < -31) {
    parsed.add(1, 'year')
  }

  return parsed.toDate()
}

module.exports = parseDutchDate
