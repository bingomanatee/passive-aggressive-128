var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');
var moment = require('moment');

var TMSAPI_CACHE_DIR = path.resolve(__dirname, 'test_files/tmsapi_cache');


var DATA_12345 = [
    {
        tmsID: 'EV0001',
        title: 'movie 12345',
        showtimes: [
            {
                theatre: {
                    id: 2,
                    name: 'Beta Theatre'
                },
                dateTime: "2013-10-19T12:00"
            }
        ]
    }
];

var DATA_54321 = [
    {
        tmsID: 'EV00012',
        title: 'movie 54321',
        showtimes: [
            {
                theatre: {
                    id: 1,
                    name: 'Alpha Theatre'
                },
                dateTime: "2013-10-19T12:00"
            }
        ]
    }
];

var ZIPS = [
    {zip: 12345, age: 0, data: DATA_12345},
    {zip: 54321, age: 10, data: []}
];

tap.test('models', {timeout: 1000 * 10, skip: false }, function (suite) {

    suite.test('tmsapi_model', {timeout: 1000 * 10, skip: false }, function (tmsapi_test) {
        var apiary_mock = {
            get_config: function (value) {
                switch (value) {
                    case 'tmsapi_auth_key':
                        return'tmsapi-key';
                        break;

                    default:
                        throw new Error('not equipped to get value ' + value);
                }
            }
        };

        function _init_mock_cache(done) {

            fs.readdir(TMSAPI_CACHE_DIR, function (err, files) {

                files.forEach(function (file) {
                    fs.unlinkSync(path.resolve(TMSAPI_CACHE_DIR, file));
                });

                ZIPS.forEach(function (zip) {
                    var dest = path.resolve(TMSAPI_CACHE_DIR, zip.zip + '');
                    var str = JSON.stringify(
                        _.extend({
                            startDate: new moment().subtract(zip.age, 'days').format('YYYY-MM-DD')
                        }, {data: zip.data})

                    );

                 //   console.log('writing to %s: %s', dest, str);
                    fs.writeFileSync(dest, str);
                });


                done();
            });

        }

        function _tests() {

            require('./../resources/models/tmsapi_model')(apiary_mock, function (err, tmsapi_model) {

                tmsapi_model.CACHE_DIR = TMSAPI_CACHE_DIR;

                // overriding poll_api

                var polls = [];
                tmsapi_model.poll_api = function (zip, cb) {
                    if (_.contains(polls, zip)) {
                        throw new Error('second poll of ' + zip);
                    }
                    polls.push(zip);

                    switch (zip) {
                        case 12345:
                            tmsapi_model.save_cache(zip, JSON.stringify(tmsapi_model.current_data([])));
                            cb(null, []);
                            break;

                        case 54321:
                            tmsapi_model.save_cache(zip, JSON.stringify(tmsapi_model.current_data(DATA_54321)));
                            cb(null, DATA_54321);
                            break;

                        default:
                            cb(new Error('have no data for zip ' + zip));
                    }
                };

                tmsapi_test.test(function (poll_test) {

                    var six_days_ago = new moment().subtract(6, 'days').startOf('day');

                    var then = tmsapi_model.then(six_days_ago.format('YYYY-MM-DD')).startOf('day');
                    poll_test.equal(then.unix(), six_days_ago.unix(), 'test then conversion');
                    poll_test.equals(tmsapi_model.age(then), 6, 'then is six days ago');

                    poll_test.test('reading cache file 12345', function (test) {

                        // data in file 12345 is current so doesn't require calling poll_api again.
                        tmsapi_model.get_movies(12345, function (err, movies) {
                            test.deepEqual(movies.data, DATA_12345, '12345 movies');
                            test.end();
                        });

                    });

                    poll_test.test('polling 54321', function (test) {
                        // data in file 54321 is out of date so requires a poll.

                        tmsapi_model.get_movies(54321, function (err, movies) {
                            test.deepEqual(movies, DATA_54321, '54321 movies');

                            tmsapi_model.get_movies(54321, function () {
                                test.deepEqual(movies, DATA_54321, '54321 movies -- second poll');
                                test.end();
                            })
                        })

                    });
                });


                tmsapi_test.end();
            });
        }

        _init_mock_cache(_tests);

    });


    suite.test('eventful_model', {timeout: 1000 * 10, skip: false }, function (eventful_test) {

        eventful_test.end();
    });

    suite.end();

});