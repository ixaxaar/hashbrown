
var events = require('events')
    , eventEmitter = events.eventEmitter;

var summons = require('./summons')
    , summon = summons.summon;

var handleNotification = function(args) {
    var argsJson    = JSON.parse(args);
    var receivers   = argsJson.receivers  || null;
    var teams       = argsJson.teams      || null;
    var actor       = argsJson.actor      || null;
    var msg         = argsJson.msg        || null;
    var report      = argsJson.report     || false;

    // create a summonong
    var s =  new summon();
    if (actor) s.actor(actor);
    if (receivers) receivers.forEach(function(r) { s.receiver(r) });
    if (teams) teams.forEach(function(r) { s.team(r) });
    if (report) s.report();
    if (msg) s.msg(msg);
    s.do();
};


// inherit from eventEmitter class
var eventFeed;

eventFeed.__proto__.prototype = eventEmitter.prototype;

// handle error event to stop node from crashing
eventFeed.on('error', function() {});

eventFeed.on('notify', handleNotification);

eventFeed.prototype.notify = function(args) {
    this.emit('notify', JSON.stringify(args));
};

modules.exports = exports = eventFeed;
