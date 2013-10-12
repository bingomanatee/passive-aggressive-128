var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');

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
        this.model('eventful').search(context, function (err, event_data) {
            context.event_data = event_data;
            done();
        });
    },

    on_post_process: function (context, done) {
        var norm_data = this.model('eventful').normalize(context.event_data.events.event);
        _.each(norm_data, function (items, name) {
            // items are a hash, keyed by ID. We only need the values of the hash.
            context.$out.set(name, _.values(items));
        });
        done();
    },

    on_post_output: function (context, done) {
        done();
    }
}