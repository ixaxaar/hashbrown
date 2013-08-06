/**
 * Created with JetBrains WebStorm.
 * this.User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

// External dependencies
var uuid = require('node-uuid');

// db
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
mongoose.connect('mongodb://localhost/persistence');

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
    parent:     String
});

UserSchema.index({uid: 1});

/** User Schema methods */

var GOD = null;

// add an user
UserSchema.methods.Add = function(granter, uid, hash, fn) {
    var that = this;
    if (uid == 'god' || mordor.Permission.hasAdminPermission(granter, mordor.Permission.mgr)) {
        findByUsername(uid, function(err, existsUser) {
            if (!err && existsUser == null) {
                if (uid && hash) {
                    that.uuid       =   uuid.v4();
                    that.uid        =   uid;
                    that.profile    =   new UserProfile({uuid: this.uuid,
                        uid: this.uid});
                    that.perm       =   new mordor.UserPermission({uuid: this.uuid,
                        admin: 0,
                        password: new mordor.Password({user:  this.uuid,
                            hash: hash})
                    });
                    that.perm[0].password[0].Change(hash);

                    // see if god does not exist already
                    if ((uid === 'god') && (!GOD)) {
                        // some special stuff, it's god after all!
                        that.perm[0].perm = [mordor.Permission.god];
                        that.perm[0].admin = mordor.Permission.god;
                        that.parent = null;

                        // email god's password, do not store on server! :O
                        heartbeat.notifyServerPassword(hash, null);
                        console.log(hash);
                        fn(null, that);
                    } else {
                        // for all other users find the parent from the requestor
                        User.findOne({uuid: granter.uuid}, function(err, parent) {
                            // check if the granter has permission to add a user (at least mgr)
                            if (!err && (parent != null) &&
                                (parent.perm[0].admin >= mordor.Permission.mgr)) {
                                that.parent =  parent.uuid;

                                // save the new user onto the DB
                                that.save(function(err, user) {
                                    if (!err) fn(null, user);
                                    else fn('Could not save new user ' + err, null);
                                });
                            }
                            // note: point of contingency: this is the safe route,
                            // but something better can be done
                            else if (granter.uid == 'god') {
                                that.parent =  GOD.uuid;
                                // save the new user onto the DB
                                that.save(function(err, user) {
                                    if (!err) fn(null, user);
                                    else fn('Could not save new user ' + err, null);
                                });
                            }
                            else throw 'Security: User exists but is not in DB?';
                        });
                    }
                } else { fn('Invalid parameters', null); }
            } else { fn('User name is taken', null); }
        });
    } else fn('Granter does not have permission to add user', null);
};

// delete a user
UserSchema.methods.Delete = function(granter, user, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            // find and remove from the DB
            User.find({uuid: user.uuid}).remove(function(err, u) {
                if (!err) fn(null, u);
                else fn('Could not find and delete user', null);
            });
        } else fn('Granter does not have permission to delete', null);
    });
};

// grant permissions to a user
UserSchema.methods.Grant = function(granter, user, kingdom, perm, fn) {
    exports.findKingdomByUrl(kingdom, function(err, k) {
        if (!err && k) {
            // see if granter is higher up than the user
            mordor.Permission.hasGreaterPermission(granter, user, function(err) {
                if (!err) {
                    user.perm[0].grant(granter, user, k, perm, function(err, u) {
                        if (!err) fn(null, u);
                        else fn(err, null);
                    });
                } else fn('Granter does not have permission to grant', null);
            });
        }
    });
};

// revoke permissions from a user
UserSchema.methods.Revoke = function(granter, user, kingdom, perm, fn) {
    // see if granter is higher up than the user
    exports.findKingdomByUrl(kingdom, function(err, k) {
        if (!err && k) {
            // see if granter is higher up than the user
            mordor.Permission.hasGreaterPermission(granter, user, function(err) {
                if (!err) {
                    user.perm[0].revoke(granter, user, k, perm, function(err, u) {
                        if (!err) fn(null, u);
                        else fn(err, null);
                    });
                } else fn('Granter does not have permission to revoke', null);
            });
        }
    });
};

UserSchema.methods.Promote = function(granter, user, perm, fn) {
    user.perm[0].promote(granter, user, perm, function(err, u) {
        if (err) fn('Could not promote');
        else fn(null, u);
    });
};

// reassociate a user to a different parent
// todo: rewrite
UserSchema.methods.Reassoc = function(granter, user, newParent, fn) {
    // see if granter has permission to change user's parent
    findByUuid(user.parent, function(err, p) {
        if (!err) {
            // In case of any dangling children, adopt them, like init does (re-assess this strategy)
            if (!p) p = GOD;
            mordor.Permission.hasGreaterPermission(granter, p, function(err) {
                if (!err) {
                    mordor.Permission.hasGreaterPermission(granter, newParent, function(err) {
                        if (!err) {
                            user.parent = newParent.uuid;
                            fn(null, user);
                        } else fn('New parent is not qualified', null);
                    });
                } else fn('Granter does not have permission to re-associate', null);
            });
        } else {
            fn('Existing parent not found');
        }
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
            user.perm[0].changePasswd(grnter, passwd);
            fn(null, user);
        } else fn('Granter does not have permission to change password', null);
    });
};

// update a user's admin status
UserSchema.methods.Admin = function(granter, user, perm, fn) {
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm[0].updateAdmin(granter, perm);
            fn(false, user);
        } else fn('Granter does not have permission to update admin', null);
    });
};

// register the model globally
var User = mongoose.model("UserSchema", UserSchema);
User.ensureIndexes(function(err){ if (err) console.log('ensureIndexes failed')});

/**
 * Kingdom Management structures
 */

var KingdomSchema = new Schema({
    name:       String,
    perm:       [mordor.KingdomPermissionSchema],
    pkg:        []
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
            perm: new kps({uuid: id, permEntry: shift})});
    kingdom.pkg.push(pkg);

    // bow down before god the moment this is created!
    GOD.perm[0].perm[shift] = mordor.Permission.god;
    Kingdoms.push(kingdom);
    fn(null, kingdom);
};

KingdomSchema.methods.Remove = function(kingdom, fn) {
    // nothing to do here? lol
    var ctr = 0;
    Kingdoms.forEach(function(k) {
        if (k.name == kingdom.name) {
            Kingdoms.remove(ctr);
            return fn(null, kingdom);
        }
        ctr++;
    });

    return fn('Could not remove kingdom', kingdom);
};

exports.findKingdomByUrl = function(name, fn) {
    Kingdoms.forEach(function(k) {
        if (k.pkg[0].name == name) fn(null, k);
        else fn('Could not find kingdom', null);
    })
};

// register the model globally
var Kingdom = mongoose.model("KingdomSchema", KingdomSchema);
exports.Kingdom = Kingdom;

/** APIs exposed */

var result = function(type, msg, outcome){
    this.type = type;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};

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
    }
    console.log("Exception occured while processing request");
};

AddUser = function(reqJSON, granter, res) {
    var u = new User({});

    u.Add(granter, reqJSON.username, reqJSON.password,
        function(err, u) {
            if (err || !u)
                res.send(new result('Add', err, false));
            else
                res.send(new result('Add',
                    'User ' + reqJSON.username + ' created', true));
        });
};


DeleteUser = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (!err && u) u.Delete(granter, u,
            function(err, delu) {
                if (err)
                    res.send(new result('Delete', err, false));
                else
                    res.send(new result('Delete',
                        'User ' + reqJSON.username + ' deleted', true));
            });
        else res.send(new result('Add', 'No such user exists', false));
    });
};

Promote = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (!err && u) {
            //parse the permissio from JSON request
            var perm = mordor.Permission.none;
            switch(reqJSON.permission) {
                case 'access':
                    perm = mordor.Permission.access;
                    break;
                case 'modify':
                    perm = mordor.Permission.modify;
                    break;
                case 'mgr':
                    perm = mordor.Permission.mgr;
                    break;
                case 'admin':
                    perm = mordor.Permission.admin;
                    break;
                case 'org':
                    perm = mordor.Permission.org;
                    break;
                default:
                    // lol?
                    perm = u.perm[0].admin;
                    break;
            }

            u.Promote(granter, u, perm,
                function(err, pu) {
                    if (err || !pu)
                        res.send(new result('Promote', err, false));
                    else {
                        pu.save(function(err) {
                            if (!err) res.send(new result('Promote',
                                'User ' + reqJSON.username + ' promoted', true));
                            else res.send('Promote', 'Could not promote user', false);
                        });

                    }
                });
        }
        else res.send(new result('Add', 'No such user exists', false));
    });
};

Grant = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        var perm = mordor.Permission.none;
        switch(reqJSON.permission) {
            case 'access':
                perm = mordor.Permission.access;
                break;
            case 'modify':
                perm = mordor.Permission.modify;
                break;
            case 'mgr':
                perm = mordor.Permission.mgr;
                break;
            case 'admin':
                perm = mordor.Permission.admin;
                break;
            case 'org':
                perm = mordor.Permission.org;
                break;
            default:
                // lol?
                perm = u.perm[0].admin;
                break;
        }

        if (!err && u) u.Grant(granter, u, reqJSON.kingdom, perm,
            function(err, pu) {
                if (err || !pu)
                    res.send(new result('Grant', err, false));
                else {
                    pu.save(function(err, spu) {
                        if (!err) res.send(new result('Grant',
                            'User ' + reqJSON.username + ' granted', true));
                        else res.send('Grant', 'Could not grant user', false);
                    });
                }

            });
        else res.send(new result('Grant', 'No such user exists', false));
    });
};

Revoke = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        var perm = mordor.Permission.none;
        switch(reqJSON.permission) {
            case 'access':
                perm = mordor.Permission.access;
                break;
            case 'modify':
                perm = mordor.Permission.modify;
                break;
            case 'mgr':
                perm = mordor.Permission.mgr;
                break;
            case 'admin':
                perm = mordor.Permission.admin;
                break;
            case 'org':
                perm = mordor.Permission.org;
                break;
            default:
                // lol?
                perm = u.perm[0].admin;
                break;
        }
        if (!err && u) u.Revoke(granter, u, reqJSON.kingdom, perm,
            function(err, pu) {
                if (err || !pu)
                    res.send(new result('Revoke', err, false));
                else {
                    pu.save(function(err, spu) {
                        if (!err) res.send(new result('Revoke',
                            'User ' + reqJSON.username + ' revoked', true));
                        else res.send(new result('Revoke', 'No such user exists', false));
                    });
                }

            });
        else res.send(new result('Revoke', 'No such user exists', false));
    });
};

Reassociate = function(reqJSON, granter, res) {
    exports.findByUsername(reqJSON.username, function(err, u) {
        if (err || !u) res.send(new result('Reassociate', 'No such user exists', false));
        else
            exports.findByUsername(reqJSON.newParent, function(err, p) {
                if (!err && p) u.Reassoc(granter, u, p,
                    function(err, pu) {
                        if (err || !pu)
                            res.send(new result('Reassociate', err, false));
                        else {
                            pu.save(function(err, spu) {
                                if (!err)
                                    res.send(new result('Reassociate',
                                        'User ' + reqJSON.username + ' reassociated', true));
                                else res.send(new result('Grant', 'Could not save', false));
                            });
                        }
                    });
                else res.send(new result('Reassociate', 'No such user exists', false));
            });
    });
};

var requestRouter = function(req, res, next) {
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
        if (req.body)
            switch (req.body.type) {
                case 'Add':
                    AddUser(req.body.req, req.user, res);
                    ret = true;
                    break;
                case 'Delete':
                    DeleteUser(req.body.req, req.user, res);
                    ret = true;
                    break;
                case 'Promote':
                    Promote(req.body.req, req.user, res);
                    ret = true;
                    break;
                case 'Grant':
                    Grant(req.body.req, req.user, res);
                    ret = true;
                    break;
                case 'Revoke':
                    Revoke(req.body.req, req.user, res);
                    ret = true;
                    break;
                case 'Reassociate':
                    Reassociate(req.body.req, req.user, res);
                    ret = true;
                    break;
                default:
                    res.send(new result(req.type,
                        'Failed to service request, type not found', false));
                    break;
            }
        else
            res.send(new result(req.type,
                'Failed to service request, somethings not right', false));

    } catch (e) {
        sendException(e, function() {
            res.send(new result(req.type, 'Failed to service request', false));
        });
    }
};

// constructor creates god
EntityTree = function (app) {
    try {
        if (!parentApp) parentApp = app;
        var newuser = new User({});

        newuser.Add(null, 'god', uuid.v4(), function(err, u) {
            if (err) throw err;
            if (!u) throw 'User object returned is null';
            if (u) GOD = u;
        });

        // every internal function of UserSchema is exposed via this.schema
        this.schema = UserSchema;
        this.kingdom = KingdomSchema;

        app.post('/', mordor.openBlackGate, requestRouter);

    } catch (e) { sendException(e, null); }

    return this;
};

exports.Setup = EntityTree;

var findByUuid = function(u, fn) {
    // god cannot be found by uuid! :D
    return User.findOne({ uuid: u }, fn);
};
exports.findByUuid = findByUuid;

var findByUsername = function(u, fn) {
    if (u == 'god') return fn(null, GOD);
    else return User.findOne({ uid: u }, fn);
};
exports.findByUsername = findByUsername;


// som eof the functions that might be useful when the GUI is up
//ListAllUsersWithThisParent(granter)
//FindUser()
//SeeOrgStructure()
