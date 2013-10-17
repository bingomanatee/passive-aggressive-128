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
        done();
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        context.$out.set('category', context.category);
        context.$out.set('zip', context.zip);
        done();
    }
}