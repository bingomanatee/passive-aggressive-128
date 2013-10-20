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

    function poll(loc) {
        var tmsapi_model = apiary.model('tmsapi');

        return function () {
            tmsapi_model.poll_api(loc.zip, _.identity);
        }

    }

    cb(null, {
        name: 'poll_events',
        weight: 10000,
        respond: function (done) {
            var chronometer = apiary.get_config('chronometer');
            var location_model = apiary.model('locations');

            location_model.locations.forEach(function (loc, i) {
                chronometer.add_time_listener('poll data', poll(loc), function (time) {
                    return (time.minutes() == 20 * i) & _.contains([2, 14], time.hour())
                });
            })
            done();
        }
    }); // end callback
};
