
var feed = require('./feed');

var framework = require('../../../framework')
    , notifyDevelopers = framework.notifyDevelopers
    , report = framework.heartbeatEnabled;

var validation = require('./validation')
    , validate = validation.validator
    , requestValidatorSchema = validation.requestValidatorSchema;

var sendException = function(e, recovery) {
    if (report) {
        notifyDevelopers("Error",
            "Exception occured while creating god", function() {
                if ('development' == parentApp.get('env')) throw e;
            });
    }

    // try to recover?
    try {
        recovery();
    } catch (e) {
        log('crit', "Double exception!");
    }
    log('crit', "Exception occured while processing request");
};


var resultConstructor = function(request, uuid, msg, outcome) {
    this.request = request;
    this.uuid = uuid;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};

var requestResponder = function(req, res, result, msg) {
    var r = new resultConstructor(req.request, req.uuid, result, msg);

    if (validate(r, resultConstructorValidatorSchema)) {
        res.send(r);
    }
    else {
        res.send(404);
    }
};

var feedRequestRouter = function(req, res, next) {
    req.accepts('application/json');

    try {
        var respond = function(result, msg) {
            result = !!result;
            if (!msg) msg = result;

            requestResponder(req, res, result, msg);
        };

        if (validate(req.body, requestValidatorSchema))
            switch(req.body.request) {

                case 'newfeed':
                    var F = new feed.Feed({});
                    F.CreateFeed(req.user, req.body.body, respond);
                    break;

                case 'newchildfeed':
                    feed.findFeed(req.user, req.body.body.uuid, function(err, f) {
                        if (!err && f) f.AddChild(req.user, req.body.body, respond);
                        else respond(false, 'Feed not found');
                    });
                    break;

                case 'deletefeed':
                    feed.findFeed(req.user, req.body.body.uuid, function(err, f) {
                        if (!err && f) f.Delete(respond);
                        else respond(false, 'Feed not found');
                    });
                    break;

                case 'deletechildfeed':
                    feed.findFeed(req.user, req.body.body.uuid, function(err, f) {
                        if (!err && f) f.removeChild(req.body.body, respond);
                        else respond(false, 'Feed not found');
                    });
                    break;

                default:
                    respond(false, 'Request not found');
            }
        else respond(false, 'Request not found');
    } catch (e) {
        sendException(e, function() {
            respond(false, 'Request format is wrong');
        });
    }
};

var winterfell = function(app) {
    app.post(/\/feed/, feedRequestRouter);

    app.all("*", function(req, res) { res.send(404); });
};

module.export = exports = winterfell;

