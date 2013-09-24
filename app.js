
/**
 * Module dependencies.
 */

// todo: sanitize this shit

/** some modules have circular dependencies, hence, initialize ALL of them
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , passport = require('passport')
    , framework = require('./framework')
    , winston = require('winston')
    , initframework = require('./framework/');

// configure logging
//noinspection BadExpressionStatementJS
require('winston-syslog').Syslog;
winston.add(winston.transports.Syslog);
winston.setLevels(winston.config.syslog.levels);

// these logging methods are available throughout the app
global.log = winston.log;


log('info', 'Hashbrown, starting up...');

var app = express();
// for tobi testing
module.exports = app;

framework.mordor.createTheBlackGates(passport);

// development environment
app.configure('development', function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(function(req, res, next) {
        log('debug', '%s %s', req.method, req.url);
        next();
    });
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    framework.mordor.BlackGate(app, express, passport);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);
});

//TODO: define production env
// app.configure('production', function(){})

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// load modules.json
var kingdoms = framework.realm.getKingdoms(app);
if (!kingdoms) {
    err = "FATAL: Could not load modules";
    throw err;
}

/** Routing: default routing except home goes to 404 */

app.get('/register', function(req, res, next) {
    res.render('register');
});

app.post('/register', function(req, res) {
    framework.findUserbyuid('god', function(err, g) {
        if (!err) {
            req.user = g;
            framework.createOrg(g, req.body, function(success, response) {
                res.send({ success: success, response: response });
            });
        }
        else req.send(500);
    });
});

app.get("*", function(req, res, next) {
    if (req.user) next();
    else framework.login(req, res);
});

app.get("/login", function(req, res) { res.redirect('/'); });

app.post('/login', function(req, res, next) {
    req.accepts('application/json');
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            console.log('error', info.message);
//            return res.redirect('/login');
            return res.send(404);
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.send(200);
        });
    })(req, res, next);
});

app.get('/logout', function(req, res){
    req.logout();
    req.session.destroy(function(err) {
        console.log('Could not destroy session');
    });
    res.redirect('/');
});

// authenticate EVERYTHING except the login page,
// redirect to login page if auth fails
// it is _VERY_ important that next() is called,
// otherwise no other route will work
app.all("*", framework.mordor.openBlackGate);

// home page - where feeds may lie...
app.get('/', framework.minas.tirith);

app.get('/controls', framework.minas.ithil);

// settings page, where every user can enter here,
// but content is tailored depending on the user
app.get('/settings', framework.minas.ithil);

// setup the framework
initframework(app);

//framework.realm.createKingdom(app, 'kingslanding');
//framework.realm.createKingdom(app, 'winterfell');

// initialize and load routing rules for all modules
kingdoms.forEach(function(kingdom) {
    if (framework.realm.isEnabled(app, kingdom)) {
        framework.realm.initKingdom(app, kingdom);
        framework.realm.enterKingdom(app, kingdom);
    }
});

// chuck the rest into the narrow sea of 404's
framework.realm.narrowSea(app, framework.fournotfour);

// test API
testAPI  = function(string) {
    console.log(string);
};
framework.realm.exposeAPI('test', 'test', testAPI);

var cleanup = function() {
//    framework.realm.destroyKingdom(app, 'kingslanding');
//    framework.realm.destroyKingdom(app, 'winterfell');
};

framework.heartbeat.turnMeOn(cleanup);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

