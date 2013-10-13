var _ = require('underscore');
var pg = require('pg');


module.exports = function(apiary, cb){

    var con = process.env.DATABASE_URL ||  'postgres://postgres@localhost/allevents';
/*
    pg.connect(DATABASE_URL, function(err, client, done) {
        client.query('SELECT * FROM your_table', function(err, result) {
            done();
            if(err) return console.error(err);
            console.log(result.rows);
        });
    });


    var model = {};*/




    cb(null, model);
}