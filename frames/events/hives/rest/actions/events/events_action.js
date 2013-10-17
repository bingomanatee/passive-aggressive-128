var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');

/* ------------ CLOSURE --------------- */

/* -------------- EXPORT --------------- */

module.exports = {

    on_validate: function (context, done) {
        done();
    },

    on_input: function (context, done) {
        var model = this.model('event_tables');
        if (context.id){
            model.event(context.id, function(err, event){
                if (err) return done(err);
                context.$send(event, done);
            })
        } else {
            model.summary(context.category, context.area, function (err, results) {
                if (err) return done(err);
                context.$send(results, done);
            });
        }
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        done();
    }
}