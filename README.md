# sql-strings

[![LOC](./.badges/lines-of-code.svg)](./.badges/lines-of-code.svg)
[![FileCount](./.badges/file-count.svg)](./.badges/file-count.svg)
[![Tests](./.badges/tests.svg)](./.badges/tests.svg)
[![Coverage](./.badges/coverage.svg)](./.badges/coverage.svg)

Write SQL-injection protected SQL statements using template strings. Useful for longer queries and dynamically created queries where keeping the SQL and bind parameters separate becomes disorienting.

```js
import { SQL } from 'sql-strings';

const username = 'bob'; // potentially unsafe input

// postgres:
await client.query(SQL`SELECT * FROM users WHERE username = ${username}`);
// is equivalent to:
await client.query('SELECT * FROM users WHERE username = ?', [username]);

// mysql:
connection.query(SQL`SELECT * FROM users WHERE username = ${username}`());
// is equivalent to:
connection.query('SELECT * FROM users WHERE username = ?', [username]);

// sqlite3:
db.all(...SQL`SELECT * FROM users WHERE username = ${username}`);
// is equivalent to:
db.all('SELECT * FROM users WHERE username = ?', [username]);

// sequelize:
sequelize.query(SQL`SELECT * FROM users WHERE username = ${username}`());
// is equivalent to:
sequelize.query({ query: 'SELECT * FROM users WHERE username = ?', values: [username] });
```

Compatible with [node-sqlite3](https://github.com/TryGhost/node-sqlite3), [Sequelize](https://www.npmjs.com/package/sequelize), [mysql](https://www.npmjs.com/package/mysql), [postgres](https://www.npmjs.com/package/pg), and more!

> **Note:** This is my first npm package and made for learning purposes. Feedback is welcome! I'll keep it updated with bug/security fixes but will not be adding new features. Consider an [alternative](#alternatives) for more features.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). [Node.js v18.17.0](https://nodejs.org/en/download/) or higher is recommended.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```console
$ npm install sql-strings
```

## Recommended Extensions for Syntax Highlighting

These editor extensions will syntax highlight the SQL template strings for better readability:

-   VS Code: [ES6 String HTML](https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html).
-   Sublime Text: [javascript-sql-sublime-syntax](https://github.com/AsterisqueDigital/javascript-sql-sublime-syntax).
-   Vim: [vim-javascript-sql](https://github.com/statico/vim-javascript-sql).

## Usage

Prefix your template strings with `SQL` and use `${}` for bind parameters.

```js
const username = 'bob';
const sql = SQL`SELECT * FROM users WHERE username = ${username}`;
```

This SQLString object can be called as a function using `()` to get an object compatible with most database drivers.

```js
connection.query(sql());
```

To insert raw values into the SQL string without escaping them as bind parameters, pass them to the SQLString using parentheses:

```js
const tablename = 'users';
connection.query(SQL`SELECT * FROM "`(tablename)`" WHERE username = ${username};`());
```

To append to an existing SQLString object, use the `append` method:

```js
const sql = SQL`SELECT * FROM "`;
sql.append(tablename);
sql.append`" WHERE username = ${username}`;
sql.append` ID in (`;
for (const id of [1, 2, 3]) {
    sql.append`${id}, `;
}
sql.append`4)`;
connection.query(sql());
```

You can optionally leave out the `.append`:

```js
const sql = SQL`SELECT * FROM "`;
sql(tablename);
sql`" WHERE username = ${username}`;
sql` ID in (`;
for (const id of [1, 2, 3]) {
    sql`${id}, `;
}
sql`4)`;
connection.query(sql());
```

### SQL Driver Specific Syntax

-   node-sqlite3 like APIs use the spread operator ``...SQL`query`​`` instead of the final parenthesis ``SQL`query`()`` syntax.

```js
import sqlite3 from 'sqlite3';
import { SQL } from 'sql-strings';

const db = new sqlite3.Database(':memory:');
const username = 'bob';
const tablename = '"users"';

const sql = SQL`SELECT * FROM `;
sql.append(tablename);
sql.append` WHERE username = ${tablename}`;

db.all(...sql);
// is equivalent to:
db.all('SELECT * FROM "users" WHERE username = ?', [username]);
```

-   node-postgres can optionally omit the final parenthesis and use ``SQL`query`​`` syntax.

-   sequelize by default replaces the parameters on the client. To use bind parameters on the database side, pass `SQL.SEQUELIZE_USE_BIND` to the final parenthesis with ``SQL`query`(SQL.SEQUELIZE_USE_BIND)`` syntax.

```js
import { SQL } from 'sql-strings';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('sqlite::memory:');
const username = 'bob';
const tablename = '"users"';

const sql = SQL`SELECT * FROM "`(tablename)`" WHERE username = ${username}`;
sequelize.query(sql(SQL.SEQUELIZE_USE_BIND));
// is equivalent to:
sequelize.query({ query: 'SELECT * FROM "users" WHERE username = $1', bind: [username] });
```

## Examples

The following application uses the sql-strings package: [Attendance Scanner](https://github.com/clr-li/AttendanceScanner).
You can also take a look at the [test suite](test) for more examples.

## Alternatives

-   [sql-template-strings](https://www.npmjs.com/package/sql-template-strings) does the same thing but doesn't support node-sqlite3 and has a different syntax.

## Contributing

All constructive contributions are welcome including anything from bug fixes and new features to improved documentation, tests and more! Feel free to open an issue to discuss the proposed change and then submit a pull request :)

### Security Issues

If you discover a security vulnerability in sql-strings, please contact the [current main maintainer](#contributors).

### Running Tests

Tests run automatically pre-commit using [Husky](https://typicode.github.io/husky/). To run the test suite manually, first install the dependencies, then run `npm test`:

```console
$ npm install
$ npm test
```

You will need to set up a [mysql](https://www.mysql.com/) and [postgres](https://www.postgresql.org/) database on localhost with username `test`, password `test`, and database `test` to run their respective tests.

### Linting and Formatting

[Eslint](https://eslint.org/) is used for static analysis, [fixpack](https://www.npmjs.com/package/fixpack) is used to standardize package.json and [Prettier](https://prettier.io/) is used for automatic formatting. Linting will automatically run pre-commit using [Husky](https://typicode.github.io/husky/) and [Lint-Staged](https://www.npmjs.com/package/lint-staged). Formatting can be set up to happen [automatically in your editor](https://prettier.io/docs/en/editors.html) (e.g. on save). Formatting and linting can also be run manually:

```console
$ npm install
$ npm run format
$ npm run lint
```

### Generating TypeScript Types

Typescript types are automatically generated from the JSDoc in the `/types` folder when the npm package is packaged/published. To update the TypeScript types manually, run the following command:

```console
$ npm run types
```

This will allow TypeScript users to benefit from the type information provided in the JSDoc.

If you also want to generate the readme badges, run the following command:

```console
$ npm run build
```

## Contributors

The author of sql-strings is [Alexander Metzger](https://sandergi.github.io).

Functionality is inspired by [sql-template-strings](https://www.npmjs.com/package/sql-template-strings).

All contributors will be listed here.

## License

[MIT](LICENSE)
