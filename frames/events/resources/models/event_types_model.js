var _ = require('underscore');

module.exports = function (apiary, cb) {

    model = {
        name: 'event_types',
        event_types: [
            {id: 'movie',
                label: 'Movies'}
        ]
    };
    cb(null, model);
};

