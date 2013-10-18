var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

/* ------------ CLOSURE --------------- */
var F = 'YYYY-MM-DD HH:mm';
/* -------------- EXPORT --------------- */

module.exports = {

    on_validate: function (context, done) {
        done();
    },

    on_input: function (context, done) {
        var locations = this.model('locations');
        var model = this.model('event_tables');
        if (context.id) {
            model.event(context.id, function (err, event) {
                if (err) {
                    return done(err);
                } else if (!event) {
                    return done('Cannot find event ' + context.id);
                } else {
                    var z = event.area;

                    var loc = locations.get_zip(z);
                    console.log('offsetting event times with location %s', util.inspect(loc));
                    if (loc){
                        event.times = event.times.map(function(time){
                            console.log('start time: %s', time.start_time);
                            var start = new moment(time.start_time);
                            console.log('moment time: %s', start.format(F));
                            start.add('hours', loc.timezone);
                            console.log('after adding hours: %s: %s', loc.timezone, start.format(F));
                            time.start_time = start.format(F);
                            return time;
                        })
                    }
                    context.$send(event, done);
                }

            })
        } else {
            model.summary(context.category, context.zip, function (err, results) {
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