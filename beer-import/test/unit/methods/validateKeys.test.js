const validateKeys = require('../../../services/validateKeys')
const mandatoryKeys = ['uid', 'name', 'date']
const logger = require('../../../models/log')

const obj = {
  uid: '123',
  name: 'test',
  value: '',
  date: ''
}

test('Expect validateKeys to return false on an incorrect object', () => {
  jest.spyOn(logger, 'create')
    .mockImplementationOnce(() => Promise.resolve())
  expect(validateKeys(obj, mandatoryKeys)
  ).toBeFalsy()
})
