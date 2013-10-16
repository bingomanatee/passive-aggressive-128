var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var _DEBUG = false;
var moment = require('moment');

var redis;
if (process.env.REDISTOGO_URL) {
    console.log('redis url: %s', process.env.REDISTOGO_URL);
    var rtg = require("url").parse(process.env.REDISTOGO_URL);
    redis = require("redis").createClient(rtg.port, rtg.hostname);

    redis.auth(rtg.auth.split(":")[1]);
} else {
    redis = require("redis").createClient();
}

/* ------------ CLOSURE --------------- */

var API = 'http://data.tmsapi.com/v1/movies/showings';
/*+
 'startDate=2013-10-12' +
 '&numDays=30&zip=94103' +
 '&radius=100' +
 '&units=mi' +
 '&api_key=dtcd4eyz79x78yk84yjp45en';*/

var _cache_files = null;
var DATE_FORMAT = 'YYYY-MM-DD';

function _now() {
    return new moment().format(DATE_FORMAT);
}

function _then(date) {
    if (_.isString(date) || _.isDate(date)) {
        return new moment(date, DATE_FORMAT);
    } else {
        // assume is moment
        return date;
    }
}

function _age(date_string) {
    var then = _then(date_string);

    return new moment().diff(then, 'days');
}

/* -------------- EXPORT --------------- */

module.exports = function (apiary, cb) {

    /**
     * saves the data INSTANTLY to the file system.
     *
     * @param zip {number}
     * @param cb {function}
     * @private
     */

    function _poll_api(zip, cb) {
        console.log('POLLING API......... %s', zip);
        request.get(_params(zip), function (err, req, body) {
            if (err) {
                cb(err);
            } else {
                try {
                    var data = JSON.parse(body);
                    var str_data = JSON.stringify(_current_data(data));
                    console.log('saving %s data ...', zip, str_data.substr(0, 100));

                    redis.set(zip + '', str_data, function (err, result) {
                        if (err) {
                            return cb(err);
                        } else if (!result) {
                            return cb(new Error('cannot get data for result ' + zip));
                        }
                        console.log('result: of zip %s: %s', zip, result.substr(0, 100));

                        var events_table_model = apiary.model('events_table_model');

                        events_table_model.connect(function (err, client) {

                            if (err) {
                                cb(err);
                            } else {

                                client.query(util.format("DELETE from events WHERE area = '%s'", zip), function () {
                                    client.query(util.format("DELETE from event_times WHERE area = '%s'", zip), function () {
                                        client.end();
                                        events_table_model.load_tmsapi_tables(data, cb);
                                    });
                                });
                            }

                        })

                    });
                } catch (err) {
                    cb(err);
                }
            }
        });
    }

    function _params(zip) {
        return {
            url: API,
            qs: {
                startDate: _now(),
                api_key: apiary.get_config('tmsapi_auth_key'),
                radius: 100,
                units: 'mi',
                numDays: 30,
                zip: zip
            }
        };
    }

    function _get_movies(zip, cb) {
        zip = parseInt(zip);
        redis.get(zip + '', function (err, value) {
            if (value) {
                console.log('getting zip %s: %s', zip, value.substr(0, 50));
                cb(null, JSON.parse(value).data);
            } else if (err) {
                console.log('error: %s', err);
                cb(err);
            } else {
                model.poll_api(zip, cb);
            }
        })
    }

    function _current_data(data) {
        return {
            startDate: _now(),
            data: data
        };
    }

    function _flush(cb) {
        redis.flushall(cb);
    }


    var model = {
        flush: _flush,
        name: 'tmsapi',
        search: _get_movies,
        age: _age,
        then: _then,
        poll_api: _poll_api,
        get_movies: _get_movies,
        current_data: _current_data
    };

    cb(null, model);
}