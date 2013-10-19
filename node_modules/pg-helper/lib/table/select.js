var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');

/* ------------ CLOSURE --------------- */

/** ********************
 * Purpose: select records
 * @return void
 */

function select (client, query, cb) {
    if (cb) {
        client.query(this.select_sql(query), cb);
    } else {
        var deferred = Q.defer();

        client.query(this.select_sql(query), function (err, results) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(results);
            }
        })
        return deferred.promise;
    }
}

/* -------------- EXPORT --------------- */

module.exports = select;