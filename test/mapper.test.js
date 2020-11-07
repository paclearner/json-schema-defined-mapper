const mapper = require('../lib/mapper');

describe('mapper', () => {
  describe('query', () => {
    test('should throw a jmepath compile error', async () => {
      await expect(mapper({ type: 'object', description: 'query:`[[[`' }))
        .rejects
        .toThrow(new RegExp('Invalid'));
    });
  });

  describe('create', () => {
    test('should throw a invalid $ref error', async () => {
      const schema = {
        invalid: { $ref: '#/foo/bar' },
        foo: { a: true },
      };
      await expect(mapper(schema)).rejects.toThrow(/bar/);
    });

    test('should throw a circular error', async () => {
      const schema = {
        invalid: { properties: { invalid: { $ref: '#/invalid' } } },
      };
      await expect(mapper(schema)).rejects.toThrow(/circular/i);
    });

    test('should throw a nothing generated error', async () => {
      const schema = { a: 'string' };
      await expect(mapper(schema)).rejects.toThrow(/nothing/i);
    });
  });
});
