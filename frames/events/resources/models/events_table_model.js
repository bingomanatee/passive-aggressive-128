var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var _DEBUG = false;
var pg_helper = require('pg-helper');
var async = require('async');

/* ------------ CLOSURE --------------- */

// long movie title:
//Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb


/* -------------- EXPORT --------------- */

module.exports = function (apiary, cb) {

    var events_table = new pg_helper.Table('events', apiary.get_config('db'))
        .add('id', 'varchar', 32, ['PRIMARY KEY'])
        .add('title', 'varchar', 64)
        .add('source', 'varchar', 32)
        .add('poll_date', 'timestamp')
        .add('description', 'text')
        .add('summary', 'text')
        .add('html', 'boolean')
        .add('repeating', 'boolean')
        .add('start_time', 'timestamp')
        .add('end_time', 'timestamp')
        .add('all_day', 'boolean')
        .add('venue', 'varchar', 32)
        .add('area', 'varchar', 16);

    var model = {
        load_tmsapi_tables: function (input, finish) {
            events_table.connect(function (err, client, done) {
                if (err) {
                    return finish(err);
                }
                var date = new Date();

                events_table.create(client, function (err, result, data) {

                    var add_event_queue = async.queue(function (event, callback) {

                        var record = {
                            id: event.tmsId,
                            source: 'tmsapi',
                            title: event.title,
                            poll_date: date,
                            description: event.longDescription,
                            summary: event.shortDescription,
                            html: false,
                            repeating: true,
                            area: '94103'
                        };

                        events_table.insert(client, record).then(function () {
                            callback();
                        }, function (err) {
                            console.log('err: %s', err);
                            callback(err);
                        });

                    }, 10);

                    add_event_queue.push(input);

                    add_event_queue.drain = function (err) {
                        finish(err);
                    };

                });
            })
        },

        select: function(client, query, cb){
            return events_table.select(client, query, cb);
        },

        connect: function (cb) {
            events_table.connect(cb);
        }
    };

    cb(null, model)
};