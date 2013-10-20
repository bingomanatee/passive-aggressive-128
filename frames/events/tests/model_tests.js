var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');

var DB = process.env.DATABASE_URL? process.env.DATABASE_URL : {database: 'test_db', host: 'localhost:5432'};

var TC1_DATA = [
    {id: 'abc', title: 'Abc', area: '12300'},
    {id: 'def', title: 'Def', area: '12300'}
];

tap.test('models', {timeout: 1000 * 10 }, function (suite) {

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

    suite.test('events', {timeout: 1000 * 10, skip: true }, function (e_test) {

        require('./../resources/models/events_table_model')(apiary, function (err, events_table) {

            events_table.connect(function (err, client, done) {
                if (err){
                    console.log('error: ', err);
                    return e_test.end();
                }
                client.query('TRUNCATE TABLE events;TRUNCATE TABLE event_times;', function () {

                    var listings = require('./test_files/model/tmsi_movie_listings_94103.json');

                    events_table.load_tmsapi_tables(listings, function () {
                        events_table.select(client, {fields: ['id', 'title']}).then(function(result){
                            e_test.equal(result.rows.length, listings.length, 'number of events loaded');

                            events_table.summary('movie', '94103', function(err, result){
                                if (err) throw err;
                                console.log('result: %s', JSON.stringify(result.slice(0, 10)));

                                result.forEach(function(movie){

                                    var listing_movie = _.find(listings, function(l){
                                        return l.tmsId == movie.id;
                                    });

                                    if (!listing_movie){
                                        throw new Error('cannot find ' + util.inspect(movie));
                                    }

                                    listing_times = _.sortBy(_.pluck(listing_movie.showtimes, 'dateTime'), _.identity);

                                    movie_times = _.sortBy(_.pluck(movie.times, 'start_time'), _.identity);

                                    e_test.deepEqual(movie_times, listing_times, 'found all times');

                                });

                                done();
                                e_test.end();
                            })
                        }, function(err){
                            console.log('error: %s', err);
                            e_test.end();
                        })
                    });


                });
            });
        });
    });


    suite.test('mock event tables', {timeout: 1000 * 10, skip: false }, function (m_test) {

        var mock_tests_model = require('./../resources/models/mock_event_tables_model');

        mock_tests_model({}, function(err, mock_tests){

            mock_tests.delete_events('test_case_1', function(){

                mock_tests.get_events('test_case_1', '12345', function(err, events){
                    m_test.equals(err.message, 'no data for test case test_case_1', 'error message from getting nonexistent test case events');

                    mock_tests.put_events('test_case_1', 12345, TC1_DATA, function(){
                        mock_tests.get_events('test_case_1', 12345, function(err, result){
                            m_test.deepEqual(TC1_DATA, result, 'got data back');
                            m_test.end();
                        })
                    });
                })

            })

        });

    });


    suite.test('venues', {timeout: 1000 * 10, skip: true }, function (v_test) {

        v_test.end();
    });

    suite.end();

});