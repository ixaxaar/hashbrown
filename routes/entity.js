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

// db
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

/**
 * User Management structures
 */

var UserProfile = function(uuid, uid) {
    this.uuid = uuid;
    this.uid = uid;
    // compulsory fields of a user profile
    this.name = '';
    this.email = '';
    // anything can be entered here
    this.data = [];
};

exports.User = function(req, uid, hash) {
    this.uuid       =   uuid.v4();
    this.id         =   uid;
    this.profile    =   new UserProfile(this.uuid, this.uid);
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


//////////////////////////////////////////
// Database Stuff
//////////////////////////////////////////

/** Schemas */

var UserSchema = new Schema({
    uuid:       String,
    uid:        String,
    profile:    ObjectId,
    perm:       ObjectId,
    parent:     ObjectId
});
// register the model globally
mongoose.model("UserSchema", UserSchema);

/* TODO: phobi has to tell us what fields he needs here */
var UserProfileSchema = new Schema({
    uuid:       String,
    uid:        String,
    name:       String,
    email:      String,
    data:       []
});
// register the model globally
mongoose.model("UserProfileSchema", UserProfileSchema);

var KingdomSchema = new Schema({
    uuid:       String,
    perm:       ObjectId,
    package:    ObjectId
});
// register the model globally
mongoose.model("KingdomSchema", KingdomSchema);


/** Schema methods */

var GOD = null;

// add an user
UserSchema.method.add = function(granter, uid, hash, fn) {
    if (uid && hash) {
        this.uuid       =   uuid.v4();
        this.uid        =   uid;
        this.profile    =   new UserProfileSchema(this.uuid, this.uid);
        this.perm       =   new mordor.UserPermissionSchema(this.uuid, hash);
    } else { fn(true, null); }

    // see if god does not exist already
    if ((uid === 'god') && (!GOD)) {
        // some special stuff, it's god after all!
        this.perm.perm = [mordor.Permission.god];
        this.parent = null;

        // email god's password, do not store on server! :O
        heartbeat.notifyServerPassword(hash, null);
        console.log(hash);
        fn(true, this);
    } else if (req) {
        // for all other users find the parent from the requestor
        this.parent = UserSchema.find({uid: granter.uuid}, function(err, parent) {
            // check if the granter has permission to add a user (at least mgr)
            if (!err && user &&
                (parent.perm.admin >= mordor.Permission.mgr))
                return parent;
        });

        // commit this into the DB, god does not go here
        this.save(function(err, user) {
            if (!err) fn(null, user);
            else fn(true, null);
        });
    } else { fn(true, null); }

    fn(true, null);
};

// todo: move this shit to odnswim!
// delete a user
UserSchema.method.delete = function(granter, user, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            UserSchema.find({uid: user.uuid}).remove(function(err, u) {
                if (!err) fn(null, u);
                else fn(true, null);
            });
        } else fn(true, null);
    });

    fn(true, u);
};

//UserSchema.method.delete = function(granter, user, fn) {
//    // see if the granter is higher up in the ladder than the user
//    if (user && (granter.perm.admin >= user.perm.admin)) {
//        // find and delete
//        UserSchema.find({uid: user.uuid}).remove(function(err, u) {
//            if (!err) fn(null, u);
//            else fn(true, null);
//        });
//    }
//
//    fn(true, u);
//};

// grant permissions to a user
UserSchema.method.grant = function(granter, user, kingdom, perm, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        user.perm.grant(granter, user, kingdom, perm, function(err, u) {
            if (!err) fn(null, u);
            else fn(true, null);
        });
    });

    fn(true, null);
};

//UserSchema.method.grant = function(granter, user, kingdom, perm, fn) {
//    // see if granter is higher up than the user
//    if (user && (granter.perm.admin >= user.perm.admin)) {
//        // see if granter has permission to grant permission w.r.t. a kingdom
//        if (mordor.Permission.hasPermission(granter, kingdom, mordor.Permission.mgr)) {
//            user.perm.grant(granter, user, kingdom, perm, function(err, u) {
//                if (!err) fn(null, u);
//                else fn(true, null);
//            });
//        }
//    }
//
//    fn(true, null);
//};
