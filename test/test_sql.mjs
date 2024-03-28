import { describe, it, before, after } from 'node:test'; // read about the builtin Node.js test framework here: https://nodejs.org/docs/latest-v18.x/api/test.html
import assert from 'node:assert';

import { SQL } from 'sql-strings';

import sqlite3 from 'sqlite3';
import { Sequelize } from 'sequelize';
import mysql from 'mysql';
import pkg from 'pg';
const { Client } = pkg;

describe('SQL', () => {
    it('should be a function', () => {
        assert(typeof SQL === 'function');
        assert(typeof SQL`` === 'function');
    });

    it('should have an append method', () => {
        assert(typeof SQL``.append === 'function');
    });

    it('should have the right properties', () => {
        assert(typeof SQL``.values === 'object');
        assert(typeof SQL``.text === 'string');
        assert(typeof SQL``.sql === 'string');
    });

    describe('node-sqlite3', () => {
        /** @type {sqlite3.Database} */
        let db;

        before((_, done) => {
            db = new sqlite3.Database(':memory:', () => {
                db.run('CREATE TABLE users (id INT, username TEXT);', () => {
                    db.run('INSERT INTO users VALUES (1, "bob");', done);
                });
            });
        });

        after((_, done) => {
            db.close(() => {
                done();
            });
        });

        it('should use the spread operator instead of ()', (_, done) => {
            db.all(
                ...SQL`SELECT * FROM users WHERE id = ${1} AND username = ${'bob'}`,
                (err, rows) => {
                    assert.ifError(err);
                    assert.equal(rows.length, 1);
                    assert.equal(rows[0].id, 1);
                    assert.equal(rows[0].username, 'bob');
                    done();
                },
            );
        });

        it('should work with append', (_, done) => {
            const sql = SQL`SELECT * FROM users`;
            sql.append` WHERE id = ${1}`;
            sql.append` AND username = ${'bob'}`;
            db.all(...sql, (err, rows) => {
                assert.ifError(err);
                assert.equal(rows.length, 1);
                assert.equal(rows[0].id, 1);
                assert.equal(rows[0].username, 'bob');
                done();
            });
        });

        it('should work with a mix of raw values and bind parameters', (_, done) => {
            const tablename = 'users';
            const id = 1;
            db.all(...SQL`SELECT * FROM "`(tablename)`" WHERE id = ${id}`, (err, rows) => {
                assert.ifError(err);
                assert.equal(rows.length, 1);
                assert.equal(rows[0].id, 1);
                assert.equal(rows[0].username, 'bob');
                done();
            });
        });

        it('should work with a mix of raw values and bind parameters using append', (_, done) => {
            const tablename = '"users"';
            const id = 1;
            const sql = SQL`SELECT * FROM `;
            sql.append(tablename);
            sql.append` WHERE id = ${id}`;
            db.all(...sql, (err, rows) => {
                assert.ifError(err);
                assert.equal(rows.length, 1);
                assert.equal(rows[0].id, 1);
                assert.equal(rows[0].username, 'bob');
                done();
            });
        });

        it('should allow appending without explicitly calling append', (_, done) => {
            const tablename = '"users"';
            const id = 1;
            const sql = SQL`SELECT * FROM `;
            sql(tablename);
            sql` WHERE id = ${id}`;
            db.all(...sql, (err, rows) => {
                assert.ifError(err);
                assert.equal(rows.length, 1);
                assert.equal(rows[0].id, 1);
                assert.equal(rows[0].username, 'bob');
                done();
            });
        });
    });

    describe('sequelize', () => {
        /** @type {Sequelize} */
        let sequelize;

        before(async () => {
            sequelize = new Sequelize('sqlite::memory:', {
                logging: false,
            });
            await sequelize.authenticate();
            await sequelize.query('CREATE TABLE users (id INT, username TEXT);');
            await sequelize.query('INSERT INTO users VALUES (1, "bob");');
        });

        after(async () => {
            await sequelize.close();
        });

        it('should use () instead of the spread operator', async () => {
            const res = await sequelize.query(
                SQL`SELECT * FROM users WHERE id = ${1} AND username = ${'bob'}`(),
                { type: sequelize.QueryTypes.SELECT },
            );
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 1);
            assert.equal(res[0].username, 'bob');
        });

        it('should work with append', async () => {
            const sql = SQL`SELECT * FROM users`;
            sql.append` WHERE id = ${1}`;
            sql.append` AND username = ${'bob'}`;
            const res = await sequelize.query(sql(), { type: sequelize.QueryTypes.SELECT });
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 1);
            assert.equal(res[0].username, 'bob');
        });

        it('should work with a mix of raw values and bind parameters', async () => {
            const tablename = 'users';
            const id = 1;
            const res = await sequelize.query(
                SQL`SELECT * FROM "`(tablename)`" WHERE id = ${id}`(),
                {
                    type: sequelize.QueryTypes.SELECT,
                },
            );
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 1);
            assert.equal(res[0].username, 'bob');
        });

        it('should work with a mix of raw values and bind parameters using append', async () => {
            const tablename = '"users"';
            const id = 1;
            const sql = SQL`SELECT * FROM `;
            sql.append(tablename);
            sql.append` WHERE id = ${id}`;
            const res = await sequelize.query(sql(), { type: sequelize.QueryTypes.SELECT });
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 1);
            assert.equal(res[0].username, 'bob');
        });

        it('should allow appending without explicitly calling append', async () => {
            const tablename = '"users"';
            const id = 1;
            const sql = SQL`SELECT * FROM `;
            sql(tablename);
            sql` WHERE id = ${id}`;
            const res = await sequelize.query(sql(), { type: sequelize.QueryTypes.SELECT });
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 1);
            assert.equal(res[0].username, 'bob');
        });

        it('should work with bound parameters (client-side replacements disabled)', async () => {
            const res = await sequelize.query(
                SQL`SELECT * FROM users WHERE id = ${1} AND username = ${'bob'}`(
                    SQL.SEQUELIZE_USE_BIND,
                ),
                { type: sequelize.QueryTypes.SELECT },
            );
            assert.equal(res.length, 1);
            assert.equal(res[0].id, 1);
            assert.equal(res[0].username, 'bob');
        });
    });

    describe('mysql', () => {
        /** @type {mysql.Connection} */
        const connection = mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'test',
            password: 'test',
            database: 'test',
        });

        before((_, done) => {
            connection.connect(err => {
                if (err) return done(err);
                connection.query('USE test;', err => {
                    if (err) return done(err);
                    connection.query(
                        'CREATE TABLE IF NOT EXISTS users (id INT, username TEXT);',
                        err => {
                            if (err) return done(err);
                            connection.query('INSERT INTO users VALUES (1, "bob");', err => {
                                if (err) return done(err);
                                done();
                            });
                        },
                    );
                });
            });
        });

        after((_, done) => {
            connection.query('DROP TABLE IF EXISTS users;', () => {
                connection.end(() => {
                    done();
                });
            });
        });

        it('should use () instead of the spread operator', (_, done) => {
            connection.query(
                SQL`SELECT * FROM users where id = ${1} AND username = ${'bob'}`(),
                (err, results) => {
                    assert.ifError(err);
                    assert.equal(results.length, 1);
                    assert.equal(results[0].id, 1);
                    assert.equal(results[0].username, 'bob');
                    done();
                },
            );
        });
    });

    describe('postgres', () => {
        /** @type {Client} */
        let client;

        before(async () => {
            client = new Client({
                user: 'test',
                host: '127.0.0.1',
                database: 'test',
                password: 'test',
                port: 5432,
            });
            await client.connect();
            await client.query('CREATE TABLE users (id INT, username TEXT);');
            await client.query("INSERT INTO users VALUES (1, 'bob');");
        });

        after(async () => {
            await client.query('DROP TABLE IF EXISTS users;');
            await client.end();
        });

        it('should not require () nor the spread operator', async () => {
            const res = await client.query(
                SQL`SELECT * FROM users WHERE id = ${1} AND username = ${'bob'}`,
            );
            assert.equal(res.rows.length, 1);
            assert.equal(res.rows[0].id, 1);
            assert.equal(res.rows[0].username, 'bob');
        });
    });
});
