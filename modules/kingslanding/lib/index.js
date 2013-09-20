

var _ = require('underscore');

var winston = require('winston');
global.log = winston.log;

var framework = require('../../../framework')
    , notifyDevelopers = framework.notifyDevelopers
    , report = framework.heartbeatEnabled
    , findTeam = framework.findTeam;


// Validation is seriously a bitch :S
var validation = require('./validation')
    , validate = validation.validate
    , requestValidatorSchema = validation.requestValidatorSchema
    , resultConstructorValidatorSchema = validation.resultConstructorValidatorSchema
    , newCouncilValidatorSchema = validation.newCouncilValidatorSchema
    , inviteCouncilValidatorSchema = validation.inviteCouncilValidatorSchema
    , commentCouncilValidatorSchema = validation.commentCouncilValidatorSchema
    , uncommentCouncilValidatorSchema = validation.uncommentCouncilValidatorSchema
    , upvoteCouncilValidatorSchema = validation.upvoteCouncilValidatorSchema
    , downvoteCouncilValidatorSchema = validation.downvoteCouncilValidatorSchema
    , conclusionCouncilValidatorSchema = validation.conclusionCouncilValidatorSchema
    , destroyCouncilValidatorSchema = validation.destroyCouncilValidatorSchema
    , createTaleValidatorSchema = validation.createTaleValidatorSchema
    , destroyTaleValidatorSchema = validation.destroyTaleValidatorSchema
    , sayTaleValidatorSchema = validation.sayTaleValidatorSchema
    , unsayTaleValidatorSchema = validation.unsayTaleValidatorSchema
    , cheerTaleValidatorSchema = validation.cheerTaleValidatorSchema
    , uncheerTaleValidatorSchema = validation.uncheerTaleValidatorSchema;

var council = require('./council');
var tale = require('./tale');
var timeline = require('./timeline');


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
    var r = new resultConstructor(req.body.request, req.body.uuid, msg, result);

    log('debug', 'sending \n' + JSON.stringify(r));

    if (_.isNumber(r.msg)) {
        res.send(r.msg);
    }
    else if (validate(r, resultConstructorValidatorSchema)) {
        res.send(r);
    }
    else {
        res.send(404);
    }
};

var councilRequestRouter = function(req, res, next) {
    req.accepts('application/json');

//    try {
    var respond = function(result, msg) {
        result = !!result;
        if (!msg) msg = result;

        requestResponder(req, res, result, msg);
    };

    if (validate(req.body, requestValidatorSchema))
        switch(req.body.request) {
            case 'create':
                if (validate(req.body.body, newCouncilValidatorSchema)) {
                    council.spawn(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'invite':
                if (validate(req.body.body, inviteCouncilValidatorSchema)) {
                    council.invite(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'comment':
                if (validate(req.body.body, commentCouncilValidatorSchema)) {
                    council.comment(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'uncomment':
                if (validate(req.body.body, uncommentCouncilValidatorSchema)) {
                    council.uncomment(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'upvote':
                if (validate(req.body.body, upvoteCouncilValidatorSchema)) {
                    council.upvote(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'downvote':
                if (validate(req.body.body, downvoteCouncilValidatorSchema)) {
                    council.downvote(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'conclusion':
                if (validate(req.body.body, conclusionCouncilValidatorSchema)) {
                    council.conclusion(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'destroy':
                if (validate(req.body.body, destroyCouncilValidatorSchema)) {
                    council.destroy(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            default:
                respond(false, 'Request format is wrong');
                break;
        }
//    } catch (e) {
//        sendException(e, function() {
//            respond(false, 'Request format is wrong');
//        });
//    }
};

var taleRequestRouter = function(req, res, next) {
    req.accepts('application/json');

//    try {
    var respond = function(result, msg) {
        result = !!result;
        if (!msg) msg = result;

        requestResponder(req, res, result, msg);
    };

    if (validate(req.body, requestValidatorSchema))
        switch(req.body.request) {
            case 'create':
                if (validate(req.body.body, createTaleValidatorSchema)) {
                    tale.spawn(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'destroy':
                if (validate(req.body.body, destroyTaleValidatorSchema)) {
                    tale.destroy(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'say':
                if (validate(req.body.body, sayTaleValidatorSchema)) {
                    tale.say(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'unsay':
                if (validate(req.body.body, unsayTaleValidatorSchema)) {
                    tale.unsay(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'cheer':
                if (validate(req.body.body, cheerTaleValidatorSchema)) {
                    tale.cheer(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            case 'uncheer':
                if (validate(req.body.body, uncheerTaleValidatorSchema)) {
                    tale.uncheer(req.user, req.body.body, respond);
                }
                else respond(false, 'Request format is wrong');
                break;

            default:
                respond(false, 'Request format is wrong');
                break;
        }
//    } catch (e) {
//        sendException(e, function() {
//            respond(false, 'Request format is wrong');
//        });
//    }
};

var timelineRequestRouter = function(req, res, next) {
    req.accepts('application/json');

//    try {
    var respond = function(result, msg) {
        result = !!result;
        if (!msg) msg = result;

        requestResponder(req, res, result, msg);
    };

    if (validate(req.body, requestValidatorSchema))
        switch(req.body.request) {
            case 'timeline':
                timeline.timeline(req.user, req.body.body.slab, respond);
                break;

            case 'usertimeline':
                timeline.userTimeline(req.user, req.body.body.slab, respond);
                break;

            default:
                respond(false, 'Request format is wrong');
                break;
        }
//    } catch (e) {
//        sendException(e, function() {
//            respond(false, 'Request format is wrong');
//        });
//    }
};



var kingslanding = function(app) {
    app.post(/\/council/, councilRequestRouter);

    app.post(/\/tale/, taleRequestRouter);

    app.post(/\/timeline/, timelineRequestRouter);

//    app.all("*", function(req, res) { res.send(404); });
};

module.exports = exports = kingslanding;
