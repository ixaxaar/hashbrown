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


var redis = require('redis');
var goose = require('mongoose');
var uuid = require('node-uuid');

var _ = require('underscore');

var pile = function(ttl, maxSize, replace) {
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.replace = replace;
    this.pile = [];
};

var pileDoc = function(content) {
    this.content = content;
};

pileDoc.prototype.save = function(callback) {
    //
};

pile.prototype.driveIntoPile = function(content) {
    content = content || {};
    // delete the old content, if replace is enabled
    if (this.replace) this.pile = _.reject(this.pile, function(p) { return p._id === content._id });
    // pile up the new content
    this.pile.push(content);
};

pile.prototype.getPile = function() {
    return this.pile;
};

pile.prototype.find = function(key, value) {
    return _.find(this.pile, function(p) {
        return (p[key] === value);
    });
};

var PileDriver = function(redisOptions, mongoOptions) {
    // connect to redis client
    redisOptions = redisOptions || {};
    this.redisConnection = redis.createClient(redisOptions.port, redisOptions.host);
    redisConnection.auth(redisOptions.credentials);

    var errorHandler = function (err) { /* bleh */ };
    (errHandler) ? client.on("error", errorHandler) : client.on("error", redisOptions.errHandler);

    // connect to mongoDB, will default to the default mongoDB connection
    mongoOptions = mongoOptions || goose;
    this.mongoConnection = mongoOptions.connection;

    this.schemaName = '';
    this.pile = null;
};


PileDriver.prototype.enablePile = function(schemaName, schema, options) {
    options = options || {};
    if (!this.pile) {
        // this signifies whether piling is enabled, we take consent of course ;)
        schema.add({ __piled: { type: Boolean, default: true } });
    }

    this.schemaName = schemaName;

    this.pile = this.pile       || 
        new pile(
            options.ttl         || 86400,
            options.maxSize     || 100,
            options.replace     || true
        );

    schema.methods.disablePile      = function() { this.__piled = false };
    schema.methods.getPile          = this.pile.getPile;
    schema.methods.findInPile       = this.pile.find;
    schema.methods.pile             = this.pile.driveIntoPile;
    schema.post                     = this.pile.driveIntoPile;
};

module.exports = exports = PileDriver;

