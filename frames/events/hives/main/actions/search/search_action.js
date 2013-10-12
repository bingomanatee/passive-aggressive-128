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
        var model = this.model('eventful');

        model.categories(function (err, cats) {
            context.cats = cats;
            done();
        })
    },

    on_get_process: function (context, done) {
        done();
    },

    on_get_output: function (context, done) {
        context.$out.set('events', '')
        context.$out.set('cats', context.cats);
        done();
    },

    /* -------------- POST ------------- */

    on_post_validate: function (context, done) {
         if (!context.location) {
            done('no location found')
        } else {
            done();
        }
    },

    on_post_input: function (context, done) {
        var model = this.model('eventful');
        model.search(context, function (err, event_data) {
            if (err) {
                return done(err);
            }
            console.log('event_data: %s', util.inspect(event_data));
            context.event_data = event_data;
            model.categories(function (err, cats) {
                context.cats = cats;
                done();
            })
        });
    },

    on_post_process: function (context, done) {
        if (parseInt(context.total_items) > 0) {

            var norm_data = this.model('eventful').normalize(context.event_data.events.event);
            _.each(norm_data, function (items, name) {
                // items are a hash, keyed by ID. We only need the values of the hash.
                context.$out.set(name, _.values(items));
            });
        } else {
            context.$out.set('events', []);
            context.$out.set('venues', []);
        }
        done();
    },

    on_post_output: function (context, done) {
        context.$out.set('cats', context.cats);
        done();
    }
}