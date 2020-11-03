const query = require('../lib/query');

const replaceQuery = (description, q) => description.replace('@query', q);

describe('query', () => {
  test('should return no query', () => {
    expect(query('query:')).toBeNull();
    expect(query('query: is invalid')).toBeNull();
    expect(query('There is no query.')).toBeNull();
    expect(query('There is no query: in this description')).toBeNull();
    expect(query('empty query is query:``')).toBeNull();
  });

  test('should return the query in the description', () => {
    const q = 'length(@)';
    const description = `How many items to return at one time. This value is extraced from query:\`${q}\` and it must be interger.`;
    expect(query(replaceQuery(description, q))).toEqual(q);
  });

  test('should return the query when the description has only query', () => {
    const q = '[*]';
    expect(query(replaceQuery('query:`@query`', q))).toEqual(q);
    expect(query(replaceQuery('query:```@query```', q))).toEqual(q);
  });

  test('should return the prefix query in the description', () => {
    const q = 'length(@)';
    expect(query(replaceQuery('query:`@query` is valid', q))).toEqual(q);
    expect(query(replaceQuery('query:```@query``` is valid', q))).toEqual(q);
  });

  test('should return the suffix query in the description', () => {
    const q = '[*]';
    expect(query(replaceQuery('This is a query:`@query`', q))).toEqual(q);
    expect(query(replaceQuery('This is a query:```@query```', q))).toEqual(q);
  });

  test('should return the query with three backticks', () => {
    const q = 'people[?age > `20`].[name, age]';
    expect(query(replaceQuery('This is a query:```@query``` with backquote', q))).toEqual(q);
  });

  test('should return the invalid query with one backtick', () => {
    const q = 'people[?age > `20`].[name, age]';
    expect(query(replaceQuery('This is a query:`@query` with backquote', q))).toEqual('people[?age > ');
  });

  test('should return the first query in the description', () => {
    const q1 = 'people[?age > `20`].[name, age]';
    const q2 = '[*]';
    const q3 = 'length(@)';
    expect(query(`query:\`\`\`${q1}\`\`\` \`${q2}\` \`\`\`${q3}\`\`\``)).toEqual(q1);
    expect(query(`\`\`\`${q1}\`\`\`query:\`${q2}\` \`${q3}\``)).toEqual(q2);
    expect(query(`query:\`\`\`${q1}\`\`\`query:\`${q2}\`query:\`${q3}\``)).toEqual(q1);
    expect(query(`a prefix code \`\`\`${q1}\`\`\`query:\`${q2}\` and a suffix code \`${q3}\``)).toEqual(q2);
    expect(query(`This is the first query:\`\`\`${q1}\`\`\`query:\`${q2}\`query:\`${q3}\``)).toEqual(q1);
    expect(query(`query:\`\`\`${q1}\`\`\`query:\`${q2}\`query:\`${q3}\` is ignored`)).toEqual(q1);
    expect(query(`[GitHub](https://github.com)\`\`\`${q1}\`\`\`query:\`${q2}\``)).toEqual(q2);
  });

  test('should return the queries in the JMESpath Tutorial and Example', () => {
    const queries = [
      'a',
      'a.b.c.d',
      '[1]',
      'a.b.c[0].d[1][0]',
      '[0:5]',
      '[5:10]',
      '[:5]',
      '[::2]',
      '[::-1]',
      'people[*].first',
      'people[:2].first',
      'ops.*.numArgs',
      'reservations[*].instances[*].state',
      '[]',
      'machines[?state==\'running\'].name',
      'people[*].first | [0]',
      'people[].[name, state.name]',
      'people[].{Name: name, State: state.name}',
      'length(people)',
      'max_by(people, &age).name',
      'myarray[?contains(@, \'foo\') == `true`]',
      'people[?age > `20`].[name, age]',
      'people[?age > `20`].{name: name, age: age}',
      'people[*].{name: name, tags: tags[0]}',
      'reservations[].instances[].[tags[?Key==\'Name\'].Values[] | [0], type, state.name]',
      'people[?general.id==`100`].general | [0]',
      'people[?general.id==`100`] | [0].general',
      'sort_by(Contents, &Date)[*].{Key: Key, Size: Size}',
      'locations[?state == \'WA\'].name | sort(@)[-2:] | {WashingtonCities: join(\', \', @)}',
    ];
    const results = [];
    queries.forEach((q) => results.push(query(`query:\`\`\`${q}\`\`\``)));
    expect(queries).toEqual(results);
  });
});
