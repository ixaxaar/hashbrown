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

var pile = function(key, ttl, maxSize) {
    this.key = key;
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.size = 0;
    this.pile = [];
};

pile.prototype.drive = function(content) {
    content = content || {};
    var that = this;

    if (content.__piled) {
        this.redisConnection.exists(content._id, function(e) {
            if (!e) {
                that.pile.push(that.key + content._id);
                that.size++;
            }
            // note: this automatically replaces existing content
            that.redisConnection.setex(that.key + content._id, that.ttl, JSON.stringify(content));
        });
    }

    // in case maxSize is reached, shift the older ones
    if (this.maxSize > this.size) {
        var k = this.pile.shift();
        this.redisConnection.del(this.key + content._id);
    }
};

pile.prototype.getPile = function(num, iterator, fn) {
    var that = this;
    var p = [];
    num = num || this.maxSize;
    iterator = iterator || fn() {};

    this.pile.forEach(function(pp) {
        that.redisConnection.get(pp, function(err, data) {
            if (!err && iterator(data)) {
                try { p.push(JSON.parse(data)) } catch (e) {};
                if (!--num) break;
        });
    });

    fn(p);
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

    this.pile = null;
};

PileDriver.prototype.enablePile = function(schemaName, schema, options) {
    options = options || {};

    if (!this.pile) {
        // this signifies whether piling is enabled, we take consent of course ;)
        schema.add({ __piled: { type: Boolean, default: true } });
    }

    this.key = schemaName;

    this.pile = this.pile       || 
        new pile(
            options.key,
            options.ttl         || 864000,  // ten days, in some cases, infinity is better
            options.maxStack    || 100000   // maximum pile size
        );

    schema.methods.disablePile      = function() { this.__piled = false };
    schema.methods.getPile          = this.pile.getPile;
    schema.methods.pile             = this.pile.drive;
    schema.post                     = this.pile.drive;
};

module.exports = exports = PileDriver;

