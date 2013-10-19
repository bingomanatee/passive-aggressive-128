/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , util = require('util')
    , mvc = require('hive-mvc')
    , passport = require('passport');

var app = express();
var PORT = process.env.PORT || 5000;

app.configure(function () {
    app.set('port', PORT);
    app.set('view engine', 'ejs');
    app.engine('html', require('ejs').renderFile);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('rhinestones are forever'));
    app.use(express.session());
 //   app.use(passport.initialize());
  //  app.use(passport.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function () {
    //app.use(express.errorHandler());
});

server = http.createServer(app);
server.on('close', function () {
    console.log('======== closing server');
});

console.log('environment: %s', (process.env.HEROKU_POSTGRESQL_BLACK_URL));

var db = process.env.HEROKU_POSTGRESQL_BLACK_URL;
if (!db){
    db = 'postgres://localhost:5432/events'
}

var log_file = path.resolve(__dirname, 'actions.log');

server.listen(app.get('port'), function () {
    var apiary = mvc.Apiary({log_file: log_file, action_handler_failsafe_time: 3000}, __dirname + '/frames');
    apiary.set_config('db', db);
    apiary._config.setAll(require('./site_identity.json'));
    apiary._config.setAll(require('./passport_config.json'));
    apiary.set_config('god_mode', true);
    console.log('initializing apiary for port %s', PORT);
    apiary.init(function () {
        var view_helpers = apiary.Resource.list.find({TYPE: 'view_helper', post: false}).records();
        view_helpers.forEach(function (h) {
            console.log("found helper %s", h.name);
        });
        console.log('serving');
        apiary.serve(app, server);
    });
});
