var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');

/**
 * note - this test relies on the existence of a TEST_DB
 */

tap.test('pg', {timeout: 1000 * 10, skip: false }, function (suite) {

    var pg_lib = require('./../index');

    suite.test('use', {timeout: 1000 * 5, skip: false }, function (test) {

        var test_table = new pg_lib.Table('test_table_1', {database: 'test_db', host: 'localhost:5432'})
            .add('name', 'varchar', 10);

        var done_with_db;
        var client;

        function _abort(msg) {
            return function (err) {

                if (err)  console.log('%s error: %s', msg, err);

                test.end();
                if (done_with_db) {
                    done_with_db();
                }
            };
        }

        test_table.connect()
            .then(function (cl, done) {
                done_with_db = done;
                console.log('.... 1 dropping table');
                client = cl;
                return test_table.drop(client)
            },
            _abort('connection'))
            .then(function () {
                console.log('.... 2 creating table');
                return  test_table.create(client)
            }, _abort)
            .then(function () {
                console.log('.... 3 inserting record');
                return test_table.insert(client, {name: 'Bob'}, ['name']);
            }, _abort('insert'))
            .then(function (result) {
                console.log('.... 4 selecting records %s', util.inspect(result));
                return test_table.select(client, {});
            }, _abort('select'))
            .then(function (results) {
                console.log('results: %s', util.inspect(results));
                test.deepEqual(results.rows, [
                    { name: 'Bob' }
                ], 'his name is Robert Palmer');
                return test_table.drop(client);
            }, _abort('drop'))
            .then(function () {
                console.log('.... 5 closing connection');

                if (done_with_db) {
                    done_with_db();
                } else {
                    client.end();
                }
                test.end();
            },_abort('close')).done();


    });

    suite.end();

});