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
        var locations_model = this.model('locations');
        context.locations = locations_model.data();
        done();
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        context.$send(context.locations, done);
    }
}