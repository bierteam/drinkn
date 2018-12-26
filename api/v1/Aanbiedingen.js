// router.get('/api/v1/aanbiedingen', function (req, res) {
//   counter.findOne({}).exec(function (err, result) {
//     batch = result.counter
//     if (err) throw err
//   })
//   let query = beer.find({ batch })
//   query.exec(function (err, results) {
//     if (err) throw err
//     res.json(results)
//   })
// })
//
// // Example on how to get data for specific store
// router.get('/api/v1/aanbiedingen:store', function (req, res) {
//   let store = req.params.store
//   counter.findOne({}).exec(function (err, result) {
//     batch = result.counter
//     if (err) throw err
//   })
//   let query = beer.find({ batch, store }) // .limit(5) // limit on 5 for testing purposes
//   query.exec(function (err, results) {
//     if (err) throw err
//     res.json(results)
//   })
// })
