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
        var tmsapi_model = this.model('tmsapi');

        context.$out.set('zip', context.zip);
        tmsapi_model.poll_api(context.zip, done);
    },

    on_process: function (context, done) {
        var event_tables_model = this.model('event_tables');

        event_tables_model.events_table.connect(function (err, client, db_done) {
            console.log('selecting all events: ');
            event_tables_model.select(client, {
                fields: ['id', 'title', 'area', 'start_date', 'end_date'],
                terms: {
                    WHERE: "category='movie'"
                }
            },function (err, result) {
                    console.log('done selecting all events: %s, %s', err,  util.inspect(result).substr(0, 200));
                    context.$out.set('events', result.rows);
                    db_done();
                    done();
                })

        });
    },

    on_output: function (context, done) {
        done();
    }
}