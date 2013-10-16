var _ = require('underscore');

module.exports = function (apiary, cb) {

    model = {
        name: 'event_types',
        event_types: [
            'movie']
    };
    cb(null, model);
};

