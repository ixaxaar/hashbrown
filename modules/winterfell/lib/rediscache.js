
var redis = require("redis");

var _ = require('underscore');


////////////////////////////////
//   Connection Manager
////////////////////////////////

// stores all data of all the database connections
// todo: can we centralize this into redis?
var connectionMgr = function() {
    this.connections = {};
};

connectionMgr.prototype.getConnection = function(connectionString){
    return this.connections[connectionString];
};

connectionMgr.prototype.setConnection = function(conn, connectionString){
    return this.connections[connectionString] = conn;
};

// the connection manager
var connMgr = new connectionMgr();


////////////////////////////////
//   Pre-find
////////////////////////////////

var overrides = function(schema, model) {
    mongoose.Model.prototype.checkCacheHit = checkCacheHit;
    mongoose.Model.prototype.cachedSave = 1;
};

// this is called before mongoose executes find
// search redis instead and .. todo: what?!!!
var preFind = function() {
    //
};


////////////////////////////////
//   Constructor
////////////////////////////////

var rediscache = function() {
    this.client = null;
    this.schemas = [];
    this.mongoose = null;
};

rediscache.prototype.connect = function(host, port, credentials, errHandler) {
    // connect to the redis server
    host = (host) ? host : '';
    port = (port) ? port : '';
    credentials = (credentials) ? credentials : '';

    var client = redis.createClient(port, host);
    client.auth(credentials);

    // store the connection variable locally
    var readyHandler = function() { connMgr.setConnection(client, (host + port)) };
    var errorHandler = function (err) { console.log("Error " + err); };

    (errHandler) ? client.on("error", errorHandler) : client.on("error", errHandler);
    client.on("ready", readyHandler);

    return client;
};

rediscache.prototype.

rediscache.prototype.enableCache = function(schema, mongoose) {
    schema.pre('find', preFind);
    schema.pre('save', preSave);
};

module.exports = exports = rediscache;
