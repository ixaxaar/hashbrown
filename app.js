
/**
 * Module dependencies.
 */

var express = require('express')
  , backend = require('./routes/backend')
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

/** Routing: default routing except home goes to 404 */
// unless otherwise handled by some module from modules.json
app.get('/', home.home);

// check the modules.json if any modules support handling of this route
//app.get(/^(?!^\/$).*$/, backend.backend); // Dangerous and overrides everything
app.get("/:modulename", backend.backend);

// match everything and display 404 <- lowest priority middleware
// TODO: do not allow any other kind of GET requests?
app.use(function(req, res){
    res.send(404);
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
