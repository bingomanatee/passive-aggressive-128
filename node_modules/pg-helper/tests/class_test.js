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

        test_table.connect()
            .then(function (client, done) {
                console.log('.... 1 dropping table');
                test_table.drop(client)
                    .then(function () {
                        console.log('.... 2 creating table');
                        return  test_table.create(client)
                    }, function (err) {
                        console.log('drop error: %s', err);
                        test.end();
                    })
                    .then(function () {
                        console.log('.... 3 inserting record');
                        return test_table.insert(client, {name: 'Bob'}, ['name']);
                    }, function (err2) {
                        console.log('creation error: %s', err2);
                        test.end();
                    })
                    .then(function (result) {
                        console.log('.... 4 selecting records %s', util.inspect(result));
                        return test_table.select(client, {});
                    })
                    .then(function (results) {
                        console.log('results: %s', util.inspect(results));
                        test.deepEqual(results.rows,  [ { name: 'Bob' } ], 'his name is Robert Palmer');
                        return test_table.drop(client);
                    }, function (err3) {
                        console.log('insert error: %s', err3);
                        test.end();
                    })
                    .then(function () {
                        console.log('.... 5 closing connection');
                        if (_.isFunction(done)) {
                            done();
                        } else {
                            client.end();
                        }
                        test.end();
                    },function (err4) {
                        console.log('drop error: %s', err4);
                        test.end();
                    }).done();
            }, function (err) {
                console.log('connection error: %s', err);
                test.end();
            });


    });

    suite.end();

});