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

        if (!(context.zip || context.id)) {
            done('no zip or ID');
        } else {
            done();
        }
    },

    on_get_input: function (context, done) {

        if (context.mock) {
            var mock_model = this.model('mock_event_tables');

            function _done(err, results) {
                if (err) {
                    done(err)
                } else {
                    context.$send(results, done);
                }
            }

            if (context.id) {
                    mock_model.get_event(context.mock, context.zip, context.id, _done, true);

            } else {
                console.log('getting mock data for zip %s', context.zip);


                mock_model.get_events(context.mock, context.zip, _done);
            }
        } else {

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
                        //    console.log('offsetting event times with location %s', util.inspect(loc));
                        if (loc) {
                            event.times = event.times.map(function (time) {
                                //    console.log('start time: %s', time.start_time);
                                var start = new moment(time.start_time);
                                //  console.log('moment time: %s', start.format(F));
                                start.add('hours', loc.timezone);
                                //   console.log('after adding hours: %s: %s', loc.timezone, start.format(F));
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
        }
    },

    on_put_input: function (context, done) {
        if (!context.mock) { // you can only put mock data
            done('no mock');
        } else if (!context.data) {
            done('no data')
        } else {
            var mock_model = this.model('mock_event_tables');

            function _done(err, result) {
                if (err) {
                    done(err);
                } else {
                    context.$send(result, done);
                }
            }

            if (context.id) {
                mock_model.put_event(context.mock, context.zip, context.id, context.data, _done);
            } else {
                mock_model.put_events(context.mock, context.zip, context.data, _done);
            }
        }
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        done();
    }
}