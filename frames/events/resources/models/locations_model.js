var _ = require('underscore');

module.exports = function (apiary, cb) {

    /**
     *
     * @param zip {number|string}
     * @param name {string} human readable label
     * @param code {string} /^[\w]+/
     * @param timezone {int}
     * @constructor
     */
    function Location(zip, name, code, timezone) {
        this.name = name;
        this.zip = zip;
        this.code = code;
        this.timezone = timezone;
    }

    Location.prototype = {
        toJSON: function(){
            return  _.pick(this, 'name', 'zip', 'code');
        }
    };

    model = {
        name: 'locations',
        locations: [],
        add_location: function (zip, name, code) {
            model.locations.push(new Location(zip, name, code));
            return model;
        },

        get_zip: function(zip){
            if (!zip) return null;

            return _.find(this.locations, function(l){
                return l.zip == zip;
            })
        },

        data: function(){
            return model.locations.map(function(location){
                return location.toJSON();
            })
        }
    };

    model.add_location(94103, 'San Francisco, CA', 'sanfrancisco', 8)
        .add_location(97204, 'Portland, OR', 'portlandor', 8)
        .add_location(10001, 'New York City, NY', 'nyc', 5);

    cb(null, model);
};

