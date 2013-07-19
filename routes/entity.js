/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

var mordor = require('./ODNSWIM');
var uuid = require('node-uuid');

var UserProfile = function(uuid) {
    this.uuid = uuid;
    // compulsory fields of a user profile
    this.name = '';
    this.email = '';
    // anything can be entered here
    this.data = [];
};

var User = function(parent, uid, hash) {
    // print god's password
    if (!parent) console.log(hash);

    this.uuid       =   uuid.v4();
    this.id         =   uid;
    this.profile    =   new UserProfile(this.uuid);
    this.perm       =   new mordor.UserPermission(this.uuid, hash);
    this.parent     =   parent; // for admins, this has to be the organization
}


// All the users
// for god, his password is different for different server instances
// god's password can only be seen as console log
var Users = [new User(null, 'god', uuid.v4())];

exports.add = function(uid, hash, parent, errfn) {
    if (uid && hash && parent)
        Users.append(new User(uid, hash, parent));
    else errfn("Could not add user");
}

// delete user
exports.delete = function(uuid) {

};

// grant user some permission w.r.t a module
exports.grant

// associate user with different parent
exports.reassoc

// update a user's profile data
exports.updateProfile

// update a user's password
exports.passwd



exports.findByUuid = function(uuid, fn) {
    var ret = false;
    Users.forEach(function (u) {
        if (u.uuid == uuid) {
            fn(null, u);
            ret = true;
        }
    });
    if (!ret) fn(new Error(uuid + ' id does not exist'));
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


