var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');

var chron = require('./../resources/mixins/chronometer');

tap.test('chronometer', {timeout: 1000 * 10, skip: false }, function (suite) {


    suite.test('interval_value', {timeout: 1000 * 10, skip: false }, function (iv_test) {
        var chronometer;

        var apiary = {
            set_config: function(name, item){
                if (name == 'chronometer'){
                    chronometer = item;
                }
            }
        }

        chron(apiary, function(err, mixin){
            mixin.respond(function(){
                iv_test.ok(chronometer, 'got the chronometer');

                chronometer.stop_clock();

                var count = 0;

                chronometer.add_time_listener('every other second', function(){
                    ++count;
                }, 3);

                var time = new moment();
                time.hour(12);
                time.minute(0);
                time.second(0);

                chronometer.emit('time', time);

                while(time.minute() < 30){
                    time.add('minute', 1);
                    chronometer.emit('time', time);
                }

                iv_test.equal(count, 10, 'ten executions');

                iv_test.end();
            })
        })

    });


    suite.test('interval function', {timeout: 1000 * 10, skip: false }, function (if_test) {
        var chronometer;

        var apiary = {
            set_config: function(name, item){
                if (name == 'chronometer'){
                    chronometer = item;
                }
            }
        }

        chron(apiary, function(err, mixin){
            mixin.respond(function(){
                if_test.ok(chronometer, 'got the chronometer');

                chronometer.stop_clock();

                var count = 0;

                chronometer.add_time_listener('every other second', function(){
                    ++count;
                }, function(time){
                    return (time.minute() > 10 && time.minute() <= 20);
                });

                var time = new moment();
                time.hour(12);
                time.minute(0);
                time.second(0);

                chronometer.emit('time', time);

                while(time.minute() < 30){
                    time.add('minute', 1);
                    chronometer.emit('time', time);
                }

                if_test.equal(count, 10, 'ten executions -- computed');

                if_test.end();
            })
        })

    });


    suite.test('suicide action', {timeout: 1000 * 10, skip: false }, function (if_test) {
        var chronometer;

        var apiary = {
            set_config: function(name, item){
                if (name == 'chronometer'){
                    chronometer = item;
                }
            }
        }

        chron(apiary, function(err, mixin){
            mixin.respond(function(){
                if_test.ok(chronometer, 'got the chronometer');

                chronometer.stop_clock();

                var count = 0;

                chronometer.add_time_listener('every second, die after 10', function(time, manager){
                    ++count;
                    if (count >= 10) {
                        this.active = false;
                    }
                }, 1);

                var time = new moment();
                time.hour(12);
                time.minute(0);
                time.second(0);

                chronometer.emit('time', time);

                while(time.minute() < 30){
                    time.add('minute', 1);
                    chronometer.emit('time', time);
                }

                if_test.equal(count, 10, 'ten executions');

                if_test.end();
            })
        })

    });

    suite.end();

});