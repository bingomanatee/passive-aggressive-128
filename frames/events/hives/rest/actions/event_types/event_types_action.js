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
        var et_model = this.model('event_types');
        context.event_types = et_model.event_types.slice();
        done();
    },

    on_process: function (context, done) {
        done();
    },

    on_output: function (context, done) {
        context.$send(context.event_types, done);
    }
}