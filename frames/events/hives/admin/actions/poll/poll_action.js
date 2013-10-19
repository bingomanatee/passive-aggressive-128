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
        var tmsapi_model = this.model('tmsapi');

        tmsapi_model.poll_api(context.zip, done);
    },

    on_output: function (context, done) {
      context.$send('data polled', done);
    }
}