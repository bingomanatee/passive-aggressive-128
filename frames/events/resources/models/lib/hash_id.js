var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var _DEBUG = true;

/* ------------ CLOSURE --------------- */

var hash_algorithm = crypto.getHashes()[0];

/** ********************
 * Purpose: to create a hash from two keys
 * @return string
 */

function hash_id(s1, s2) {
    if (!s2) s2 = '';
    if (!description) description = '';

    var shasum = crypto.createHash(hash_algorithm);

    var data = new Buffer(title);
    shasum.update(data, 'utf8');
    if (description) {
        data = new Buffer(description);
        shasum.update(data);
    }

    var key = shasum.digest('hex');
    if (_DEBUG)  console.log('s1: %s, s2: %s, key: %s', s1, s2.substr(0, 20), key);
    return key;
}


/* -------------- EXPORT --------------- */

module.exports = hash_id;