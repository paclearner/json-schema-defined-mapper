const cleanDeep = require('clean-deep');
const jmespath = require('@gorillastack/jmespath');
const parser = require('json-schema-ref-parser');

const queryFromDescription = require('./query');

const isEmpty = (obj) => (Object.keys(obj).length === 0);
const isObject = (obj) => (typeof obj === 'object' && !Array.isArray(obj));
const pass = (obj) => (obj);

class Mapper {
  static query(schema) {
    if (!schema.description) {
      return null;
    }
    const query = queryFromDescription(schema.description);
    if (!query) {
      return null;
    }
    const ast = jmespath.compile(query); // throw error
    return (obj) => jmespath.interpret(obj, ast);
  }

  static conditionsFunctions(conditions) {
    return conditions
      .map((condition) => Mapper.createFunction(condition))
      .filter((f) => (typeof f === 'function'));
  }

  static combinationFunction(conditions, doBreak) {
    const conditionFunctions = Mapper.conditionsFunctions(conditions);
    return (obj) => {
      let res = {};
      for (let i = 0; i < conditionFunctions.length; i += 1) {
        const val = conditionFunctions[i](obj);
        if (val === null) {
          continue; // eslint-disable-line no-continue
        }
        if (doBreak) {
          res = val;
          break;
        }
        res = isObject(val) ? Object.assign(res, val) : val;
      }
      if (isObject(res)) {
        res = cleanDeep(res);
        res = isEmpty(res) ? null : res;
      }
      return res;
    };
  }

  static propertiesFunctions(schema) {
    const propertiesFunctions = Object
      .keys(schema.properties || {})
      .reduce((functions, prop) => {
        const f = Mapper.createFunction(schema.properties[prop]);
        if (f) {
          functions[prop] = f; // eslint-disable-line no-param-reassign
        }
        return functions;
      }, {});
    return (Object.keys(propertiesFunctions).length === 0) ? null : propertiesFunctions;
  }

  static objectFunction(schema) {
    let query = Mapper.query(schema);
    const propertiesFunctions = Mapper.propertiesFunctions(schema);
    if (!propertiesFunctions) {
      return query ? (obj) => query(obj) : null;
    }
    if (!query) {
      query = pass;
    }
    const properties = Object.keys(propertiesFunctions);

    return (obj) => {
      const object = query(obj);
      const res = {};
      for (let i = 0; i < properties.length; i += 1) {
        res[properties[i]] = propertiesFunctions[properties[i]](object);
      }
      return res;
    };
  }

  static itemsFunction(schema) {
    if (!schema.items) {
      return pass;
    }
    const f = Mapper.createFunction(schema.items);
    return (!f) ? pass : f;
  }

  static arrayFunction(schema) {
    const query = Mapper.query(schema);
    if (!query) {
      return null;
    }
    const itemsFunction = Mapper.itemsFunction(schema);

    return (obj) => {
      const array = query(obj);
      const res = [];
      if (!Array.isArray(array)) {
        return res;
      }
      for (let i = 0; i < array.length; i += 1) {
        res.push(itemsFunction(array[i]));
      }
      return res;
    };
  }

  static createFunction(schema) {
    if (!schema.type) {
      if (schema.properties) {
        return Mapper.objectFunction(schema);
      }
      if (schema.items) {
        return Mapper.arrayFunction(schema);
      }
      if (schema.oneOf) {
        return Mapper.combinationFunction(schema.oneOf, true);
      }
      if (schema.anyOf) {
        return Mapper.combinationFunction(schema.anyOf, false);
      }
      if (schema.allOf) {
        return Mapper.combinationFunction(schema.allOf, false);
      }
      return Mapper.objectFunction(schema);
    }
    if (schema.type === 'object') {
      return Mapper.objectFunction(schema);
    }
    if (schema.type === 'array') {
      return Mapper.arrayFunction(schema);
    }
    // primitive
    return Mapper.query(schema);
  }

  static async create(schema) {
    const dref = await parser.dereference(schema);
    JSON.stringify(dref); // workaround: circular structure to JSON
    const f = Mapper.createFunction(dref);
    if (!f) {
      throw new Error('nothing created');
    }
    return f;
  }
}

module.exports = (doc) => Mapper.create(doc);
