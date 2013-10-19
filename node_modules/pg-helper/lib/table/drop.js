var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');

/* ------------ CLOSURE --------------- */

/** ********************
 * Purpose: drop the table - remove structure and records
 * @return promise
 */

function drop(client, cb) {
    if (cb) {
        client.query(this.drop_sql(), cb);
    } else {
        var deferred = Q.defer();

        client.query(this.drop_sql(), function (err, result) {
            if (err) {
                if (/does not exist$/.test(err.message)) {
                    // this is an "ok error" and we can still proceed
                    deferred.resolve(err)
                } else {
                    deferred.reject(err);
                }
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }
}

/* -------------- EXPORT --------------- */

module.exports = drop;