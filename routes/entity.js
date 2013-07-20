/**
 * Created with JetBrains WebStorm.
 * this.User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

var mordor = require('./ODNSWIM');
var uuid = require('node-uuid');
var heartbeat = require('./heartbeat');

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

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
    this.uuid       =   uuid.v4();
    this.id         =   uid;
    this.profile    =   new UserProfile(this.uuid);
    this.perm       =   new mordor.UserPermission(this.uuid, hash);
    if (req) this.findByUuid(req.user.uuid, function(err, u) {
            if (!err) this.parent = u;
        }); // for admins, this has to be the organization

    if (uid === 'god') {
        // some special stuff, it's god after all!
        this.perm.perm = [mordor.Permission.god];
        this.parent = null;

        // email god's password, do not store on server! :O
        heartbeat.notifyServerPassword(hash, null);
        console.log(hash);
    }
};

/**
 *  User Management methods
 */

// All the users
// for god, his password is different for different server instances
// god's password can only be seen as console log
var Users = [];

// add god
exports.init = function() {
    this.add('god', uuid.v4(), null, function(err) {
        if (err) console.log("Could not create god!: %s", err);
    });
}

exports.add = function(uid, hash, parent, fn) {
    if (uid && hash){
        Users.push(new this.User(null, uid, hash));
        if (fn) fn(null);
    }
    else if (fn) fn("Could not add user");
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
            if (fn) fn(null)
        }
    } else if (fn) fn("arguments are not correct");
};

// grant user some permission w.r.t a module
this.User.prototype.grant = function(granter, user, kingdom, perm) {
    if (user && granter && kingdom && perm)
    //check if granter has permission to grant
        if (mordor.Permission.hasPermission(granter, kingdom,
            mordor.Permission.admin)) {
            console.log("granted");
            user.UserPermission.granter(granter, user, perm);
        }
    console.log("not granted");
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



/**
 * Kingdom Management structures
 */
exports.Kingdom = function(pkg, shift) {
    this.uuid = uuid.v4();
    this.perm = new mordor.KingdomPermission(this.uuid, shift);
    this.package = pkg;

    // god is granted permissions to all kingdoms the moment they are created
    // though this algo seems a tad idiotic, it is necessary to guard
    // against random shift values
    for (var ctr = 0; ctr <= shift; ctr++) {
        if (!Users[0].perm.perm[ctr])
            Users[0].perm.perm[ctr] = mordor.Permission.god;
    }
};

