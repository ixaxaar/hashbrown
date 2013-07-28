/**
 * Created with JetBrains WebStorm.
 * this.User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

// External dependencies
var uuid = require('node-uuid');
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;


// Internal dependencies
var mordor = require('./ODNSWIM');
var heartbeat = require('./heartbeat');

/**
 * User Management structures
 */

/* TODO: phobi has to tell us what fields he needs here */
var UserProfileSchema = new Schema({
    uuid:       String,
    uid:        String,
    name:       String,
    email:      String,
    data:       []
});
// register the model globally
var UserProfile = mongoose.model("UserProfileSchema", UserProfileSchema);


var UserSchema = new Schema({
    uuid:       String,
    uid:        String,
    profile:    [UserProfileSchema],
    perm:       [mordor.UserPermissionSchema],
    parent:     ObjectId
});

/** User Schema methods */

var GOD = null;

// add an user
UserSchema.methods.Add = function(granter, uid, hash, fn) {
    if (uid && hash) {
        this.uuid       =   uuid.v4();
        this.uid        =   uid;
        this.profile    =   new UserProfile({uuid: this.uuid,
                                            uid: this.uid});
        this.perm       =   new mordor.UserPermission({uuid: this.uuid,
            admin: 0,
            password: new mordor.Password({user:  this.uuid,
                hash: hash})
        });

        // see if god does not exist already
        if ((uid === 'god') && (!GOD)) {
            // some special stuff, it's god after all!
            this.perm[0].perm = [mordor.Permission.god];
            this.perm[0].admin = mordor.Permission.god;
            this.parent = null;

            // email god's password, do not store on server! :O
            heartbeat.notifyServerPassword(hash, null);
            console.log(hash);
            fn(null, this);
        } else if (req) {
            // for all other users find the parent from the requestor
            this.parent = UserSchema.find({uid: granter.uuid}, function(err, parent) {
                // check if the granter has permission to add a user (at least mgr)
                if (!err && user &&
                    (parent.perm.admin >= mordor.Permission.mgr))
                    return parent;
                // note: point of contingency: this is the safe route,
                // but something better can be done
                else return GOD;
            });

            // only managers and above can add a user
            if (mordor.Permission.hasAdminPermission(granter, mordor.Permission.mgr)) {
                this.save(function(err, user) {
                    if (!err) fn(null, user);
                    else fn('Could not save new user', null);
                });
            } else fn('Granter does not have permission to add user', null);

        } else { fn(true, null); }
    } else { fn('Invalid parameters', null); }
};

// delete a user
UserSchema.methods.Delete = function(granter, user, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            // find and remove from the DB
            UserSchema.find({uid: user.uuid}).remove(function(err, u) {
                if (!err) fn(null, u);
                else fn('Could not find user', null);
            });
        } else fn('Granter does not have permission to delete', null);
    });
};

// grant permissions to a user
UserSchema.methods.Grant = function(granter, user, kingdom, perm, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.grant(granter, kingdom, perm, function(err, u) {
                if (!err) fn(null, u);
                else fn('Granter cannot grant', null);
            });
        } else fn('Granter does not have permission to grant', null);
    });
};

// revoke permissions from a user
UserSchema.methods.Revoke = function(granter, user, kingdom, perm, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.revoke(granter, kingdom, perm, function(err, u) {
                if (!err) fn(null, u);
                else fn('Granter cannot grant', null);
            });
        } else fn('Granter does not have permission to grant', null);
    });
};

UserSchema.methods.Promote = function(granter, user, perm, fn) {
    user.perm.promote(granter, perm, function(err, u) {
        if (err) fn('Could not promote');
        else fn(null, u);
    });
}

// reassociate a user to a different parent
UserSchema.methods.Reassoc = function(granter, user, newParent, fn) {
    // see if granter has permission to change user's parent
    mordor.permission.hasGreaterPermission(granter, user.parent, function(err) {
        if (!err) {
            mordor.permission.hasGreaterPermission(granter, newParent, function(err) {
                if (!err) {
                    user.parent = newParent;
                    fn(null, user);
                } else fn('New parent is not qualified', null);
            });
        } else fn('Granter does not have permission to re-associate', null);
    });
};

// update a user's profile data
UserSchema.methods.UpdateProfile = function(granter, user, data, fn) {
    // todo
    fn(null, user);
};

UserSchema.methods.Passwd = function(granter, user, passwd, fn) {
    // now this is a tricky one! - todo: does the user's manager has control?
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.changePasswd(grnter, passwd);
            fn(null, user);
        } else fn('Granter does not have permission to change password', null);
    });
};

// update a user's admin status
UserSchema.methods.Admin = function(granter, user, perm, fn) {
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.updateAdmin(granter, perm);
            fn(false, user);
        } else fn('Granter does not have permission to update admin', null);
    });
};

// register the model globally
var User = mongoose.model("UserSchema", UserSchema);

/**
 * Kingdom Management structures
 */

var KingdomSchema = new Schema({
    name:       String,
    perm:       [mordor.KingdomPermissionSchema],
    package:    ObjectId
});

/**
 * The Kingdom Management functions
 */

// static local array for storing all kingdoms - todo: commit to DB?
var Kingdoms = [];

KingdomSchema.methods.Add = function(pkg, shift, fn) {
    var id = uuid.v4();
    var kps = mongoose.model('KingdomPermissionSchema',
        mordor.KingdomPermissionSchema);

    var kingdom =
        new Kingdom({name: id,
            perm: new kps({uuid: id, permEntry: shift}),
            package: pkg});

    // bow down before god the moment this is created!
    if (GOD) GOD.grant(GOD, GOD, kingdom, mordor.Permission.god, function(err, god) {
        if (err) {
            fn('WTF! God was denied permission', null);
            throw 'OMG WTF!';
        } else {
            Kingdoms.push(kingdom);
            fn(null, kingdom);
        }
    });
};

KingdomSchema.methods.Remove = function(kingdom, fn) {
    // nothing to do here? lol
    fn(null, kingdom);
};

KingdomSchema.methods.findByUrl = function(url, fn) {
    for (var k in Kingdoms) {
        if (url.split('/')[0] == k.name) {
            fn(null, k);
        } else fn("Could not find kindom by the given url", null);
    }
};

// register the model globally
var Kingdom = mongoose.model("KingdomSchema", KingdomSchema);

/** APIs exposed */

var result = function(type, msg, outcome){
    this.type = type;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};

var parentApp = null;


var sendException = function(e, recovery) {
    // throw all exceptions in a dev environment
    if ('development' == parentApp.get('env')) throw e;

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

// constructor creates god
EntityTree = function (app) {
    try {
        if (!parentApp) parentApp = app;
        var newuser = new User({});

        newuser.Add(null, 'god', uuid.v4(), function(err, g) {
            if (err) throw err;
            if (!g) throw 'User object returned is null';
            if (g) GOD = g;
        });

        // every internal function of UserSchema is exposed via this.schema
        this.schema = UserSchema;
        this.kingdom = KingdomSchema;

        app.post('/user-settings', requestRouter);

    } catch (e) { sendException(e, null); }

    return this;
};

exports.Setup = EntityTree;

requestRouter = function(req, res, next) {
    req.accepts('application/json');
    var ret = false;

    /*
         req has to have a certain JSON structure with these fields:
         {
         type: type, // type of request
         req: {} // request body
         }
     */
    try {
        if (req && res && req.params.type && req.params.user)
            switch (req.type) {
                case 'Add':
                    AddUser(req.params.req, req.user, res);
                    ret = true;
                    break;
                case 'Delete':
                    DeleteUser(req.params.req, req.user, res);
                    ret = true;
                    break;
                case 'Promote':
                    Promote(req.params.req, req.user, res);
                    ret = true;
                    break;
                case 'Grant':
                    Grant(req.params.req, req.user, res);
                    ret = true;
                    break;
                case 'Revoke':
                    Revoke(req.params.req, req.user, res);
                    ret = true;
                    break;
                case 'Reassociate':
                    Reassociate(req.params.req, req.user, res);
                    ret = true;
                    break;
                default:
                    break;
            }
        else
            res.send(new result(req.type,
                'Failed to service request, type not found', false));

    } catch (e) {
        sendException(e, function() {
            res.send(new result(req.type, 'Failed to service request', false));
        });
    }
};

AddUser = function(reqJSON, granter, res) {
    UserSchema.Add(granter, reqJSON.username, reqJSON.password,
        function(err, u) {
            if (err || !u)
                res.send(new result('Add', 'Could not create user', false));
            else
                res.send(new result('Add',
                    'User' + reqJSON.username + 'created', true));
        });
};


DeleteUser = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (!err) UserSchema.Delete(granter, u,
            function(err, u) {
                if (err || !u)
                    res.send(new result('Delete', 'Could not delete user', false));
                else
                    res.send(new result('Delete',
                        'User' + reqJSON.username + 'deleted', true));
            });
        else res.send(new result('Add', 'No such user exists', false));
    });
};

Promote = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (!err) UserSchema.Promote(granter, u, reqJSON.permission,
            function(err, u) {
                if (err || !u)
                    res.send(new result('Promote', 'Could not promote user', false));
                else
                    res.send(new result('Promote',
                        'User' + reqJSON.username + 'deleted', true));
            });
        else res.send(new result('Add', 'No such user exists', false));
    });
};

Grant = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (!err) UserSchema.Grant(granter, u, reqJSON.kingdom, reqJSON.permission,
            function(err, u) {
                if (err || !u)
                    res.send(new result('Grant', 'Could not grant user', false));
                else
                    res.send(new result('Grant',
                        'User' + reqJSON.username + 'granted', true));
            });
        else res.send(new result('Grant', 'No such user exists', false));
    });
};

Revoke = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (!err) UserSchema.Revoke(granter, u, reqJSON.kingdom, reqJSON.permission,
            function(err, u) {
                if (err || !u)
                    res.send(new result('Revoke', 'Could not revoke user', false));
                else
                    res.send(new result('Revoke',
                        'User' + reqJSON.username + 'revoked', true));
            });
        else res.send(new result('Revoke', 'No such user exists', false));
    });
};

Reassociate = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (err) res.send(new result('Revoke', 'No such user exists', false));
        else
            exports.findByUsername(reqJSON.newParent, function(err, p) {
                if (!err) UserSchema.Reassoc(granter, u, p,
                    function(err, u) {
                        if (err || !u)
                            res.send(new result('Revoke', 'Could not reassociate user', false));
                        else
                            res.send(new result('Revoke',
                                'User' + reqJSON.username + 'reassociated', true));
                    });
                else res.send(new result('Revoke', 'No such user exists', false));
            });
    });
};

exports.findByUuid = function(u, fn) {
    UserSchema.find({ uuid: u }, fn);
};

exports.findByUsername = function(u, fn) {
    UserSchema.find({ uid: u }, fn);
};
