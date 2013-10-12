var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var moment = require('moment');

/* ------------ CLOSURE --------------- */

LOCATIONS = {
    sanfrancisco: 94103,
    portlandor: 97204,
    nyc: 10001
};

SLOGANS = {
    sanfrancisco: [
        'Young man, there\'s a place you can go...',
        'They say at night, you can hear George Lucas\' groans near the sewer grates',
        'The naked joggers are never the ones you want to jog naked...'
    ],

    portlandor: [
        'Where young people go to retire',
        'Featuring adult size rail',
        'Gleefully anticipating global warming'
    ],

    nyc: [
        'We got your movies right here',
        'Neither rain nor sleet nor snow',
        'Try our Chicago Style pizza'
    ],
    none: [
        'Click a button to see movie listings. Or just sit there and stare at the screen. Whatever you feel like.',
        'Every hour you spend at the movies is another hour you don\'t spend deciding on whether or not you need another cat',
        'Ad free... for now.'
    ]
}

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
            var zip = LOCATIONS[context.location];

            if (zip){
                this.model('tmsapi').search(zip, function (err, data) {
                    context.movies = data;
                    done();
                });
            } else {
                done();
            }
        } else {
            context.location = 'none';
            done();
        }
    },

    on_process: function (context, done) {
        if (SLOGANS[context.location]){
            context.$out.set('slogan', _.first(_.shuffle(SLOGANS[context.location])));
        } else {
            context.$out.set('slogan', _.first(_.shuffle(SLOGANS.none)));
        }
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
        context.$out.set('location', context.location);
        done();
    }
}