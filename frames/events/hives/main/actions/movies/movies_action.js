var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');

/* ------------ CLOSURE --------------- */

LOCATIONS = {
    sanfrancisco: 94103
};

/* -------------- EXPORT --------------- */

module.exports = {

    on_validate: function (context, done) {
        done();
    },

    on_input: function (context, done) {
        context.$out.set('movies', {});
        if (context.location){
            this.model('tmsapi').search( LOCATIONS[context.location], function(err, data){
                context.movies = data;
                done();
            });
        }
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        context.$out.set('movies', context.movies);
        done();
    }
}