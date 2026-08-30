// Every amount in this pipeline is an integer number of cents.
//
// The old importer multiplied the source's price string by 100 and stored the
// float that came out, so `9.28` became `927.9999999999999` -- visible in the
// preview fixture to this day. It also stored `literPrice` in euros while
// storing `oldPrice`/`newPrice` in cents, which the view compensated for by
// dividing some fields by 100 and not others. With one source that is merely
// untidy; with two it is a silent data corruption, because whoever writes the
// second adapter has no way to know which fields are in which unit.
const toCents = value => {
  if (value === null || value === undefined || value === '') return null
  // Dutch sources quote prices both ways: "1.99" from biernet, "1,99" in AH's
  // display strings
  const number = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(number)) return null
  return Math.round(number * 100)
}

// cents per litre, given cents and a volume in millilitres
const centsPerLitre = (cents, totalMl) => {
  if (!Number.isFinite(cents) || !Number.isFinite(totalMl) || totalMl <= 0) return null
  return Math.round(cents / totalMl * 1000)
}

module.exports = { toCents, centsPerLitre }
