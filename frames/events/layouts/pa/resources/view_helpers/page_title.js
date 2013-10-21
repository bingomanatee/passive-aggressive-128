var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var _DEBUG = false;
var ejs = require('ejs');
var hm = require('hive-menu');

/* ************************************
 *
 * ************************************ */

/* ******* CLOSURE ********* */

var _sidebar;
var SIDEBAR_TEMPLATE = path.resolve(__dirname, 'sidebar_template.html');

/* ********* EXPORTS ******** */

module.exports = function (apiary, cb) {

    if (_DEBUG) console.log('reading %s', SIDEBAR_TEMPLATE);
	fs.readFile(SIDEBAR_TEMPLATE, 'utf8', function(err, txt){

		_sidebar = ejs.compile(txt);
        if (_DEBUG) console.log('... loaded and compiled sidebar template.');

		var helper = {

			name: 'page_title',

			test: function (ctx, output) {
return true
			},

			weight: 1000,

			respond: function (ctx, output, done) {
		        if (!output.page_title){
                    output.page_title = 'Passive Aggressive 1248';
                }

                done();
			}
		};

		cb(null, helper);

	})

};