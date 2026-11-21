const mongoose = require('mongoose')

// Append-only price history: the thing that makes this app worth more than the
// sources it reads. A discount is only interesting relative to what the beer
// normally costs, and neither source tells you that -- biernet only ever
// publishes offers, and AH's `priceBeforeBonus` is the pre-bonus price, not the
// historic low.
//
// Written on change only, not once per run: a twice-daily import over a
// thousand products would otherwise add three quarters of a million rows a year
// to say nothing happened.
const priceObservationSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  source: { type: String, required: true },
  store: { type: String, required: true },
  // cents, like every other amount here
  price: { type: Number, required: true },
  literPrice: { type: Number, required: false },
  isDiscounted: { type: Boolean, required: true, default: false },
  seenAt: { type: Date, required: true }
}, { autoIndex: true })

priceObservationSchema.index({ productId: 1, seenAt: -1 })

const priceObservation = mongoose.model('priceObservation', priceObservationSchema)
module.exports = priceObservation
