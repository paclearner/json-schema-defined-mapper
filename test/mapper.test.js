const mapper = require('../lib/mapper');

describe('mapper', () => {
  describe('query', () => {
    it('should throw a jmepath compile error', async () => {
      await expect(mapper({ type: 'object', description: 'query:`[[[`' }))
        .rejects
        .toThrow(new RegExp('Invalid'));
    });
  });

  describe('create', () => {
    it('should throw a invalid $ref error', async () => {
      const schema = {
        invalid: { $ref: '#/foo/bar' },
        foo: { a: true },
      };
      await expect(mapper(schema)).rejects.toThrow(/bar/);
    });

    it('should throw a circular error', async () => {
      const schema = {
        invalid: { properties: { invalid: { $ref: '#/invalid' } } },
      };
      await expect(mapper(schema)).rejects.toThrow(/circular/i);
    });

    it('should throw a nothing generated error', async () => {
      const schema = { a: 'string' };
      await expect(mapper(schema)).rejects.toThrow(/nothing/i);
    });
  });
});
