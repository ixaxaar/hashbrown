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

// json schema validation - for request jsons
var validation = require('./validation')
    , v = validation.validator
    , validate = validation.validate
    , userValidationSchema = validation.userValidationSchema
    , addUserValidationSchema = validation.addUserValidationSchema
    , deleteUserValidationSchema = validation.deleteUserValidationSchema
    , promoteUserValidationSchema = validation.promoteUserValidationSchema
    , grantUserValidationSchema = validation.grantUserValidationSchema
    , revokeUserValidationSchema = validation.revokeUserValidationSchema
    , reassociateUserValidationSchema = validation.reassociateUserValidationSchema;


// Internal dependencies
var mordor = require('./ODNSWIM')
    , permissions = mordor.Permission;

var heartbeat = require('./heartbeat');
var team = require('./team');

var validateEmail = function(email) {
    // http://stackoverflow.com/a/46181/11236
    var re;
    re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

////////////////////////////////
//   Users
////////////////////////////////

// @phobi, @pranaya - this is for you guys to decide ^_^
var UserProfileSchema = new Schema({
    uid:        String,
    name:       String,
    email:      String
});
var UserProfile = mongoose.model("UserProfileSchema", UserProfileSchema);

var UserSchema = new Schema({
    uuid:       { type:String, default: uuid.v4() },
    uid:        String,                         // user id
    profile:    [UserProfileSchema],            // user profile
    perm:       [mordor.UserPermissionSchema], // user permissions
    children:   [String],                       // children of this user
    teams:      [String],                       // belongs to team
    org:        String                          // user's organization
});

// as far as user indexing is concerned, we should afford
// a fairly exhaustive indexing space as this will be frequently accessed

// search by uid - mostly to find one guy
UserSchema.index({ uid: 1 });
// search by org, sort by team, to find guys in a team
UserSchema.index({ org: 1, teams: 1 });

var GOD = null;

// add an user
UserSchema.methods.createUser = function(granter, uid, hash, fn) {
    var that = this;

//    if (GOD === null || validate(granter, userValidationSchema)) {
        // god is created by nobody, so exempt him,
        // for all other users, the granter must be manager and above
        if ((uid === 'god' && GOD === null)  ||
            permissions.hasAdminPermission(granter, permissions.mgr)) {
            findByUsername(uid, function(err, existsUser) {
                if (!err && !existsUser && uid && hash) {
                    that.uid        =   uid;
                    // create a new profile (user is email)
                    that.profile    =   new UserProfile({ uid: this.uid, email: this.uid });
                    that.perm       =   new mordor.UserPermission({perm: [],
                                        admin: 0,
                                        password: new mordor.Password({ hash: hash })
                                        });
                    that.perm[0].password[0].Change(hash);

                    if (uid === 'god') {
                        // some special stuff, it's god after all!
                        that.perm[0].perm = [permissions.god];
                        that.perm[0].admin = permissions.god;
                        that.org = 'God';
                        that.children = []; // all are god's children :O

                        // email god's password, do not store on server! :O
                        heartbeat.notifyServerPassword(hash, null);
                        console.log(hash);
                        fn(null, that);
                    } else {
                        // for all other users find the parent from the requestor
                        granter.children.push(that.uid);
                        that.perm[0].perm = [permissions.none];
                        that.perm[0].admin = permissions.none;
                        that.children = [];
                        that.teams = [];
                        that.org = granter.org;
                        fn(null, that);
                    }
                } else fn('User name is taken or missing parameters', null);
            });
        } else fn('Granter does not have permission to add user', null);
//    }
//    else fn('Request format is wrong');
};

// delete a user
UserSchema.methods.deleteUser = function(granter, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        // see if granter is higher up than the user
        permissions.hasGreaterPermission(granter, that, function(err) {
            // either granter is user's baap or the user himself!
            if (!err || granter.uid === that.uid) {
                // find and remove from the DB
                User.findOne({ uuid: that.uuid }).remove(function(err, u) {
                    // todo: after a user is deleted, his parent owns everything
                    if (!err) fn(null, u);
                    else fn('Could not find and delete user', null);
                });
            } else fn('Granter does not have permission to delete', null);
        });
    }
    else fn('Request format is wrong');
};

// grant permissions to a user
UserSchema.methods.grantUser = function(granter, kingdom, perm, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        findKingdomByUrl(kingdom, function(err, k) {
            if (!err && k) {
                // see if granter is higher up than the user
                permissions.hasGreaterPermission(granter, that, function(err) {
                    if (!err) {
                        that.perm[0].grant(granter, that, k, perm, function(err, u) {
                            if (!err) fn(null, u);
                            else fn(err, null);
                        });
                    } else fn('Granter does not have permission to grant', null);
                });
            }
            else fn(err);
        });
    }
    else fn('Request format is wrong');
};

// revoke permissions from a user
UserSchema.methods.revokeUser = function(granter, kingdomName, perm, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        // see if granter is higher up than the user
        exports.findKingdomByUrl(kingdomName, function(err, k) {
            if (!err && k) {
                // see if granter is higher up than the user
                permissions.hasGreaterPermission(granter, that, function(err) {
                    if (!err) {
                        that.perm[0].revoke(granter, that, k, perm, function(err, u) {
                            if (!err) fn(null, u);
                            else fn(err, null);
                        });
                    } else fn('Granter does not have permission to revoke', null);
                });
            }
            else fn(err);
        });
    }
    else fn('Request format is wrong');
};

// promote a user's admin permission
UserSchema.methods.promoteUser = function(granter, perm, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        that.perm[0].promote(granter, that, perm, function(err, u) {
            if (err) fn('Could not promote');
            else fn(null, u);
        });
    }
    else fn('Request format is wrong');
};

// reassociate a user to a different parent
UserSchema.methods.reassocUser = function(granter, newParent, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(newParent, userValidationSchema)) {

        var that = this;

        // see if granter has permission to change user's parent
        permissions.hasGreaterPermission(granter, that, function(err) {
            if (!err) {
                permissions.hasGreaterPermission(granter, newParent, function(err) {
                    if (!err) {
                        User.findOne({ "children": that.uid }, function(err, prevParent) {
                            var ctr = 0;
                            if (!err && prevParent) {
                                prevParent.children.forEach(function(c) {
                                    if (c.uid == that.uid) prevParent.children.remove(ctr);
                                    ctr++;
                                });
                                prevParent.save(function(){ console.log('could not save'); });
                            }
                            else console.log("Previous parent not found?!");
                        });
                        newParent.children.push(that.uid);
                        newParent.save(function(err){ if (err) console.log('could not save'); });
                        fn(null, that);
                    } else fn('New parent is not qualified', null);
                });
            } else fn('Granter does not have permission to re-associate', null);
        });
    }
    else fn('Request format is wrong');
};

// update a user's profile data
UserSchema.methods.updateProfile = function(granter, data, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        // todo
        fn(null, user);
    }
    else fn('Request format is wrong');
};

// change password
UserSchema.methods.passwd = function(granter, passwd, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        // now this is a tricky one! - todo: does the user's manager have control?
        permissions.hasGreaterPermission(granter, that, function(err) {
            if (!err || granter.uid === that.uid) {
                that.perm[0].changePasswd(grnter, passwd);
                fn(null, that);
            } else fn('Granter does not have permission to change password', null);
        });
    }
    else fn('Request format is wrong');
};

// add an user to a team
UserSchema.methods.addUserToTeam = function(granter, team, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

//        permissions.hasGreaterPermission(granter, that, function(err) {
//            if (!err) {
        console.log(team)
                that.teams.push(team);
                that.save(function(err, user) {
                    if (!err && user) fn(null, user);
                    else fn('Could not save', null);
                });
//            }
//            else fn('Granter does not have sufficient permission', null);
//        });
    }
    else fn('Request format is wrong');
};

// remove an user from a team
UserSchema.methods.removeUserFromTeam = function(granter, teamName, fn) {
    if (validate(granter, userValidationSchema)) {

        var that = this;

        permissions.hasGreaterPermission(granter, user, function(err) {
            if (!err) {
                that.teams.forEach(function(tname) {
                    if (tname === team.name) that.users.remove(ctr);
                    ctr++;
                });
            }
            else fn('Granter does not have sufficient permission', null);
        });
    }
    else fn('Request format is wrong');
};

// register the model globally
var User = mongoose.model("UserSchema", UserSchema);
User.ensureIndexes(function(err){ if (err) console.log('ensureIndexes failed')});

////////////////////////////////
//   Kingdoms
////////////////////////////////

var KingdomSchema = new Schema({
    name:       String,
    perm:       [mordor.KingdomPermissionSchema],
    pkg:        []
});

// static local array for storing all kingdoms
var Kingdoms = [];

KingdomSchema.methods.addUser = function(pkg, shift, fn) {
    var id = uuid.v4();
    var kps = mongoose.model('KingdomPermissionSchema',
        mordor.KingdomPermissionSchema);

    var kingdom = new Kingdom({name: id,
        perm: new kps({uuid: id, permEntry: shift})});
    kingdom.pkg.push(pkg);

    // bow down before god the moment this is created!
    GOD.perm[0].perm[shift] = permissions.god;
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

findKingdomByUrl = function(name, fn) {
    var ret = false;
    if (name && fn)
        Kingdoms.forEach(function(k) {
            if (k.pkg[0].name == name) {
                ret = true;
                fn(null, k);
            }
        });

    if (!ret) {
        log('info', 'Could not find kingdom ' + name);
        fn('Could not find kingdom', null);
    }
};
exports.findKingdomByUrl = findKingdomByUrl;

// register the model globally
var Kingdom = mongoose.model("KingdomSchema", KingdomSchema);
exports.Kingdom = Kingdom;


////////////////////////////////
//   JSON Request Servers
////////////////////////////////

var addOrgUser = function(granter, name, orgName, pass, kingdoms, fn) {
    var newOrgUser = new User({});
    newOrgUser.createUser(granter, name, pass, function(err, org) {
        if (!err && org) {
            // assign it an org
            org.org = orgName;
            // assign it org admin permission
            org.promoteUser(granter, permissions.org, function(err, orgp) {
                if (!err && orgp) {
                    // assign it org permission for every subscribed kingdom
                    kingdoms.forEach(function(k) {
                        orgp.grantUser(granter, k, permissions.org, function(err) {
                            if (err) fn(err);
                            else {
                                orgp.save(function(err, orgs) {
                                    if (!err) fn(null, orgs);
                                    else fn('Could not save user');
                                });
                            }
                        });
                    });
                }
                else fn(err);
            });
        }
        else fn(err);
    });
};
exports.addOrgUser = addOrgUser;

var addtoTeam = function(user, teamName, fn) {
    user.addUserToTeam(user, teamName, fn);
};
exports.addtoTeam = addtoTeam;

var removeFromTeam = function(user, teamName, fn) {
    user.removeUserFromTeam(suer, teamName, fn);
};
exports.removeFromTeam = removeFromTeam;


/**
 * json body structure:
 * Input:
 * {
 *  username: String,
 *  password: String
 * }
 *
 * Output:
 * {
 *  uid : String
 * }
 *
 */
createUser = function(granter, json, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(json, addUserValidationSchema)) {

        var u = new User({});

        u.createUser(granter, json.username, json.password, function(err, u) {
            if (err || !u) fn(false, err);
            else
                u.save(function(err, u) {
                    if (!err && u) fn(true, { uid: u.uid });
                    else fn(false, err);
                });
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.addUser = createUser;


/**
 * json body structure:
 * Input:
 * {
 *  username: String
 * }
 *
 * Output:
 * {
 *  uid : String
 * }
 *
 */
deleteUser = function(granter, json, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(json, deleteUserValidationSchema)) {

        findByUsername(json.username, function(err, u) {
            if (!err && u) u.deleteUser(granter,
                function(err) {
                    if (err) fn(false, err);
                    else fn(true, { uid: json.username });
                });
            else fn(false, 'No such user exists');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.deleteUser = deleteUser;

var getPermission = function(perm) {
    var p = permissions.none;
    switch(perm) {
        case 'access':
            p = permissions.access;
            break;
        case 'modify':
            p = permissions.modify;
            break;
        case 'mgr':
            p = permissions.mgr;
            break;
        case 'admin':
            p = permissions.admin;
            break;
        case 'org':
            p = permissions.org;
            break;
        default:
            p = null;
            break;
    }
    return p;
};

/**
 * json body structure:
 * Input:
 * {
 *  username: String,
 *  permission: String
 * }
 *
 * Output:
 * {
 *  uid : String,
 *  permission: String
 * }
 *
 */
promote = function(granter, json, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(json, promoteUserValidationSchema)) {

        findByUsername(json.username, function(err, u) {
            var perm = getPermission(json.permission);

            if (!err && u && perm) {
                u.promoteUser(granter, perm, function(err, pu) {
                    if (err || !pu) fn(false, err);
                    else {
                        pu.save(function(err) {
                            if (!err) fn(true,
                                { uid: pu.uid, permission: pu.perm[0].admin });
                            else fn(false, 'could not promote');
                        });
                    }
                });
            }
            else fn(false, 'could not find user');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.promote = promote;


/**
 * json body structure:
 * Input:
 * {
 *  username: String,
 *  permission: String,
 *  kingdom: String
 * }
 *
 * Output:
 * {
 *  uid : String
 * }
 *
 */
grant = function(granter, json, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(json, grantUserValidationSchema)) {

        findByUsername(json.username, function(err, u) {
            var perm = getPermission(json.permission);

            if (!err && u && perm) u.grantUser(granter, json.kingdom, perm,
                function(err, pu) {
                    if (err || !pu) fn(false, err);
                    else {
                        pu.save(function(err, spu) {
                            if (!err) fn(true, { uid: spu.uid });
                            else fn(false, 'could not grant');
                        });
                    }
                });
            else fn(false, 'could not find user');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.grant = grant;

/**
 * json body structure:
 * Input:
 * {
 *  username: String,
 *  permission: String,
 *  kingdom: String
 * }
 *
 * Output:
 * {
 *  uid : String
 * }
 *
 */
revoke = function(granter, json, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(json, revokeUserValidationSchema)) {

        findByUsername(json.username, function(err, u) {
            var perm = getPermission(json.permission);

            if (!err && u && perm) u.revokeUser(granter, json.kingdom, perm,
                function(err, pu) {
                    if (err || !pu) fn(false, err);
                    else {
                        pu.save(function(err, spu) {
                            if (!err) fn(true, { uid: spu.uid });
                            else fn(false, 'could not revoke');
                        });
                    }
                });
            else fn(false, 'could not find user');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.revoke = revoke;


/**
 * json body structure:
 * Input:
 * {
 *  username: String,
 *  newParent: String
 * }
 *
 * Output:
 * {
 *  uid : String,
 *  parent: String
 * }
 *
 */
var reassociate = function(granter, json, fn) {
    if (validate(granter, userValidationSchema) &&
        validate(json, reassociateUserValidationSchema)) {

        findByUsername(json.username, function(err, u) {
            if (err || !u) fn(false, 'could not find user');
            else
                findByUsername(json.newParent, function(err, p) {
                    if (!err && p) u.reassocUser(granter, p,
                        function(err, pu) {
                            if (err || !pu)
                                fn(false, err);
                            else {
                                pu.save(function(err, spu) {
                                    if (!err) fn(true,
                                        { uid: spu.uid, parent: p.uid });
                                    else fn(false, err);
                                });
                            }
                        });
                    else fn(false, 'could not find user');
                });
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.reassociate = reassociate;

// todo: godammit do something about kingdom permissions!!!!
// an awesome way to create trees in js! :O
var userTree = function(entity) {
    this.name = entity.uid;
    this.admin = entity.perm[0].admin;
    this.kingdomPermissions = entity.perm[0].perm;
    this.children = [];

    var that = this;
    entity.children.forEach(function(c) {
        User.findOne({ uid: c }, function(err, child) {
            if (child) that.children.push( new userTree(child));
        });
    });
};

// construct a tree starting from the asker / granter
var getEntityTree = function(granter, fn) {
    if (validate(granter, userValidationSchema)) {
        var tree = new userTree(granter);
        fn(true, tree);
    }
    else fn(false, 'Request format is wrong');
};
exports.getEntityTree = getEntityTree;

// Deprecated, do not use this
var findByUuid = function(u, fn) {
    // god cannot be found by uuid! :D
    return User.findOne({ uuid: u }, fn);
};
exports.findByUuid = findByUuid;

var findByUsername = function(u, fn) {
    if (u === 'god') return fn(null, GOD);
    else return User.findOne({ uid: u }, fn);
};
exports.findByUsername = findByUsername;

var entityConstructor = function() {
    var newuser = new User({});
    log('info', 'Creating god!');
    // uuid.v4()
    newuser.createUser(null, 'god', '123', function(err, u) {
        if (err) throw err;
        if (!u) throw 'User object returned is null';
        if (u) GOD = u;
    });
};
exports.entity = entityConstructor;

