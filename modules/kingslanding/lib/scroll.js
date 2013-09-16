
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
    type: String
});
scrollSchema.index({ teams: 1, updated: -1 });


scrollSchema.methods.Create = function(contentjson, fn) {
    this.uuid       = uuid.v4();
    this.org        = contentjson.org;
    this.content    = contentjson.msg || '';
    this.actor      = contentjson.actor || null;
    this.actorName  = contentjson.actorName || '';

    if (contentjson.report) {
        this.type = 'log';

        // a user's logs are accessible to the user's team-mates and higher-ups
        if (contentjson.teams)
            contentjson.teams.forEach(function(t) { this.teams.push(t) });
    }
    else if (contentjson.message) {
        this.type = 'msg';

        // this scroll is directed towards a specific set of users
        if (contentjson.receivers)
            contentjson.receivers.forEach(function(t) { this.receivers.push(t) });
    }
    else if (contentjson.private) {
        this.type = 'private';
    }
    else {
        // everyone can see this scroll
        this.type = 'broadcast';
    }

    this.save(fn);
};


scrollSchema.methods.Destroy = function(fn) {
    this.remove(fn)
};

module.exports = exports = goose.model('scroll', scrollSchema);

