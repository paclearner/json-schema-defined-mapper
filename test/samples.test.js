const fs = require('fs');
const path = require('path');

const mapper = require('../lib/mapper');

const readJson = (f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));

const readSample = (p) => {
  const schema = readJson(`${p}/schema.json`);
  const input = readJson(`${p}/input.json`);
  const expected = readJson(`${p}/expected.json`);
  return { schema, input, expected };
};

const samplesDirs = (root) => fs.readdirSync(root, { withFileTypes: true })
  .filter((p) => p.isDirectory())
  .flatMap((p) => {
    const current = `${root}/${p.name}`;
    try {
      fs.statSync(`${current}/expected.json`);
    } catch (e) {
      return [].concat(samplesDirs(current));
    }
    return [current].concat(samplesDirs(current));
  });

describe('mappers in samples', () => {
  samplesDirs('./test/samples').forEach((p) => {
    test(`should return ${p}/expected.json`, async () => {
      const { schema, input, expected } = readSample(p);
      const f = await mapper(schema);
      const acctual = await f(input);
      expect(acctual).toStrictEqual(expected);
    });
  });
});
