/**
 * Created with JetBrains WebStorm.
 * this.User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

var mordor = require('./ODNSWIM');
var uuid = require('node-uuid');
var heartbeat = require('./heartbeat');


/**
 * User Management structures
 */

var UserProfile = function(uuid) {
    this.uuid = uuid;
    // compulsory fields of a user profile
    this.name = '';
    this.email = '';
    // anything can be entered here
    this.data = [];
};

exports.User = function(req, uid, hash) {
    // print god's password
    if (!req) heartbeat.notifyServerPassword(hash, null);

    this.uuid       =   uuid.v4();
    this.id         =   uid;
    this.profile    =   new UserProfile(this.uuid);
    this.perm       =   new mordor.UserPermission(this.uuid, hash);
    if (req) this.findByUuid(req.user.uuid, function(err, u) {
            if (!err) this.parent = u;
        }); // for admins, this has to be the organization
}

/**
 *  User Management methods
 */

// All the users
// for god, his password is different for different server instances
// god's password can only be seen as console log
var Users = [new this.User(null, 'god', uuid.v4())];

this.User.prototype.add = function(uid, hash, parent, fn) {
    if (uid && hash && parent)
        Users.append(new this.User(uid, hash, parent));
    else fn("Could not add user");
};

// delete user
this.User.prototype.delete = function(granter, user, fn) {
    if (user && granter) {
        if (mordor.Permission.admin <= granter.perm) {
            var ctr = 0;
            for (var u in Users) {
                if(user == u) break;
                ctr++;
            }
            Users.remove(ctr);
            fn(null)
        }
    } else fn("arguments are not correct");
};

// grant user some permission w.r.t a module
this.User.prototype.grant = function(granter, user, kingdom, perm) {
    if (user && granter && kingdom && perm)
    //check if granter has permission to grant
        if (mordor.Permission.hasPermission(granter, kingdom,
            mordor.Permission.admin)) {
            user.UserPermission.granter(granter, user, perm);
        }
};

// associate user with different parent
//this.User.prototype.reassoc
//
//// update a user's profile data
//this.User.prototype.updateProfile
//
//// update a user's password
//this.User.prototype.passwd

/**
 * The User Management helpers
 */

exports.findByUuid = function(uuid, fn) {
    var ret = false;
    Users.forEach(function (u) {
        if (u.uuid == uuid) {
            fn(null, u);
            ret = true;
        }
    });
    if (!ret) fn(null, null);
};

exports.findByUsername = function(uid, fn) {
    var ret = false;
    Users.forEach(function (u) {
        if (u.id == uid) {
            fn(null, u);
            ret = true;
        }
    });
    if (!ret) fn(null, null);
};


