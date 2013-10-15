var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');

var DB = {database: 'test_db', host: 'localhost:5432'};

tap.test('models', {timeout: 1000 * 10, skip: false }, function (suite) {

    var apiary = {
        get_config: function (field) {
            switch (field) {
                case 'db':
                    return DB;
                    break;

                default:
                    throw new Error('mock apiary has no ' + field);
            }
        }
    };

    suite.test('events', {timeout: 1000 * 10, skip: false }, function (e_test) {

        require('./../resources/models/events_table_model')(apiary, function (err, events_table) {

            events_table.connect(function (err, client, done) {
                if (err){
                    console.log('error: ', err);
                    return e_test.end();
                }
                client.query('TRUNCATE TABLE events', function () {

                    var listings = require('./test_files/model/tmsi_movie_listings_94103.json');

                    events_table.load_tmsapi_tables(listings, function () {
                        events_table.select(client, {fields: ['id', 'title']}).then(function(result, f){
                            e_test.equal(result.rows.length, 75, 'number of events loaded');
                            done();
                            e_test.end();
                        }, function(err){
                            console.log('error: %s', err);
                            e_test.end();
                        })
                    });


                });
            });
        });
    });


    suite.test('venues', {timeout: 1000 * 10, skip: true }, function (v_test) {

        v_test.end();
    });

    suite.end();

});