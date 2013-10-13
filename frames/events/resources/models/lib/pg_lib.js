var _ = require('underscore');

function _q(f) {
    if (/\s/.test(f)) {
        return "'" + f + "'";
    } else {
        return f;
    }
};

function Table(name, columns) {
    this.name = name;
    this.columns = columns || {};
    this._ = _;
}

var _CT_SQL = _.template("CREATE TABLE <%= _q(table.name) %> (\n" +
    "<%= _.map(table.columns, function(column){ " +
    "return column.create_sql();\n" +
    " }).join(\",\\n\") %>" +
    ")");

_.extend(Table.prototype, {

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

    toJSON: function () {
        return {
            name: this.name,
            columns: _.reduce(this.columns, function (o, c) {
                o[c.name] = c.toJSON();
                return o;
            }, {})
        }

    },

    create_sql: function () {
        return _CT_SQL({
            table: this,
            _q: _q,
            _: _
        });
    },

    select_sql: function (query) {
        _.defaults(query, {fields: '*', terms: []});

        if (_.isArray(query.fields)) {
            query.fields = _.intersection(query.fields, _.pluck(this.columns, 'name')).map(_q);

            query.fields = query.fields.join(',');
        }
        return _Q_SQL({table: this, table_name: _q(this.name), query: query, _: _});
    }

});

var _Q_SQL = _.template('SELECT <%= query.fields %> FROM <%= table_name %><% query.terms.forEach(function(term, key){ %><%= key.toUpperCase() %> <%= term %><% }) %>');

var _CT_C_SQL = _.template('<%= _q(column.name) %> <%= column.type %><% if (column.length) { %>(<%= column.length %>)<% } %> <%= column.props.join(" ") %>');

function Column(name, type, length, props) {
    this.name = name;
    this.type = type || 'string';
    this.length = length || 0;
    this.props = props ? props : [];
}

_.extend(Column.prototype, {
    create_sql: function () {
        return _CT_C_SQL({
            column: this,
            _q: _q
        });
    },

    toJSON: function () {
        return  _.pick(this, 'name', 'type', 'length', 'props')
    }
});

module.exports = {
    Table: Table,
    Column: Column
};