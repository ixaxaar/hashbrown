
/**
 * Module dependencies.
 */

/** some modules have circular dependencies, hence, initialize ALL of them
 */

var express = require('express')
    , realm = require('./routes/realm')
    , fournotfour =  require('./routes/fournotfour')
    , home = require('./routes/minas')
    , login = require('./routes/login')
    , http = require('http')
    , path = require('path')
    , entity = require('./routes/entity')
    , passport = require('passport')
    , heartbeat = require('./routes/heartbeat')
    , mordor = require("./routes/ODNSWIM");

var app = express();

mordor.createTheBlackGates(passport);

// development environment
app.configure('development', function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('eylhjfgewhbfiwegqwgiqwhkbhkvgu'));
    app.use(express.session());
    mordor.BlackGate(app, passport);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
})

//TODO: define production env
// app.configure('production', function(){})

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

entity.init();

// load modules.json
var kingdoms = realm.getKingdoms(app);
if (!kingdoms) {
    err = "FATAL: Could not load modules";
    throw err;
}

/** Routing: default routing except home goes to 404 */

app.get('/login', login.login);

app.post('/login', function(req, res, next) {
//    req.accepts('application/json');
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            console.log('error', info.message);
            return res.redirect('/login');
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');
        });
    })(req, res, next);
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
});

// authenticate EVERYTHING except the login page,
// redirect to login page if auth fails
// it is _VERY_ important that next() is called,
// otherwise no other route will work
app.all("*", mordor.openBlackGate);

// home page - where feeds may lie...
app.get('/', mordor.openBlackGate, minas.tirith);

// settings page, where every user can enter here,
// but content is tailored depending on the user
app.get('/settings', mordor.openBlackGate, minas.ithil);

// initialize all APIs here

realm.createKingdom(app, 'kingslanding');
realm.createKingdom(app, 'winterfell');

// initialize and load routing rules for all modules
kingdoms.forEach(function(kingdom) {
    if (realm.isEnabled(app, kingdom)) {
        realm.initKingdom(app, kingdom);
        realm.enterKingdom(app, kingdom);
    }
});

// chuck the rest into the narrow sea of 404's
realm.narrowSea(app, fournotfour);

// test API
testAPI  = function(string) {
    console.log(string);
};
realm.exposeAPI('test', 'test', testAPI);

var cleanup = function() {
    realm.destroyKingdom(app, 'kingslanding');
    realm.destroyKingdom(app, 'winterfell');
};

heartbeat.turnMeOn(cleanup);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

