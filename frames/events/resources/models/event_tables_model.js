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

function _event_record(event, date, zip) {
    return {
        id: ((event.tmsId || '') +zip + event.title).substr(0, 64),
        source: 'tmsapi',
        title: event.title,
        poll_date: date,
        description: event.longDescription,
        summary: event.shortDescription,
        html: false,
        category: 'movie',
        start_date: _date(event, 'start'),
        end_date: _date(event, 'end'),
        repeating: true,
        area: zip
    };
}

function _event_time_record(record, date, time, zip) {
    return {
        event_id: record.id,
        venue_id: time.theatre.id,
        venue_name: time.theatre.name,
        start_time: time.dateTime,
        poll_date: date,
        source: 'tmsapi',
        area: zip
    }
}

function _date(event, which) {

    var dates = event.showtimes.map(function (time) {
        return new moment(time);
    });
    dates = _.sortBy(dates, function (time) {
        return time.unix();
    });

    var date;
    if (which == 'start') {
        date = _.first(dates);
    } else {
        date = _.last(dates);
    }

    return date.format('YYYY-MM-DD');

}

// long movie title:
//Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb

function _qe(s){
    return s.replace(/[']+/g, "'").replace(/'/g, "''");
}

function _compress_events(results) {
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
    ' WHERE e.id=\'<%= _qe(id) %>\'' +
    ' ORDER BY e.id, t.venue_id, t.start_time;');

/* -------------- EXPORT --------------- */

module.exports = function (apiary, cb) {

    var events_table = new pg_helper.Table('events', apiary.get_config('db'))
        .add('id', 'varchar', 100, ['PRIMARY KEY'])
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
        .add('venue_name', 'varchar', 64)
        .add('venue_id', 'varchar', 64)
        .add('start_date', 'date')
        .add('end_date', 'date')
        .add('area', 'varchar', 16);

    var event_times_table = new pg_helper.Table('event_times', apiary.get_config('db'))
        .add('event_id', 'varchar', 100)
        .add('venue_id', 'varchar', 64)
        .add('poll_date', 'timestamp')
        .add('venue_name', 'varchar', 64)// denormalizing the venue name for expedience.
        .add('start_time', 'timestamp')
        .add('stop_time', 'timestamp')
        .add('source', 'varchar', 64)
        .add('area', 'varchar', 16)
        .add('all_day', 'boolean', 0, ['DEFAULT FALSE']);


    var model = {
            name: 'event_tables',

            events_table: events_table,

            event_times_table: event_times_table,

            full_listing: function (category, area, finish) {
                area += '';
                events_table.connect(function (err, client, done) {
                    if (err) {
                        return finish(err);
                    }

                    model.clear_source(function () {
                        // first get all the events that are nonrepeating
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

            event: function (id, finish) {
                events_table.connect(function (err, client, done) {
                    var q = _EVENT_ID_TIME_JOIN({ id: id, _qe: _qe});
                    client.query(q, function (err, results) {
                        done();
                        if (err) {
                            console.log('error with get join: %s', q);
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

            load_tmsapi_tables: function (input, zip, finish) {
                zip += '';
                console.log('loading tmsi tables; %s records for zip %s from data %s',
                    input.length, zip, util.format(input.slice(0, 4)).substr(0, 200));

                events_table.connect(function (err, client, done) {
                    if (err) {
                        return finish(err);
                    }
                    var event_records = [];
                    var event_time_records = [];
                    var date = new Date();

                    function _process_record_batch() {
                        var er = event_records;
                        var et = event_time_records;
                        event_records = [];
                        event_time_records = [];
                        console.log('inserting %s time records', et.length);
                        console.log('inserting %s movie records', er.length);

                        events_table.inserts(client, er)
                            .then(function () {
                                return event_times_table.inserts(client, et)
                            })
                            .then(function () {
                                console.log('done inserting records');
                            });
                    }

                    var add_event_queue = async.queue(function (event, event_queue_callback) {
                        var record = _event_record(event, date, zip);

                        console.log('inserting movie record %s, %s, %s', record.id, record.title, record.area);

                        event_records.push(record);
                        event.showtimes.forEach(function (time) {
                            event_time_records.push(_event_time_record(record, date, time, zip));
                        });

                        event_queue_callback();

                    }, 10);

                    add_event_queue.drain = function (err) {
                        console.log("DONE WITH EVENT QUEUE");
                        finish(err);
                    };

                    add_event_queue.push(input, _process_record_batch);


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
                if (!cb && _.isFunction(client)) {
                    cb = client;
                    return model.connect(function (err, real_client, done) {
                        if (err) return cb(err);
                        model.truncate(real_client, function () {
                            done();
                            cb();
                        });
                    });
                } else {
                    events_table.truncate(client, function () {
                        event_times_table.truncate(client, cb);
                    })
                }
            },

            /**
             * creates the structure for the event tables.
             * may silently fail if tables exist.
             * @param cb
             */
            create: function (cb) {
                model.connect(function (err, client, done) {
                    event_times_table.create(client, function (err, result) {
                        console.log('creating table event times: %s, %s', err, result);
                        events_table.create(client, function (err, result) {
                            console.log('creating table events: %s, %s', err, result);
                            client.query('CREATE INDEX idx_area_cat ON events (area, category);', function () {
                                client.query('CREATE INDEX idx_events ON event_times (event_id);', function () {
                                    done();
                                    cb();
                                });
                            });
                        });
                    });
                })
            },

            clear_source: function (source, cb) {
                model.conect(function (err, client) {
                        client.query('DELETE FROM events WHERE source = \'' + source + '\';', function () {
                            client.query('DELETE FROM event_tables WHERE source = \'' + source + '\';', function () {
                            });
                        });
                    }
                );
            }
        }
        ;

// initializing tables, indices; may error out after first run

    model.create(function () {
        cb(null, model);
    })

}
;