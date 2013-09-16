
var goose = require('mongoose')
    , Schema = goose.Schema;


var scrollSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    org: String, // the owner'S organization
    created: { type : Date, default: Date.now() },
    content: [ContentSchema], // the content object
    actor: String,
    actorName: String,
    teams: [String],
    receivers: [String],
    broadcast: { type: Boolean, default: true } // is this a roadcast?
});
scrollSchema.index({ teams: 1, updated: -1 });


scrollSchema.methods.Create = function(contentjson, fn) {
    this.uuid       = uuid.v4();
    this.org        = contentjson.org;
    this.content    = contentjson.msg || '';
    this.actor      = contentjson.actor || null;
    this.actorName  = contentjson.actorName || '';

    if (contentjson.report)
        this.broadcast = true;
    else {
        if (contentjson.teams)
            contentjson.teams.forEach(function(t) { this.teams.push(t) });

        if (contentjson.receivers)
            contentjson.receivers.forEach(function(t) { this.receivers.push(t) });
    }

    this.save(fn);
};

scrollSchema.methods.Destroy = function(fn) {
    this.remove(fn)
};

var scroll = function() {
    var framework = require('../../../framework');
};

