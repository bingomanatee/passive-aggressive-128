var pg = require('pg');
var util = require('util');

/**
 * /Applications/Postgres.app/Contents/MacOS/bin/psql events
 */

pg.connect('postgres://localhost:5432/events', function(err, cl, done){

    console.log('connected: %s', err);
    cl.query("SELECT * FROM pg_catalog.pg_tables WHERE  schemaname NOT IN  ('pg_catalog', 'information_schema');"
        , function(err, result){
        console.log('tables: %s, %s', err, util.inspect(result));
        done();
    })
})