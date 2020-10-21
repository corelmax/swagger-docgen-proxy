export function typeTheObject(obj) {
  let prop = {};

  if (obj === null) {
    return {
      type: 'string',
    };
  }

  if (typeof obj === 'boolean') {
    prop.type = 'boolean';
    return prop;
  }
  if (typeof obj === 'number' || typeof obj === 'bigint' || !isNaN(obj)) {
    prop.type = 'number';
    return prop;
  }

  if (Array.isArray(obj)) {
    prop.type = 'array';
    let types = [];
    for (const item in obj) {
      types.push(typeTheObject(item));
    }
    prop.items = {
      anyOf: [...new Set(types.map((t) => t.type))].map(t => ({ type: t})),
    };
    return prop;
  }

  if (typeof obj === 'object') {
    prop.type = 'object';
    prop.properties = {};

    for (const key in obj) {
      prop.properties[key] = typeTheObject(obj[key]);
    }
    return prop;
  }

  if (typeof obj === 'undefined') {
    return undefined;
  }

  prop.type = 'string';
  return prop;
}
