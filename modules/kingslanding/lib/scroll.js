
var goose = require('mongoose')
    , Schema = goose.Schema;

var scrollSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    created: { type : Date, default: Date.now() },
    org: String,
    content: String,
    actor: String,
    actorName: String,
    teams: [String],
    receivers: [String],
    type: String,
    file: String,
    fileName: String,
    votes: Number
});
scrollSchema.index({ teams: 1, updated: -1 });


scrollSchema.methods.Create = function(contentjson, fn) {
    this.uuid       = uuid.v4();
    this.org        = contentjson.org;
    this.content    = contentjson.msg || '';
    this.actor      = contentjson.actor || null;
    this.actorName  = contentjson.actorName || '';
    this.votes      = 0;

    if (contentjson.report) {
        // a user's logs are accessible to the user's team-mates and higher-ups
        this.type = 'log';
        if (contentjson.teams)
            contentjson.teams.forEach(function(t) { this.teams.push(t) });
    }
    else if (contentjson.message) {
        // this scroll is directed towards a specific set of users
        this.type = 'msg';
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

    if (contentjson.file) {
        this.file = contentjson.file;
        this.filename = contentjson.filename;
    }
//    this.save(fn);
    fn(null, this);
};


scrollSchema.methods.Destroy = function(fn) {
    this.remove(fn)
};

module.exports = exports = goose.model('scroll', scrollSchema);

