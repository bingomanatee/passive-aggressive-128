var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var _DEBUG = false;

/* ------------ CLOSURE --------------- */

var EVENTFUL_SEARCH_URL = 'http://api.eventful.com/json/events/search';
var ITEMS_PER_PAGE = 50;

/* ------------ CLOSURE --------------- */

/** ********************
 * Purpose: to proxy data from eventful
 * @return void
 */

var hash_algorithm = crypto.getHashes()[0];

function _create_eid(title, description) {
    var shasum = crypto.createHash(hash_algorithm);

    var data = new Buffer(title);
    shasum.update(data, 'utf8');
    if (description) {
        data = new Buffer(description);
        shasum.update(data);
    }

    var key =  shasum.digest('hex');
    console.log('title: %s, desc: %s, key: %s', title, description.substr(0, 20), key);
    return key;
}

var _venue_ticket = _.template(' <h3><%= venue_name %></h3>' +
    ' <address> <% if (venu_address) { %><%= venue_address %><br/><% } %>' +
    '  <%= city_name %>, <%= region_name %> ' +
    '<% if (postal_code ){ %> <%= postal_code %> <% } %> </address>');

/* -------------- EXPORT --------------- */


module.exports = function (apiary, cb) {

    function _get_results(query, done) {

        events = null;

        /**
         *
         * @param err Error
         * @param res result (see request module)
         * @param body string (a json block)
         * @returns void
         *
         * note- the body's JSON comes in as documented in http://api.eventful.com/docs/events/search:

         total_items integer
         The total number of events matching this search. This can be an approximation if we wish.
         page_size integer
         The number of events per "page" returned.
         page_count integer
         The number of "pages" of output.
         page_number integer
         The current "page" number.
         page_items integer
         The number of events returned in this block. This is not necessarly the same as page_size. The last page, for instance, will probably not be a full page.
         first_item integer
         The item number of the first element on this page.
         last_item integer
         The item number of the last element on this page.
         search_time float
         The fractional number of seconds it took to satisfy this query.
         events array
         An array of page_items events. Each event entry has the following structure:
         (actually events is an object events with a single property event, which is an array of objects as described below:)
         ------ event data -----
         id string
         The unique ID for this event. Presented as an event object attribute. See the example below.
         url string
         The page URL for this event on eventful.com.
         title string
         The event title.
         description string
         The event description.
         start_time string
         The event start time, in ISO 8601 format (e.g. "2005-03-01 19:00:00").
         stop_time string
         The event stop time, in ISO 8601 format (e.g. "2005-03-01 19:00:00").
         venue_id integer
         The venue ID.
         venue_url string
         The page URL for this venue on eventful.com.
         venue_name string
         The venue name.
         venue_display boolean
         Whether or not the venue name should be displayed in certain cirumstances. Eventful's notion of a venue is a bit broader than you might think. For example, events for which only the postal code is known have a venue named "Postal code 46311, US", for instance. In these cases, a traditional address block looks a bit unusual, and Eventful chooses not to display the venue name in these cases. You may wish to do the same, and the venue_display parameter allows you to do that.
         venue_address string
         The venue address.
         city_name string
         The venue city_name.
         region_name string
         The venue state/province/other name.
         region_abbr string
         The venue state/province/other abbreviation.
         postal_code string
         The venue postal code.
         country_name string
         The venue country name.
         all_day integer
         A false value (0) indicates that the start_time and stop_time are as listed. If the all_day flag is set to 1 (all day) or 2 (no time specified), then the time should be omitted from start_time and stop_time.
         latitude signed float
         The venue latitude.
         longitude signed float
         The venue longitude.
         geocode_type string
         The method used to geocode the venue latitude and longitude.
         trackback_count integer
         The number of trackback entries associated with this event.
         calendar_count integer
         The number of calendars to which this event has been added.
         comment_count integer
         The number of comments associated with this event.
         link_count integer
         The number of URLs associated with this event.
         created string
         The event creation time (e.g. "2005-03-01 19:00:00").
         owner string
         The username of the event owner.
         modified string
         The event modification time (e.g. "2006-01-03 21:35:09").
         *
         * @private
         */
        function _add_to_events(err, res, body) {
            if (err) return done(err);

            try {
                var new_data = JSON.parse(body);
            } catch (err) {
                return done(err);
            }
            if (new_data.events && new_data.events.event && new_data.events.event.length) {
                if (events) {
                    events.events.event = events.events.event.concat(new_data.events.event);
                } else {
                    events = new_data;
                }
            }

            if (new_data.page_number < (new_data.page_count - 1)) {
                _poll(new_data.page_number + 1);
            } else {
                // the exit condition

                done(null, events);
            }

        }

        function _poll(page) {
            var params = {
                url: EVENTFUL_SEARCH_URL,
                qs: {
                    app_key: apiary.get_config('eventful_auth_key'),
                    location: query.location, keywords: query.search,
                    page_size: ITEMS_PER_PAGE
                }
            };

            if (query.radius) {
                query.radius = parseInt(query.radius);
                if (query.radius > 0) {
                    params.qs.search_radius = query.radius;
                }
            }

            if (page) {
                params.qs.page_number = page;
            }

            console.log('polling events: %s', JSON.stringify(params));
            request.get(params, _add_to_events);
        }

        _poll();
    }

    /**
     * Takes the data stored in events.events.event array and normalizes it.
     *
     * @param events
     * @returns {{events: {}, venues: {}}}
     * @private
     */
    function _normalize_results(events) {

        var venues = {}; // indexed by ID
        var event_desc = {}; // indexed by eid

        events.forEach(function (event) {

            if (!venues[event.venue_id]) {
                data = _.pick(event,
                    'venue_id', 'venue_name', 'venue_display', 'venue_url',
                    'city_name', 'region_name', 'region_abbr', 'postal_code', 'country_name', 'latitude', 'longitude');
                data.eids = [];
                venues[data.venue_id] = data;
            }

            var e_data = _.pick(event, 'title', 'description', 'start_time', 'all_day', 'end_time', 'venue_id');
            var eid = _create_eid(e_data.title, e_data.description);

            venues[data.venue_id].eids.push(eid);

            if (!event_desc[eid]) {
                var ed = _.pick(e_data, 'title', 'description', 'venue_id');
                ed.showtimes = [];
                ed.eid = eid;
                event_desc[eid] = ed;
            }
            event_desc[eid].showtimes.push(_.pick(event, 'start_time', 'end_time', 'all_day'));
        })

        return {
            events: event_desc,
            venues: venues
        }

    }

    var model = {
        name: 'eventful',
        search: _get_results,
        normalize: _normalize_results,
        venue_ticket: _venue_ticket
    };

    cb(null, model);
}