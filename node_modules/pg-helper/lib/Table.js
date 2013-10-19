var _ = require('underscore');
var pg = require('pg');
var Q = require('q');
var Column = require('./Column');
var _q = require('./_q');
var _DEBUG = false;
var _DEBUG_CONN = true;
/* --------------- TEMPLATES ----------------- */

var DB_DEFAULTS = {host: 'localhost:54321', database: '', user: ''};
var _DB_CONN = _.template('postgres://<%= user ? user + "@": "" %><%= host %>/<%= database %>');
var _Q_SQL = _.template('SELECT <%= query.fields %> ' +
    'FROM <%= table_name %>' +
    '<% _.each(query.terms, function(term, key){ %> <%= key.toUpperCase() %> <%= term %><% }) %>;');
var _CT_SQL = _.template("CREATE TABLE <%= _q(table.name) %> (\n" +
    "<%= _.map(table.columns, function(column){ " +
    "return column.create_sql();\n" +
    " }).join(\",\\n\") %>" +
    ");");

/* ---------------- TABLE class ------------------- */

function Table(name, db, columns) {
    this.name = name;
    this.columns = columns || {};
    this._ = _;
    this.db = (db && _.isString(db)) ? db : _.defaults(db ? db : {}, DB_DEFAULTS);
}

/**
 * note -- the connection is stored externally to the table because the table is stateless;
 * any number of commands can be run through it with the client/done parameters being the
 * repository of state.
 *
 * done can be the "done" returned from the connect callback, or another query/step in the app.
 */

_.extend(Table.prototype, {

    /**
     *
     * @param cb {function} takes three parameters:
     *   * err {Error | null} if connection unsuccessful
     *   * client {pg.Client} a connection record
     *   * done {Function} a method that terminates the connection.
     *
     *   This method uses the "client pooling" method of connection.
     */
    connect: function (cb) {
        if (cb) {
            if (_DEBUG_CONN) console.log('connection string: %s', this.connection_string());
            pg.connect(this.connection_string(), cb);
        } else {
            var deferred = Q.defer();
            var s = this.connection_string();
            pg.connect(this.connection_string(), function (err, connection, done) {
                if (err) {
                    console.log('error connecting to %s: %s', s, err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(connection, done);
                }
            })

            return deferred.promise;
        }
    },

    connection_string: function () {
        return _.isString(this.db) ? this.db : _DB_CONN(this.db);
    },

    /**
     * Adds a column to the table definition
     * @param name {String} a legal column name
     * @param type {String} a legal column type: 'integer', 'string', 'char', etc.
     * @param length {int} the number of characters in a char column
     * @param props [{string}] an array of strings that qualify the column.
     * @returns {Table}
     */
    add: function (name, type, length, props) {
        var column;
        if (_.isString(name)) {
            column = new Column(name, type, length, props);
        } else if (_.isObject(name)) {
            column = name;
        }
        this.columns[column.name] = column;
        column.table = this;
        return this;
    },

    /**
     * returns a naked-object version of the table definition, for tests/ introspection.
     *
     * @returns {{name: *, columns: (_.reduce|*)}}
     */
    toJSON: function () {
        return {
            name: this.name,
            columns: _.reduce(this.columns, function (o, c) {
                o[c.name] = c.toJSON();
                return o;
            }, {})
        }

    },

    /**
     * Executes to create a table.
     * @param client {pg.Client}
     * @param done {function}
     */
    create: function (client, done) {
        if (done) {
            client.query(this.create_sql(), done);

        } else {
            var deferred = Q.defer();

            client.query(this.create_sql(), function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });

            return deferred.promise;
        }
    },

    /**
     * Creates a string that will create the table.
     * @returns {String}
     */
    create_sql: function () {
        return _CT_SQL({
            table: this,
            _q: _q,
            _: _
        });
    },

    select: require('./table/select'),

    /**
     * Creates a SQL string for a single table query.
     * A very "dumb" SQL generator that doesn't do a lot of checking on the input.
     *
     * @param query {Object}
     * @returns {String}
     */
    select_sql: function (query) {
        _.defaults(query, {fields: '*', terms: []});

        if (_.isArray(query.fields)) {
            query.fields = _.intersection(query.fields, _.pluck(this.columns, 'name')).map(_q);

            query.fields = query.fields.join(',');
        }
        return _Q_SQL({table: this, table_name: _q(this.name), query: query, _: _});
    },

    /**
     * Creates a SQL string that destroys a table.
     *
     * @returns {String}
     */
    drop_sql: function () {
        return 'DROP TABLE ' + _q(this.name) + ';';
    },

    drop: require('./table/drop'),




    /**
     * Creates a SQL string that destroys a table.
     *
     * @returns {String}
     */
    truncate_sql: function () {
        return 'TRUNCATE TABLE ' + _q(this.name) + ';';
    },

    truncate: function (client, cb) {
        if (cb) {
            client.query(this.truncate_sql(), cb);
        } else {
            var deferred = Q.defer();

            client.query(this.truncate_sql(), function (err, result) {
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
    },

    insert: require('./table/insert'),

    inserts: require('./table/inserts'),

    column: function (field) {
        if (this.columns[field]) {
            return this.columns[field];
        } else {
            return _.find(_.values(this.columns), function (column) {
                return column.name == field;
            })
        }
    },

});


/* ----------------- EXPORTS ------------------ */

module.exports = Table;