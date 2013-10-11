var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');

/* ------------ CLOSURE --------------- */
// http://api.eventful.com/rest/events/search?.location=San+Diego&app_key=fXWVHcTTLLTq8z5J
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
        done();
    }
}