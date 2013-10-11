var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var _DEBUG = false;

/* ------------ CLOSURE --------------- */

var EVENTFUL_SEARCH_URL = 'http://api.eventful.com/json/events/search';
var ITEMS_PER_PAGE = 50;

/* ------------ CLOSURE --------------- */

/** ********************
 * Purpose: to proxy data from eventful
 * @return void
 */

/* -------------- EXPORT --------------- */


module.exports = function (apiary, cb) {

    function _get_results(context, done) {

        events = null;

        function _add_to_events(err, res, body) {
            if (err) return done(err);

            try {
                var new_data = JSON.parse(body);
            } catch (err) {
                return done(err);
            }
            if (new_data.events && new_data.events.event && new_data.events.event.length) {
                if (events) {
                    events.events.event = events.events.event.concat(new_data.events.event);
                } else {
                    events = new_data;
                }
            }

            if (new_data.page_number < (new_data.page_count - 1)) {
                _poll(new_data.page_number + 1);
            } else {
                // the exit condition

                context.$out.set('events', events);
                done();
            }

        }

        function _poll(page) {
            var params = {
                url: EVENTFUL_SEARCH_URL,
                qs: {
                    app_key: apiary.get_config('eventful_auth_key'),
                    location: context.location, keywords: context.search,
                    page_size: ITEMS_PER_PAGE
                }
            };

            if (context.radius) {
                context.radius = parseInt(context.radius);
                if (context.radius > 0) {
                    params.qs.search_radius = context.radius;
                }
            }

            if (page) {
                params.qs.page_number = page;
            }

            console.log('polling events: %s', JSON.stringify(params));
            request.get(params, _add_to_events);
        }

        _poll();
    }

    cb(null, {
        name: 'eventful',
        search: _get_results
    })
}