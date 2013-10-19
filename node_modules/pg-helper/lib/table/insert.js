var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');
var _DEBUG = false;
var _q = require('./../_q');
var _ISQL = _.template('INSERT INTO <%= _q(table.name) %> (<%= fields.map(_q).join(",") %>) VALUES (<%= values.join(",") %>)' +
    '<% if (returning && returning.length){ %> RETURNING <%= returning.map(_q).join(",") %><% } %>;');

/* ------------ CLOSURE --------------- */

function _insert_sql(table, record, returning) {
    var fields = _.intersection(_.keys(record), _.pluck(_.values(table.columns), 'name'));
    if (!fields.length) return '';

    var values = fields.map(function (field) {
        return table.column(field).value(record[field]);
    }, this);

    return _ISQL({table: table, _q: _q, _: _, returning: returning, fields: fields, values: values})
}

/** ********************
 * Purpose: insert a new record
 * @return promise
 */

function insert(client, record, returning, cb) {
    var self = this;

    if (_.isFunction(returning)) {
        cb = returning;
        retrning = null;
    } else if (!_.isArray(returning)) {
        returning = false;
    }

    if (cb) {
        client.query(_insert_sql(this, record, returning), cb);
    } else {
        var deferred = Q.defer();

        var qy = _insert_sql(self, record, returning);
        if (_DEBUG)  console.log('insert SQL: %s', qy);
        client.query(qy, function (err, result) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }
}
/* -------------- EXPORT --------------- */

module.exports = insert;
module.exports.insert_sql = _insert_sql;