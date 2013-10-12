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
        if (context.location){
            this.model('tmsapi').search(94103, function(err, data){
                context.movies = data;
                done();
            });
        }
        done();
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        if (context.movies){
            context.$out.set('movies', context.movies);
        } else {
            context.$out.set('movies', {});
        }
        done();
    }
}