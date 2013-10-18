var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var events = require('events');
var moment = require('moment');
var _DEBUG = false;

/* ------------ CLOSURE --------------- */

/**
 * executes a series of functions periodicaly.
 * Period can be determined by a function, or a number of seconds interval.
 *
 * Note that the function executes once a minute -- however that does NOT mean
 * every sixty seconds. It just means that the emitted time 12:01 pm will e followed
 * by the emitted time 12:02 pm, 12:03 pm, etc.
 *
 * @constructor
 */

function Chron_Manager(apiary) {
    this.apiary = apiary;
    this.last_emitted_time = new moment();
    this.start_clock();
    this.events = [];
}

util.inherits(Chron_Manager, events.EventEmitter);

_.extend(Chron_Manager.prototype, {
    start_clock: function () {
        var self = this;

        // every 30 seconds check the time
        this.i = setInterval(function () {
            var m = new moment();
            if (m.minute() != self.last_emitted_time.minute()) {
                self.last_emitted_time = m;
                self.emit_time();
            }
        }, 1000 * 30);
    },

    stop_clock: function(){
        clearInterval(this.i);
    },

    emit_time: function () {
        this.emit('time', this.last_emitted_time);
    },

    /**
     *
     * @param name {string}
     * @param action {function}
     * @param interval function(time) : boolean | number (minutes);
     * @returns {ChronEvent}
     */
    add_time_listener: function (name, action, interval) {
        var e = new ChronEvent(name, action, interval, this);
        this.events.push(e);
        this.on('time', e.respond());
        return e;
    }
});

function ChronEvent(name, action, interval, mgr) {
    this.name = name;
    this.action = action;
    this.interval = interval;
    this.manager = mgr;
    this.count = 0;
    this.active = true;
}

_.extend(ChronEvent.prototype, {
    respond: function () {
        this._respond = _.bind(this.on_time, this);
        return this._respond;
    },

    on_time: function (time) {
        if (!this.active) return;

        if (_.isFunction(this.interval)) {
            if (this.interval.call(this, time)) {
                this.action(time, this.manager);
            }
        } else {
          if (_DEBUG)  console.log('count: %s', this.count);
            if (this.count < this.interval - 1) {
                ++this.count;
            } else {
                this.count = 0;
                this.action(time, this.manager);
                if (_DEBUG)   console.log('action');
            }
        }
    }
});

/* -------------- EXPORT --------------- */

module.exports = function (apiary, cb) {
    cb(null, {
        name: 'chronometer',
        weight: -10000000,
        respond: function (done) {
            // mess with the apiary, actions, etc.
            var manager = new Chron_Manager(apiary);
            apiary.set_config('chronometer', manager);
            done();
        }
    }); // end callback
}
