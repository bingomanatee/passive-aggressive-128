var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var _DEBUG = false;

/* ------------ CLOSURE --------------- */

var EVENTFUL_SEARCH_URL = 'http://api.eventful.com/json/events/search';
var ITEMS_PER_PAGE = 50;

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
                app_key: context.$apiary.get_config('eventful_auth_key'),
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

}

/* -------------- EXPORT --------------- */

module.exports = {


    on_get_validate: function (context, done) {
        done();
    },

    on_get_input: function (context, done) {
        done()
    },

    on_get_process: function (context, done) {
        done();
    },

    on_get_output: function (context, done) {
        context.$out.set('events', '')
        done();
    },

    /* -------------- POST ------------- */

    on_post_validate: function (context, done) {
        if (!context.search) {
            // missing search term; we will use very brutal error handling here. No further processing will happen.
            done('no search term found');
        } else if (!context.location) {
            done('no location found')
        } else {
            done();
        }
    },

    on_post_input: function (context, done) {

        _get_results(context, done);
    },

    on_post_process: function (context, done) {
        done();
    },

    on_post_output: function (context, done) {
        done();
    }
}