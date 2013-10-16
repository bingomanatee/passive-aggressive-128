var _ = require('underscore');

module.exports = function (apiary, cb) {

    function Location(zip, name, code) {
        this.name = name;
        this.zip = zip;
        this.code = code;
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

        data: function(){
            return model.locations.map(function(location){
                return location.toJSON();
            })
        }
    };

    model.add_location(94103, 'San Francisco, CA', 'sanfrancisco')
        .add_location(97204, 'Portland, OR', 'portlandor')
        .add_location(10001, 'New York City, NY', 'nyc');

    cb(null, model);
};

