# json-schema-defined-mapper

This module creates a mapper function using [JMESPath](http://jmespath.org) to convert an object to a JSON the schema defines.
You can write a JMESPath expression in `description` to extract the defined data against the input data.
[Code blocks](https://www.markdownguide.org/basic-syntax/#code) in [Markdown](https://daringfireball.net/projects/markdown/) with th prefix "`query:`" allow you to define the JMESPath expression in `description`.
Thus, the body of the expression must be wrapped with backtick quotes (\`).

The JSON schema example:

```json
{
  "type": "object",
  "properties": {
    "ProductID": {
      "description": "query:`prod.id`",
      "type": "string"
    },
    "Price": {
      "description": "The price of the product (query:```prod.price[0]```)",
      "type": "number"
    },
    "NumOfParts": {
      "description": "query:```prod.parts[] | length(@)``` is the number of the parts",
      "type": "integer"
    }
  }
}
```

To create a mapper function and execute the mapper against the input object:

```js
const mapper = require('json-schema-defined-mapper');

try {
  const product = await mapper(schema);
} catch (e) {
  console.log(e);
}

console.log(product(
{
  prod: {
    id: 'R2D2',
    price: [ 1000000, 2000000, 3000000 ],
    parts: [
      { name: 'head' },
      { name: 'legs' },
      { name: 'body' },
    ]
  }
}
));
/*
{
  "ProductID": "R2D2",
  "Price": 1000000,
  "NumOfParts": 3
}
*/
```

**Note** that the mapper does **not** validate the output.
If you want to validate the output, please use [ajv](https://www.npmjs.com/package/ajv) or other validators.

## Relative JMESPath

If there exists queries at the different layers in a schema, the JMESPath expressions of the children must be **relative**.

The JSON schema example:

```json
{
  "title": "The house number list for my pets",
  "description": "query:```[*]```",
  "type": "array",
  "items": {
    "description": "query:`pet.house`",
    "type": "number"
  }
}
```

The mapper from the above schema:

```js
const mapper = require('json-schema-defined-mapper');

const houseList = await mapper(schema);
console.log(houseList(
[
  { pet: { name: 'Adele', house: 5 } },
  { pet: { name: 'Joli', house: 2 } },
]
));
// [ 5, 2 ]
```

In the above example, the expression `[*]` at the first layer extracts each element from the input array.
The expression `pet.house` at the second layer is evaluated for each element (object) from the first layer.

## oneOf, anyOf, and allOf

A result of `oneOf`, `anyOf`, or `allOf` is extracted as follows:

* `oneOf`: returns the first non-null value in the condition array.
* `anyOf` and `allOf`: returns the composite object if an object type is found in the condition array; otherwise, returns a first non-null value in the array.

## Not supported

* Object:
  * [Property names](https://json-schema.org/understanding-json-schema/reference/object.html#property-names) and [Pattern Properties](https://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties)
  * [Property dependencie](https://json-schema.org/understanding-json-schema/reference/object.html#property-dependencies) and [Schema dependencies](https://json-schema.org/understanding-json-schema/reference/object.html#schema-dependencies)
* Combining schemas:
  * [not](https://json-schema.org/understanding-json-schema/reference/combining.html#not)

## More examples

Please see [the samples](https://github.com/paclearner/json-schema-defined-mapper/tree/main/test/samples):

* `*.schema.json`: the JSON schema file.
* `*.input.json`: an input for the mapper which the schema creates.
* `*.expected.json`: the expected mapper output against the input.

## License

[MIT](LICENSE)
