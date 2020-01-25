/* global test, expect */
const validateKeys = require('../../../services/validateKeys')
const mandatoryKeys = ['uid', 'name', 'date']

const obj = {
  uid: '123',
  name: 'test',
  value: '',
  date: ''
}

test('Expect validateKeys to return false on an incorrect object', () => {
  expect(validateKeys(obj, mandatoryKeys)
  ).toBeFalsy()
})
