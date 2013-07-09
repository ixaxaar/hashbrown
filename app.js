
/**
 * Module dependencies.
 */

var express = require('express')
  , backend = require('./routes/backend')
  , home = require('./routes/home')
  , http = require('http')
  , path = require('path');

var app = express();
var modules = require('./modules/modules.json');

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

/** Routing: default routing except home goes to 404 */
// unless otherwise handled by some module from modules.json
app.get('/', home.home);

// initialize and load routing rules for all modules
modules.kingdoms.forEach(function(kingdom) {

    // initialize the module
    var modInit = require('./modules/' + kingdom.dirName + '/' + kingdom.scripts.init);
    try {
        modInit.init(app);
    } catch (err){
        console.log("Error occured in initializing module %s", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    // configure the module's defined routes
    try {
        app.use('/' + kingdom.name,
            require('./modules/' + kingdom.dirName + '/' + kingdom.scripts.entry));
    } catch (err) {
        console.log("Error occured in loading %s's entry", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
    }
})

// match everything and display 404 <- lowest priority middleware
// TODO: do not allow any other kind of GET requests?
app.use(function(req, res){
    res.send(404);
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
