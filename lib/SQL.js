/**
 * @type {Symbol} pass to the SQL function to use bind parameters ($1, $2, ...) instead of client replacements with sequalize
 */
const SEQUELIZE_USE_BIND = Symbol('useBind');

/**
 * @typedef {object} SQLString
 * @property {SQL} append appends more template strings and values to this {@link SQLString} and returns a reference to it
 * @property {string} text the text of the {@link SQLString} with values replaced by bind parameters ($1, $2, ...)
 * @property {string} sql the SQL of the {@link SQLString} with bind parameters (?) instead of values
 * @property {any[]} values the values of the {@link SQLString} to be inserted into the SQL
 * @property {Symbol.iterator} [Symbol.iterator] yields the SQL and values of the {@link SQLString} one by one
 * @extends {SQL}
 */

/**
 * Creates a {@link SQLString} from a template string and values. It can be used to query with mysql, mysql2, postgres, sequelize, node-sqlite3 and more.
 *
 * Recommended to use with an extension for syntax highlighting. VS Code: {@link https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html | ES6 String HTML}. Sublime Text: {@link https://github.com/AsterisqueDigital/javascript-sql-sublime-syntax | javascript-sql-sublime-syntax}. Vim: {@link https://github.com/statico/vim-javascript-sql | vim-javascript-sql}.
 *
 * @param {string[] | string} template the array of template string parts to use (values are automatically escaped using bind parameters $1, $2, ... or ?) or a raw string to to append to the {@link SQLString} without escape.
 * @param  {...any} values the values to insert into the SQL template using bind parameters ($1, $2, ...) or ?.
 * @returns {SQLString}
 * @example
 * <caption>Regular tagged template values are escaped using bind parameters:</caption>
 *
 * ```js
 * import { Sequelize } from "sequelize";
 * import { SQL } from "sql-strings";
 * const sequelize = new Sequelize(...);
 *
 * sequelize.query(
 *      SQL`SELECT * FROM users WHERE id = ${1} AND username = ${'bob'}`()
 * );
 *
 * sequelize.close();
 * ```
 * @example
 * <caption>Use the spread operator for compatibility with node-sqlite3 like APIs:</caption>
 *
 * ```js
 * import sqlite3 from 'sqlite3';
 * import { SQL } from 'sql-strings';
 * const db = new sqlite3.Database(':memory:');
 *
 * db.all(
 *      ...SQL`SELECT * FROM users WHERE id = ${1} AND username = ${'bob'}`
 * );
 *
 * db.close();
 * ```
 * @example
 * <caption>Insert raw values using parenthesis to avoid escaping them as bind parameters:</caption>
 *
 * ```js
 * import mysql from 'mysql';
 * import { SQL } from 'sql-strings';
 * connection = mysql.createConnection(...);
 * connection.connect();
 *
 * const tablename = 'users';
 * connection.query(SQL`SELECT * FROM "`(tablename)`" WHERE id = ${1}`());
 *
 * // Instead of using manual quotes (") and sanitization, prefer using the builtin escape methods of your SQL driver, e.g. connection.escape, when available:
 * connection.query(
 *      SQL`SELECT * FROM users WHERE id = `(connection.escape(1))()
 * );
 *
 * connection.end();
 * ```
 * @example
 * <caption>Append more template strings and values to dynamically construct a SQLString:</caption>
 *
 * ```js
 * import pkg from 'pg';
 * const { Client } = pkg;
 * import { SQL } from 'sql-strings';
 * const client = new Client();
 * await client.connect();
 *
 * await client.query(SQL`SELECT * FROM "users" WHERE id = ${1} AND username = ${'bob'}`());
 *
 * // Is equivalent to:
 *
 * const sql = SQL`SELECT * FROM`;
 * sql('"users"');
 * sql` WHERE id = ${1}`;
 * sql` AND username = ${'bob'}`;
 * await client.query(sql());
 *
 * // Is equivalent to:
 *
 * const sql = SQL`SELECT * FROM`;
 * sql.append("users");
 * sql.append` WHERE id = ${1}`;
 * sql.append` AND username = ${'bob'}`;
 * await client.query(sql());
 *
 * await client.end()
 * ```
 */
function SQL(template, ...values) {
    function append(template, ...values) {
        if (template === undefined || template === SEQUELIZE_USE_BIND) {
            return template === SEQUELIZE_USE_BIND
                ? { query: append.text, bind: append.values }
                : {
                      sql: append.sql,
                      text: append.text,
                      query: append.sql,
                      values: append.values,
                  };
        }
        if (typeof template === 'string') {
            template = [template];
        }
        append.text += template.reduce(
            (acc, part, i) => acc + '$' + (append.values.length + i) + part,
        );
        append.sql += template.join('?');
        append.values.push(...values);
        return append;
    }
    append.append = append;
    append.text = append.sql = '';
    append.values = [];
    append(template, ...values);
    append[Symbol.iterator] = function* () {
        yield this.sql;
        yield* this.values;
    };
    return append;
}

SQL.SEQUELIZE_USE_BIND = SEQUELIZE_USE_BIND;

module.exports.SQL = SQL;
