var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var _DEBUG = false;
var moment = require('moment');
var hash_id = require('./lib/hash_id');

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
     * @param zip
     * @param body
     * @private
     */
    function _save_cache(zip, body) {
        if (_.isString(body)) {
            body = JSON.stringify(body);
        }
        var save_path = path.resolve(model.CACHE_DIR, zip + '');
        fs.writeFileSync(save_path, body);
    }

    function _poll_api(zip, cb) {
        console.log('POLLING API......... %s', zip);
        request.get(_params(zip), function (err, req, body) {
            if (err) {
                cb(err);
            } else {

                try {
                    var data = JSON.parse(body);
                    model.save_cache(zip, {startDate: _now(), data: data});
                } catch (err) {
                    return cb(err);
                }

                cb(null, data);
            }

        });
    }

    function _read_cache_file(zip, cb) {
        var file_path = path.resolve(model.CACHE_DIR, zip + '');
        fs.readFile(file_path, 'utf8',
            function (err, json_string) {
                if (err) return cb(err);
                if (!json_string) return cb(new Err('empty cache file'));
                j = JSON.parse(json_string);
                console.log('cache file for %s date = %s', zip, j.startDate);
                if ((!j.startDate)  || (model.age(j.startDate) > 6)) {
                    model.poll_api(zip, cb);
                } else {
                    cb(null, j);
                }
            });
    }

    function __get_movies(zip, cb) {
        if (_.contains(model.cache_files, zip)) {
            _read_cache_file(zip, cb);
        } else {
            model.poll_api(zip, cb);
        }
    }

    function _read_cache_files(zip, cb) {
        fs.readdir(model.CACHE_DIR, function (err, files) {
            model.cache_files = _.map(_.reject(files, function (file) {
                return /\D/.test(file);
            }), Number);
            model.get_movies(zip, cb);
        })
    }

    function _params(zip) {
        var out = {
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
        return out;
    }

    function _get_movies(zip, cb) {
        if (!model.cache_files) {
            _read_cache_files(zip, cb);
        } else {
            __get_movies(zip, cb);
        }
    }

    function _current_data(data) {
        return {
            startDate: _now(),
            data: data
        };
    }

    var model = {
        name: 'tmsapi',
        CACHE_DIR: path.resolve(__dirname, 'cache'),
        cache_files: null,
        search: _get_movies,
        age: _age,
        then: _then,
        poll_api: _poll_api,
        save_cache: _save_cache,
        get_movies: _get_movies,
        current_data: _current_data
    };

    cb(null, model);
}