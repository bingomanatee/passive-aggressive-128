var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var _DEBUG = false;
var Item = require('./item');

/* ************************************
 * 
 * ************************************ */

/* ******* CLOSURE ********* */

function Menu(params) {
	this.name = '';
	this.title = '';
	this.items = [];
	this.weight = 0;
	this.hide = false;
	this.meta = {};

	_.extend(this, params);

	var self = this;

	_.each(this.items, function(item, i){
		if (item instanceof Item){
			return;
		} else if (item instanceof Menu){
			return;
		} else{
			if(_.isObject(item)){
				self.items[i] = new Item(item);
			}
		}
	})
}

_.extend(Menu.prototype, {

	add: function (params) {
		var item;
		if (params instanceof Item){
			item = params;
		} else if (params instanceof Menu){
			item = params;
		} else {
			item = new Item(params);
		}
		this.items.push(item);
		return item;
	},

	item: function(name){
		return _.find(this.items, function(item){
			return item.name == name;
		})
	},

	toJSON: function () {

		if (this.hide) {
			return false;
		}

		return {
			name:   this.name,
			weight: this.weight,
			title:  this.title,
			items:  _.reduce(this.items, function (out, item) {
				if (!item.hide) {
					if (!item.toJSON){
						throw new Error(util.format('cannot JSONize %s', util.inspect(item)));
					}
					out.push(item.toJSON());
				}
				return _.sortBy(out, 'weight');
			}, []),
			type: 'menu',
			meta: this.meta
		};

	}

});

/* ********* EXPORTS ******** */

module.exports = Menu; // end exports