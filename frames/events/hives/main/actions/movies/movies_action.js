var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

/* ------------ CLOSURE --------------- */

LOCATIONS = {
    sanfrancisco: 94103,
    portlandor: 97204
};

function _schedule(showtimes, day) {
    var theatres = {};

    showtimes.forEach(function (showtime) {
        if (!theatres[showtime.theatre.id]) {
            theatres[showtime.theatre.id] = {theatre: showtime.theatre, times: []}

        }
        theatres[showtime.theatre.id].times.push(new moment(showtime.dateTime));
    });

    if (!day) day = new moment();

    _.each(theatres, function (t) {
        t.times = _.reject(t.times, function (time) {
            return time.diff(day, 'days');
        })
    });


    return _.filter(_.values(theatres), function (t) {
        return t.times.length
    });

}

/* -------------- EXPORT --------------- */

module.exports = {

    on_validate: function (context, done) {
        done();
    },

    on_input: function (context, done) {
        context.$out.set('movies', {});
        if (context.location) {
            this.model('tmsapi').search(LOCATIONS[context.location], function (err, data) {
                context.movies = data;
                done();
            });
        } else {
            done();
        }
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {

        context.$out.set('movies', context.movies.reduce(function (out, movie) {
            var theatres = _schedule(movie.showtimes);

            if (theatres.length) {
                movie.showtimes = theatres;
                out.push(movie);
            }
            return out;
        }, []));
        context.$out.set('schedule', _schedule);
        context.$out.set('location', context.location || 'none');
        done();
    }
}