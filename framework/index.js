
// json schema validation - for request jsons
var validation = require('./validation')
    , v = validation.validator
    , validate = validation.validate
    , resultConstructorValidatorSchema = validation.resultConstructorValidatorSchema
    , requestValidatorSchema = validation.requestValidatorSchema;


var entity = require('./entity');
var team = require('./team');
var heartbeat = require('./heartbeat');
var mordor = require('./ODNSWIM');

var parentApp = null;

var sendException = function(e, recovery) {
    // throw all exceptions in a dev environment
//    if ('development' == parentApp.get('env')) throw e;

    // whatever you do not, throw an exception here
    if (heartbeat.report) {
        heartbeat.notifyDevelopers("Error",
            "Exception occured while creating god", function() {
                if ('development' == parentApp.get('env')) throw e;
            });
    }

    // try to recover?
    try {
        recovery();
    } catch (e) {
        console.log("Double exception!");
        throw e;
    }
    console.log("Exception occured while processing request");
};


var resultConstructor = function(request, uuid, outcome, msg) {
    this.request = request;
    this.uuid = uuid;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};

var requestResponder = function(req, res, result, msg) {
    var r = new resultConstructor(req.body.request, req.body.uuid, result, msg);

    if (validate(r, resultConstructorValidatorSchema)) {
        res.send(r);
    }
    else {
        res.send(404);
    }
};

var entityServer = function(req, res, next) {
    req.accepts('application/json');

    var respond = function(result, msg) {
        if (!result) result = false;
        if (!msg) msg = 'none';

        requestResponder(req, res, result, msg);
    };

    try {
        if (validate(req.body, requestValidatorSchema))
            switch (req.body.request) {
                case 'add':
                    entity.addUser(req.user, req.body.body, respond);
                    break;
                case 'delete':
                    entity.deleteUser(req.user, req.body.body, respond);
                    break;
                case 'promote':
                    entity.promote(req.user, req.body.body, respond);
                    break;
                case 'grant':
                    entity.grant(req.user, req.body.body, respond);
                    break;
                case 'revoke':
                    entity.revoke(req.user, req.body.body, respond);
                    break;
                case 'reassociate':
                    entity.reassociate(req.user, req.body.body, respond);
                    break;
                default:
                    respond(false, 'Request format is wrong');
                    break;
            }
        else respond(false, 'Request format is wrong');

    } catch (e) {
        sendException(e, function() {
            respond(false, 'Request format is wrong');
        });
    }
};

var teamServer = function(req, res, next) {
    req.accepts('application/json');

    var respond = function(result, msg) {
        result = !!result;
        if (!msg) msg = result;

        requestResponder(req, res, result, msg);
    };

    try {
        if (validate(req.body, requestValidatorSchema))
            switch(req.body.request) {
                case 'adduser':
                    team.addUser(req.user, req.body.body, respond);
                    break;

                case 'removeuser':
                    team.deleteUser(req.user, req.body.body, respond);
                    break;

                case 'getallusers':
                    team.getAllUsers(req.user, req.body.body, respond);
                    break;

                case 'changeowner':
                    team.changeTeamOwner(req.user, req.body.body, respond);
                    break;

                default:
                    respond(false, 'Request format is wrong');
                    break;
            }
        else respond(false, 'Request format is wrong');

    } catch (e) {
        sendException(e, function() {
            respond(false, 'Request format is wrong');
        });
    }
};

var orgServer = function(req, res, next) {
    req.accepts('application/json');
    console.log(req.user)

    var respond = function(result, msg) {
        result = !!result;
        if (!msg) msg = result;

        requestResponder(req, res, result, msg);
    };

//    try {
        if (validate(req.body, requestValidatorSchema))
            switch(req.body.request) {
                case 'addteam':
                    console.log(req.body)
                    team.createTeam(req.user, req.body.body, respond);
                    break;

                case 'removeteam':
                    team.delTeam(req.user, req.body.body, respond);
                    break;

                case 'createorg':
                    team.godCreatesAnOrg(req.user, req.body.body, respond);
                    break;

                case 'removeorg':
                    team.godDestroysAnOrg(req.user, req.body.body, respond);
                    break;

                default:
                    respond(false, 'Request format is wrong');
                    break;
            }
        else respond(false, 'Request format is wrong');
//    } catch (e) {
//        sendException(e, function() {
//            respond(false, 'Request format is wrong');
//        });
//    }

};


var entityTree = function (app) {
    try {
        if (!parentApp) parentApp = app;
        entity.entity();

        app.post('/users', entityServer);

    } catch (e) { sendException(e, null); }

    return this;
};


var teamTree = function(app) {
    try {
        // set up the framework
        app.post('/team', teamServer);
        app.post('/user', orgServer);

        team.team();
    }
    catch (e) { sendException(e, null); }

    return this;
};

var framework = function(app) {
    if (app) {
        entityTree(app);
        teamTree(app);
    }
};

module.exports = exports = framework;
