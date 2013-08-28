


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
    }
    console.log("Exception occured while processing request");
};


var resultConstructor = function(request, uuid, msg, outcome) {
    this.request = request;
    this.uuid = uuid;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};

var requestResponder = function(req, res, result, msg) {
    var r = new resultConstructor(req.request, req.uuid, result, msg);

    if (!v.validate(r, resultConstructorValidatorSchema).errors.length) {
        res.send(r);
    }
    else {
        res.send(404);
    }
};



var winterfell = function() {

};

module.export = winterfell;
