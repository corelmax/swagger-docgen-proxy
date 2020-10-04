const testObj = {
  theNumber: 1,
  theBool: true,
  theString: 'test',
  theArrayOfNumbers: [
    1, 2, 3, 4
  ],
  theArrayOfStrings: [
    "1", "2", "3", "4"
  ],
  theArrayOfBools: [
    true, false, false, true
  ],
  theObject: {
    theNumberOfObject: 1,
    theBoolOfObject: false,
    theStringOfObject: 'in obj'
  },
  theArrayOfArrays: [
    [1, { theNumber: 1}],
    [2, { theNumber: 2}],
    [3, { theNumber: 3}],
  ],
}

function typeTheObject(obj) {
  let prop = {}
  if(typeof obj === 'boolean') {
    prop.type = 'boolean'
    return prop
  }
  if(typeof obj === 'number' || typeof obj === 'bigint') {
    prop.type = 'number'
    return prop
  }

  if(Array.isArray(obj)) {
    prop.type = 'array'
    let types = []
    for(const item in obj) {
      types.push(typeTheObject(item))
    }
    prop.items = {
      anyOf: [...(new Set(types.map(t => t.type)))],
    }
    return prop
  }

  if(typeof obj === 'object') {
    prop.type = 'object'
    prop.properties = {}

    for(const key in obj) {
      prop.properties[key] = typeTheObject(obj[key])
    }
    return prop
  }

  prop.type = 'string'
  return prop
}
console.log(JSON.stringify(typeTheObject(testObj)))