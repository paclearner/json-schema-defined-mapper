const commonmark = require('commonmark');

const PREFIX = 'query:';

const queryCode = (node) => {
  /* eslint no-underscore-dangle: ["error", { "allow": ["_prev", "_type", "_literal"] }] */
  if (node._type !== 'code') {
    return null;
  }
  if (!node._prev) {
    return null;
  }
  if (node._prev._type !== 'text') {
    return null;
  }
  if (!node._prev._literal.endsWith(PREFIX)) {
    return null;
  }
  return node._literal;
};

module.exports = (description) => {
  const walker = (new commonmark.Parser()).parse(description).walker();
  for (let event = walker.next(); (event); event = walker.next()) {
    const query = queryCode(event.node);
    if (query) {
      return query;
    }
  }
  return null;
};
