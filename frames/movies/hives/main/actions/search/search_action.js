var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var _DEBUG = true;

/* ------------ CLOSURE --------------- */

function _url(context){
    return 'http://api.eventful.com/rest/events/search?.location=San+Diego&app_key=' + context.$apiary.get_config('eventful_auth_key');
}
/* -------------- EXPORT --------------- */

module.exports = {

    on_post_validate: function (context, done) {
        if (!context.search){
            done('no search term found');
        } else {
            done();
        }
    },

    on_post_input: function (context, done) {
        if (_DEBUG) console.log('requesting %s', _url(context));
        request.get(_url(context),
            function(err, response, body){
                if (err){
                    done(err);
                } else {
                    context.$send(body, done);
                }
        })
    },

    on_post_process: function (context, done) {
        done();
    },

    on_post_output: function (context, done) {
        done();
    }
}