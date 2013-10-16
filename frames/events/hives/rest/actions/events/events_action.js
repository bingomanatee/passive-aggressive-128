var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');

/* ------------ CLOSURE --------------- */

/* -------------- EXPORT --------------- */

module.exports = {

    on_validate: function (context, done) {
        if (!context.area){
            done('no area passed');
        } else if (!_.contains(['94103'], context.area)){
            done('bad area code ' + context.area);
        } else {
            done();
        }
    },

    on_input: function (context, done) {
        var model = this.model('event_table');
        model.summary(context.area, function(err, results){
            if(err) return done(err);
            context.$send(results, done);
        });
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        done();
    }
}