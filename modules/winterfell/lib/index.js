
var feed = require('./feed');

var framework = require('../../../framework')
    , notifyDevelopers = framework.notifyDevelopers
    , report = framework.heartbeatEnabled;

var validation = require('./validation')
    , validate = validation.validate
    , requestValidatorSchema = validation.requestValidatorSchema
    , resultConstructorValidatorSchema = validation.resultConstructorValidatorSchema;

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
        throw e;
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
    var r = new resultConstructor(req.request, req.uuid, msg, result);

    if (validate(r, resultConstructorValidatorSchema)) {
        res.send(r);
    }
    else {
        res.send(404);
    }
};

var feedRequestRouter = function(req, res, next) {
    req.accepts('application/json');

//    try {
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

                case 'checkinfeed':
                    var F = new feed.Feed({});
                    F.Checkin(req.user, req.body.body, respond);
                    break;

                case 'checkoutfeed':
                    var F = new feed.Feed({});
                    F.Checkout(req.user, req.body.body, respond);
                    break;

                case 'pullrequest':
                    var F = new feed.Feed({});
                    F.PullRequest(req.user, req.body.body, respond);
                    break;

                case 'acceptpull':
                    var F = new feed.Feed({});
                    F.AcceptPull(req.user, req.body.body, respond);
                    break;

                case 'rejectpull':
                    var F = new feed.Feed({});
                    F.RejectPull(req.user, req.body.body, respond);
                    break;

                case 'gethistory':
                    var F = new feed.Feed({});
                    F.GetHistory(req.user, req.body.body, respond);
                    break;

                case 'getfullhistory':
                    var F = new feed.Feed({});
                    F.GetFullHistory(req.user, req.body.body, respond);
                    break;

                case 'newchildfeed':
                    feed.findFeed(req.user, req.body.body.uuid, function(err, f) {
                        if (!err && f) f.AddChild(req.user, req.body.body, respond);
                        else respond(false, 'Feed not found');
                    });
                    break;

                case 'deletefeed':
                    feed.findFeed(req.user, req.body.body.uuid, function(err, f) {
                        if (!err && f) f.Delete(req.user, req.body.body, respond);
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
                    log('warning', 'invalid request');
                    respond(false, 'Request not found');
            }
        else respond(false, 'Request not found');
//    } catch (e) {
//        sendException(e, function() {
//            respond(false, 'Request format is wrong');
//        });
//    }
};

var winterfell = function(app) {
    app.post(/\/feed/, feedRequestRouter);

//    app.all("*", function(req, res) { res.send(404); });
};

module.exports = exports = winterfell;

