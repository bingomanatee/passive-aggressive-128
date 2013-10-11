var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var _DEBUG = false;

/* ------------ CLOSURE --------------- */

var EVENTFUL_SEARCH_URL = 'http://api.eventful.com/json/events/search';

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
        var params = {
            url: EVENTFUL_SEARCH_URL,
          qs: {
             app_key: context.$apiary.get_config('eventful_auth_key'),
            location: context.location, keywords: context.search
        }
    };

        request.get(
            params,
            function (err, response, body) {
                if (err) {
                    done(err);
                } else {
                    context.events = util.inspect(response);
                    context.$send(body, done);
                }
            })
    },

    on_post_process: function (context, done) {
        done();
    },

    on_post_output: function (context, done) {
        done();
    }
}