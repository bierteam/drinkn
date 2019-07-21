/* global test, expect */
const joinObjects = require('./joinObjects')

let obj1 = [{
  'uid': '123',
  'name': 'test'
},
{
  'uid': '1234',
  'name': 'test2'
}
]

let obj2 = [{
  'uid2': '123',
  'name': 'test3'
},
{
  'uid2': '1234',
  'name2': 'test4'
}
]

const expectedResult = [ { uid: '123', name: 'test', uid2: '123', test_name: 'test3' }, { uid: '1234', name: 'test2', uid2: '1234', name2: 'test4' } ]

test('Expect 2 objects to join correctly', () => {
  expect(joinObjects(obj1, obj2, 'uid', 'uid2', 'test')
  ).toEqual(expectedResult)
})
