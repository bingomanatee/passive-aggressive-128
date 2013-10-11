var schema_static_mixins = require('./schema_statics_mixins');
var _ = require('underscore');

/**
 *
 * @param callback{function}
*/

module.exports = function (callback) {

	var mongoose = this.get_config('mongoose');
	if (this.has_config('schema_def')) {
		var schema_def = this.get_config('schema_def');
		if (_.isString(schema_def)) {
			schema_def = require('schema_def');
		}
		var schema;
		if (schema_def instanceof mongoose.Schema) {
			schema = schema_def;
		} else {
			schema = new mongoose.Schema(schema_def);
		}

		_.extend(schema.statics, schema_static_mixins(this));

		this.model = mongoose.model(this.name, schema);
		callback();
	}
};