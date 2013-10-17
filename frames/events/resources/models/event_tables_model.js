var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var _DEBUG = false;
var pg_helper = require('pg-helper');
var async = require('async');
var moment = require('moment');

/* ------------ CLOSURE --------------- */

// long movie title:
//Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb

function _compress_events(results){
    var tally = [];

    var by_id = _.groupBy(results.rows, 'id');
    _.each(by_id, function (rows, id) {
        var out;

        rows.forEach(function (grouped_row) {
            if (!out) {
                out = _.clone(grouped_row);
                out.times = [];

            }
            var time = _.pick(grouped_row, 'start_time', 'stop_time', 'all_day', 'area', 'venue_id', 'venue_name');
            if (time.start_time) time.start_time = new moment(time.start_time).format('YYYY-MM-DDTHH:mm');
            if (time.end_time) time.end_time = new moment(time.end_time).format('YYYY-MM-DDTHH:mm');
            out.times.push(time)

        });

        if (out) {
            tally.push(out);
        }
    });

    return tally;
}


var _EVENT_ID_TIME_JOIN = _.template('SELECT e.id, e.title, e.source, e.description, e.summary, e.html, e.repeating, e.category, e.area, t.start_time, t.stop_time, t.all_day, t.venue_name, t.venue_id' +
    ' FROM events e LEFT JOIN event_times t ON t.event_id = e.id' +
    ' WHERE e.area = \'<%= area %>\' AND e.id=<%= id %> AND category = \'<%= category %>\'' +
    ' ORDER BY e.id, t.venue_id, t.start_time;');

/* -------------- EXPORT --------------- */

module.exports = function (apiary, cb) {

    var events_table = new pg_helper.Table('events', apiary.get_config('db'))
        .add('id', 'varchar', 64, ['PRIMARY KEY'])
        .add('title', 'varchar', 64)
        .add('source', 'varchar', 64)
        .add('poll_date', 'timestamp')
        .add('description', 'text')
        .add('summary', 'text')
        .add('html', 'boolean')
        .add('repeating', 'boolean')
        .add('start_time', 'timestamp')
        .add('end_time', 'timestamp')
        .add('all_day', 'boolean')
        .add('category', 'varchar', 64)
        .add('venue_id', 'varchar', 64)
        .add('area', 'varchar', 16);

    var event_times_table = new pg_helper.Table('event_times', apiary.get_config('db'))
        .add('event_id', 'varchar', 64)
        .add('venue_id', 'varchar', 64)
        .add('venue_name', 'varchar', 64)// denormalizing the venue name for expedience.
        .add('start_time', 'timestamp')
        .add('stop_time', 'timestamp')
        .add('area', 'varchar', 16)
        .add('all_day', 'boolean', 0, ['DEFAULT FALSE']);


    var model = {
        name: 'event_tables',

        full_listing: function (category, area, finish) {
            area += '';
            events_table.connect(function (err, client, done) {
                if (err) {
                    return finish(err);
                }

                // first get all the events that are nonrepeating
                var tally;
                var query = {fields: ['id', 'title', 'summary', 'start_time', 'stop_time', 'all_day', 'venue_id', 'venue_name' ],
                    terms: {'where': 'repeating = FALSE AND category = ' + "'" + category + "'" + ' AND area = ' + "'" + area + "'"}
                };
                console.log('tally query: "%s"', events_table.select_sql(query));
                events_table.select(client, query)
                    .then(function (results) {
                        console.log('results of tally: %s', results.rows.length);
                        tally = results.rows;
                        console.log('tally of nonrepeating: %s', util.inspect(tally));
                        var q = _EVENT_TIME_JOIN({category: category, area: area});
                        // now get all the events that DO repeat
                        client.query(q, function (err, results) {
                            if (err) {
                                console.log('repeating error: %s from %s', q);
                                return finish(err)
                            } else {
                                var by_id = _.groupBy(results.rows, 'id');
                                _.each(by_id, function (rows, id) {
                                    var out;

                                    rows.forEach(function (grouped_row) {
                                        if (!out) {
                                            out = _.pick(grouped_row, 'id', 'title', 'summary');
                                            out.times = [];

                                        }
                                        var time = _.pick(grouped_row, 'start_time', 'stop_time', 'all_day', 'area', 'venue_id', 'venue_name');
                                        if (time.start_time) time.start_time = new moment(time.start_time).format('YYYY-MM-DDTHH:mm');
                                        if (time.end_time) time.end_time = new moment(time.end_time).format('YYYY-MM-DDTHH:mm');
                                        out.times.push(time)

                                    });

                                    if (out) {
                                        tally.push(out);
                                    }

                                });

                                finish(null, tally);
                            }
                        });
                    }, function (err) {
                        console.log('nonrepeating error: %s', err);
                        finish(err);
                    })
            });
        },

        event: function(category, id, finish){
          events_table.connect(function(err, client, done){
              var q = _EVENT_ID_TIME_JOIN({category: category, id: id});
              client.query(q, function(err, results){
                  done();
                  if (err){
                      finish(err);
                  } else {
                      finish(null, _compress_events(results)[0]);
                  }
              })
          });
        },

        summary: function (category, area, finish) {
            events_table.connect(function (err, client, done) {
                var query = {
                    fields: ['id', 'title', 'summary', 'category'],
                    terms: {where: util.format('category = \'%s\' AND area = \'%s\'', category, area)}
                };
                events_table.select(client, query, function (err, result) {
                    console.log('summary of cat %s, zip %s: result %s',
                    category, area, util.inspect(result.rows.slice(0, 4))
                    );
                    done();
                    if (err) {
                        finish(err);
                    } else {
                        finish(null, result.rows);
                    }
                });
            })
        },

        load_tmsapi_tables: function (input, finish) {
            console.log('loading tmsi tables from data %s', util.format(input.slice(0, 4)));
            events_table.connect(function (err, client, done) {
                if (err) {
                    return finish(err);
                }
                var date = new Date();

                var add_event_queue = async.queue(function (event, event_queue_callback) {

                    var record = {
                        id: event.tmsId,
                        source: 'tmsapi',
                        title: event.title,
                        poll_date: date,
                        description: event.longDescription,
                        summary: event.shortDescription,
                        html: false,
                        category: 'movie',
                        repeating: true,
                        area: '94103'
                    };

                    events_table.insert(client, record, ['id'])
                        .then(function (result) {
                            var showtime_queue = async.queue(function (time, callback) {
                                event_times_table.insert(client, {
                                    event_id: event.tmsId,
                                    venue_id: time.theatre.id,
                                    venue_name: time.theatre.name,
                                    start_time: time.dateTime,
                                    area: '94103'
                                }).then(function (result) {
                                        callback();
                                    }, function (err) {
                                        console.log('time error: %s', err);
                                        callback(err);
                                    });
                            }, 5);

                            showtime_queue.drain = event_queue_callback;
                            showtime_queue.push(event.showtimes);

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
        },

        select: function (client, query, cb) {
            return events_table.select(client, query, cb);
        },

        connect: function (cb) {
            events_table.connect(function (err, client, done) {
                if (err) {
                    console.log('ERROR CANNOT CONNECT TO DATABASE');
                    cb(err);
                } else {
                    cb(err, client, done);
                }
            });
        },

        truncate: function (client, cb) {
            events_table.truncate(client, function () {
                event_times_table.truncate(client, cb);
            })
        }
    };

    // initializing tables, indices; may error out after first run
    model.connect(function (err, client, done) {
        event_times_table.create(client, function (err, result) {
            console.log('creating table event times: %s, %s', err, result);
            events_table.create(client, function (err, result) {
                console.log('creating table events: %s, %s', err, result);
                client.query('CREATE INDEX idx_area_cat ON events (area, category);', function () {
                    client.query('CREATE INDEX idx_events ON event_times (event_id);', function () {
                        done();
                        cb(null, model);
                    });
                });
            });
        });
    })
};