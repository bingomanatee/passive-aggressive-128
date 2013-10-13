var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');

tap.test('pg', {timeout: 1000 * 10, skip: false }, function (suite) {

    var pg_lib = require('./../resources/models/lib/pg_lib');

    suite.test('create_sql', {timeout: 1000 * 10, skip: false }, function (test) {

        var foo = new pg_lib.Table('foos');
        foo.add('id', 'integer', 0, ['PRIMARY'])
            .add('name', 'string', 32);

        test.deepEqual(foo.toJSON(), {
            "name": "foos",
            "columns": {
                "id": {"name": "id", "type": "integer", "length": 0, "props": ["PRIMARY"]},
                "name": {"name": "name", "type": "string", "length": 32, "props": []}
            }
        });

        test.equal(foo.create_sql(), "CREATE TABLE foos (\nid integer PRIMARY,\nname string(32) )", 'create SQL');

        var space_table = new pg_lib.Table('space ghost')
            .add('id', 'integer', ['PRIMARY'])
            .add('name', 'char', 20)
            .add('date created', 'date');

        test.deepEqual(space_table.create_sql(), "CREATE TABLE 'space ghost' (\nid integer(PRIMARY) ,\nname char(20) ,\n'date created' date )", 'create SQL 2 - with spaces');

        test.end();
    });
    suite.test('select_sql', {timeout: 1000 * 10, skip: false }, function (test) {

        var foo = new pg_lib.Table('foos');
        foo.add('id', 'integer', 0, ['PRIMARY'])
            .add('name', 'string', 32)
            .add('venue id', 'integer', 0);

        test.equal(foo.select_sql({}), 'SELECT * FROM foos', 'select_sql');
        test.equal(foo.select_sql({fields: ['name']}), 'SELECT name FROM foos', 'select_sql 1');
        test.equal(foo.select_sql({fields: ['name', 'venue id']}), 'SELECT name,\'venue id\' FROM foos', 'select_sql 2');

        var space_table = new pg_lib.Table('space ghost')
            .add('id', 'integer', ['PRIMARY'])
            .add('name', 'char', 20)
            .add('date created', 'date');


        test.equal(space_table.select_sql({}), "SELECT * FROM 'space ghost'", 'select_sql 3');
        // note - the column 'badcolumn' is not present so it is dropped
        test.equal(space_table.select_sql({fields: ['badcolumn', 'date created']}), "SELECT 'date created' FROM 'space ghost'", 'select_sql 4');

        test.end();
    });


    suite.test('list', {timeout: 1000 * 10, skip: false }, function (test) {

        test.end();
    });

    suite.end();

});