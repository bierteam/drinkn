const express = require('express')
const router = express.Router()
const isAuthenticated = require('../../services/isAuthenticated')
const { products, facets } = require('../../services/products')
const writeLog = require('../../services/writeLog')
const context = 'Product'

router.get('/products', isAuthenticated, async function (req, res) {
  try {
    const result = await products(req.query)
    writeLog(`${req.session.username}: ${req.session.userId} requested product data`, 'Info', context, req.realIp)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// separate from /products so the filter dropdowns are not recomputed on every
// page of a paged result
router.get('/products/facets', isAuthenticated, async function (req, res) {
  try {
    res.json(await facets())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
