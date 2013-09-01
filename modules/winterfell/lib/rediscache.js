//    The MIT License (MIT)
//
//    Copyright (c) 2013 Russi Chatterjee
//
//    Permission is hereby granted, free of charge, to any person obtaining a copy
//    of this software and associated documentation files (the "Software"), to deal
//    in the Software without restriction, including without limitation the rights
//    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//    copies of the Software, and to permit persons to whom the Software is
//    furnished to do so, subject to the following conditions:
//
//    The above copyright notice and this permission notice shall be included in
//    all copies or substantial portions of the Software.
//
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//    THE SOFTWARE.


var redis = require("redis");
var _ = require('underscore');

////////////////////////////////
//   Pre-routines
////////////////////////////////

var preFindExec = function(callback) {
    //
};

var preSave = function(next) {
    //
};

////////////////////////////////
//   Overrides
////////////////////////////////

var override = function(that) {
    if (that.connection.Query.findExec) {
        // store the functions that will be overriden
        that.overrides['findExec'] = preFindExec;
        that.overridden['findExec'] = connection.Query.findExec;

        // this is called before mongoose executes find
        // search redis instead and .. todo: what?!!!

        connection.Query.findExec = preFindExec;
    }
};

////////////////////////////////
//   Schema methods
////////////////////////////////

// prefetch some objects from the db into the cache
var cachePrefetch = function(conditions, limit, callback) {
    conditions = conditions || {};
    limit = limit || 20;
    // simply finding something should cache them
    var q = this.connection.model(this.schemaName).find({});
    if (q) {
        q.where(conditions);
        q.limit(limit);
        // callback cannot be null, so pass dummy if needed
        q.exec(callback || function() { });
    }
    else callback(new Error('well, fuck you too'));
};

// todo: no callback support, bad programmer :'(

var cacheStore = function(cacheInstance) {
    this.cacheable = true;
    cacheInstance.client.hmset(cacheInstance.createUniqueKey(this[key]), this);
};

// this provides object-level granularity
var enableCaching = function() {
    if (this.cached != undefined) this.cached = true;
};

// disable this object from being stored on the cache
var disableCaching = function() {
    if (this.cached != undefined) this.cached = false;
};

////////////////////////////////
//   Constructor
////////////////////////////////

var rediscache = function() {
    this.uniqueKey = '';
    this.key = '';
    this.client = null;         // redis client
    this.schema = null;         // schema supporting caching
    this.schemaName = '';       // name of the schema - has to be registerd as model
    this.connection = null;     // mongoose connection object
    this.overridden = [];       // connection's overridden functions
    this.overrides = [];        // functions that override connection's methods
};

rediscache.prototype.createUniqueKey = function(key) {
    // this is for saving into cache:
    // create a unique key, to differntiate
    // connection + schema + key + value
    if (this.uniqueKey) return (this.uniqueKey + ':' + key);

    // the problem here is to generate a key unique enough to differentiate
    // objects beloinging to different schemas, connections and the supplied key
    // not sure if uuid is a good option as it's fucking large!
    // todo: find some better way! :-/
    else return uuid.v4() + ":" + this.key;
};

rediscache.prototype.connect = function(host, port, credentials, errHandler) {
    // connect to the redis server
    host = host || '';
    port = port || '';
    credentials = credentials || '';

    var client = redis.createClient(port, host);
    client.auth(credentials);

    var errorHandler = function (err) { console.log("Error " + err); };
    (errHandler) ? client.on("error", errorHandler) : client.on("error", errHandler);

    this.client = client;
    return this;
};

rediscache.prototype.cachePrefetch = cachePrefetch;

// setup caching objects of this schema
rediscache.prototype.setupCache = function(schema, schemaName, connection, key, defaultEnabled) {

    if (schema && schemaName && connection) {
        this.schema = schema;
        this.schemaName = schemaName;
        this.connection = connection;
        this.key = (key || '_id');
        this.uniqueKey = this.createUniqueKey();

        // this field whether caching is enabled for this schema
        schema.add({ cacheable: { type: Boolean, default: (defaultEnabled || false) } });

        // middleware prior to save
        schema.pre('save', preSave);

        // schema methods for cache operations
        schema.methods.storeInCache = cacheStore;
        schema.methods.invalidateCache = cacheInvalidate;
        schema.methods.deleteFromCache = deleteFromCache;
        schema.methods.enableCaching = enableCaching;
        schema.methods.disableCaching = disableCaching;
        // override connection's methods
        override(this);
    }

    return this;
};

module.exports = exports = rediscache;
