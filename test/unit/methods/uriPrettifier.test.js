/* global test, expect */
const uriPrettifier = require('./uriPrettifier')

test('expect a clean url back', () => {
  expect(
    uriPrettifier(
      'http://test.nl/click/camref:1100lrUH/pubref:B-107177125--D---P-aanbiedingen--M-brand-dubbelbock--S-blik-van-050-liter--/destination:https%3A%2F%2Fwww.test.nl%2Fproducten%2Fproduct%2Fwi398872%2Fbrand-dubbelbock-dubbel-gerijpt'
    )
  ).toBe(
    'https://www.test.nl/producten/product/wi398872/brand-dubbelbock-dubbel-gerijpt'
  )
})
