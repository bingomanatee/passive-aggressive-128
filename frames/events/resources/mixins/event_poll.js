var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');

/* ------------ CLOSURE --------------- */
var EVERY_SIX_HOURS = 60 * 12;

/** ********************
 * Purpose: poll local events every 12 hours
 * @return void
 */

/* -------------- EXPORT --------------- */

module.exports = function (apiary, cb) {

    function poll() {
        var tmsapi_model = apiary.model('tmsapi');
        var location_model = apiary.model('locations');

        tmsapi_model.truncate(function () {
            location_model.locations.forEach(function (loc) {
                tmsapi_model.poll_api(loc.zip, _.identity);
            })
        });
    }

    cb(null, {
        name: 'poll_events',
        weight: 10000,
        respond: function (done) {
            var chronometer = apiary.get_config('chronometer');
            chronometer.add_time_listener('poll data', poll, EVERY_SIX_HOURS);
            poll();
            done();
        }
    }); // end callback
};
