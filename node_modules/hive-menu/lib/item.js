var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var _DEBUG = false;

/* ************************************
 * 
 * ************************************ */

/* ******* CLOSURE ********* */

function Item(params) {
	this.name = '';
	this.title = '';
	this.link = '';
	this.weight = 0;
	this.hide = false;
	this.meta = {};

	_.extend(this, params);
}

_.extend(Item.prototype, {

	toJSON: function () {
		if (this.hide) {
			return false;
		}

		return {
			name: this.name,
			weight: this.weight,
			title: this.title,
			link: this.link,
			type: 'item',
			meta: this.meta
		};

	}

})

/* ********* EXPORTS ******** */

module.exports = Item; // end exports