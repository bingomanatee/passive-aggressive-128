var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');
var moment = require('moment');
/* ------------ CLOSURE --------------- */

 function _force_today(event){
     if (event.time){
         var now = new Moment();
         event.times.forEach(function(time){
            var t = new moment(time.start_time);
             t.year(now.year());
             t.day(now.day());
             t.month(now.month());

             time.start_time = t.format('YYYY-MM-DD HH:mm');
         });
     }
}

var TEST_CASES_DIR = path.resolve(__dirname, 'test_cases');
/** ********************
 * Purpose: create and replay mock events
 * @return void
 */

function get_test_dir(test_case) {
    return path.resolve(TEST_CASES_DIR, test_case);
}
function met(apiary, callback) {


    var model = {
        name: 'mock_event_tables',

        delete_events: function (test_dir, done) {
            if (!fs.existsSync(get_test_dir(test_dir))) {
                done(new Error('no test case ' + test_dir));
            } else {
                try {
                    rmdir(get_test_dir(test_dir), done);
                } catch (err) {
                    done(err);
                }
            }
        },

        test_case_exists: function(test_case){
            return fs.existsSync(get_test_dir(test_case));
        },

        get_event: function (test_case, zip, id, done, force_today) {
            model.get_events(test_case, zip + '_' + id, function(err, events){
                if (!err && force_today){   _force_today(events);};
                done(err, events)
            });
        },

        get_events: function (test_case, zip, done) {
            var test_dir = get_test_dir(test_case);

            if (!fs.existsSync(test_dir)) {
                return done(new Error('no data for test case ' + test_case));
            }

            var zip_file = path.resolve(test_dir, encodeURIComponent(zip) + '.json');

            if (!fs.existsSync(zip_file)) {
                return done(new Error(util.format('no data file for file %s', zip_file)));
            }

            fs.readFile(zip_file, {encoding: 'utf8'}, function (err, data) {
                if (err) {
                    done(err);
                } else {
                    try {
                        data = JSON.parse(data);
                        done(null, data);
                    } catch (err) {
                        done(err);
                    }
                }
            });
        },

        put_event: function (test_case, zip, id, data, done) {
            model.put_events(test_case, zip + '_' + id, data, done);
        },

        put_events: function (test_case, zip, data, done) {
            if (!test_case) {
                return done(new Error('no test case provided'));
            }

            var test_dir = get_test_dir(test_case);
            if (!fs.existsSync(test_dir)) {
                mkdirp.sync(test_dir, 0775);
            }

            if (!_.isString(data)) {
                try {
                    data = JSON.stringify(data);
                } catch (err) {
                    return done(err);
                }
            }

            fs.writeFile(path.resolve(test_dir, zip + '.json'),
                data, done);
        }
    }

    callback(null, model);
}

/* -------------- EXPORT --------------- */

module.exports = met;