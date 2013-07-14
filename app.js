
/**
 * Module dependencies.
 */

var express = require('express')
  , backend = require('./routes/backend')
  , fournotfour =  require('./routes/fournotfour')
  , home = require('./routes/home')
  , http = require('http')
  , path = require('path');

var app = express();

// development environment
app.configure('development', function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
})

//TODO: define production env
// app.configure('production', function(){})

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// load modules.json
var kingdoms = backend.getKingdoms(app);
if (!kingdoms) {
    err = "FATAL: Could not load modules";
    throw err;
}

/** Routing: default routing except home goes to 404 */
// unless otherwise handled by some module from modules.json
app.get('/', home.home);

// initialize and load routing rules for all modules
kingdoms.forEach(function(kingdom) {
    if (backend.isEnabled(app, kingdom)) {
        backend.initKingdom(app, kingdom);
        backend.enterKingdom(app, kingdom);
    }
})

// chuck the rest into the narrow sea of 404's
backend.narrowSea(app, fournotfour);

testAPI  = function(string) {
    console.log(string);
}
backend.exposeAPI('test', 'test', testAPI);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
