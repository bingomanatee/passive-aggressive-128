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
        var event_tables_model = this.model('event_tables');
        event_tables_model.connect(function(err, client, finish){
            event_tables_model.truncate(client, function(){
                tmsapi_model.flush(function(){
                    finish();
                    done();

                })
            })
        })
    },

    on_output: function (context, done) {
      context.$send('data flushed', done);
    }
}