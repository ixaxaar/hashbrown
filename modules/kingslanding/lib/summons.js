
var events = require('events')
    , eventEmitter = events.eventEmitter;

var scroll = require('./scroll');

var summons = function() { };

// inherit from eventEmitter class
summons.__proto__.prototype = eventEmitter.prototype;

summons.prototype.receiver = function(receiver) {
    if (!this.org) this.org = receiver.org;

    // add this receiver iff he belongs to the same org as the previous ones
    if(receiver.org === this.org)
        this.receivers ?
            this.receivers.push(receiver.uid) :
            this.receivers = [receiver.uid];
};

summons.prototype.team = function(team) {
    if (!this.org) this.org = team.org;

    // add this team iff he belongs to the same org as the previous ones
    if(team.org === this.org)
        this.teams ?
            this.teams.push(team.name) :
            this.teams = [team.name];
};

summons.prototype.actor = function(actor) {
    if (!this.org) this.org = actor.org;

    // there can be only one actor
    if (actor.org === this.org) {
        this.actor = actor.uid;
        this.actorName = actor.profile[0].name;
    }
};

summons.prototype.report = function(report) {
    if (report) {
        this.report = true;
    }
};

summons.prototype.msg = function(msg) {
    this.msg = msg;
};

summons.prototype.exec = function() {
    var s = new scroll({});
    s.create(this);
};

var handleSummon = function(args) {
    var argsJson    = JSON.parse(args);

    // create a summoning
    var s =  new summons();
    if (argsJson.actor) s.actor(argsJson.actor);
    if (argsJson.receivers) argsJson.receivers.forEach(function(r) { s.receiver(r) });
    if (argsJson.teams) argsJson.teams.forEach(function(r) { s.team(r) });
    if (argsJson.report) s.report();
    if (argsJson.msg) s.msg(argsJson.msg);
    s.exec();
};

// handle error event to prevent node from crashing
summons.on('error', function() {});

summons.on('notify', handleSummon);

summons.prototype.notify = function(args) {
    this.emit('notify', JSON.stringify(args));
};

modules.exports = exports = summons;
