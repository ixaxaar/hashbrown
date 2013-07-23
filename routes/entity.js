/**
 * Created with JetBrains WebStorm.
 * this.User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

var mordor = require('./ODNSWIM');
var uuid = require('node-uuid');

// db
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;


/**
 * User Management structures
 */

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

/**
 * Kingdom Management structures
 */

var KingdomSchema = new Schema({
    uuid:       String,
    perm:       ObjectId,
    package:    ObjectId
});
// register the model globally
mongoose.model("KingdomSchema", KingdomSchema);


/** User Schema methods */

var GOD = null;

// add an user
UserSchema.method.add = function(granter, uid, hash, fn) {
    if (uid && hash) {
        this.uuid       =   uuid.v4();
        this.uid        =   uid;
        this.profile    =   new UserProfileSchema(this.uuid, this.uid);
        this.perm       =   new mordor.UserPermissionSchema(this.uuid, hash);
    } else { fn('Invalid parameters', null); }

    // see if god does not exist already
    if ((uid === 'god') && (!GOD)) {
        // some special stuff, it's god after all!
        this.perm.perm = [mordor.Permission.god];
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

        // commit this into the DB, god does not go here
        this.save(function(err, user) {
            if (!err) fn(null, user);
            else fn('Could not save new user', null);
        });
    } else { fn(true, null); }
};

// delete a user
UserSchema.method.delete = function(granter, user, fn) {
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
UserSchema.method.grant = function(granter, user, kingdom, perm, fn) {
    // see if granter is higher up than the user
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.grant(granter, user, kingdom, perm, function(err, u) {
                if (!err) fn(null, u);
                else fn('Granter cannot grant', null);
            });
        } else fn('Granter does not have permission to grant', null);
    });
};

// reassociate a user to a different parent
UserSchema.method.reassoc = function(granter, newParent, user, fn) {
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
UserSchema.method.updateProfile = function(granter, user, data, fn) {
    // todo
    fn(null, user);
};

UserSchema.method.passwd = function(granter, user, passwd, fn) {
    // now this is a tricky one! - todo: does the user's manager has control?
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.changePasswd(grnter, passwd);
            fn(null, user);
        } else fn('Granter does not have permission to change password', null);
    });
};

// update a user's admin status
UserSchema.method.admin = function(granter, user, perm, fn) {
    mordor.Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            user.perm.updateAdmin(granter, perm);
            fn(false, user);
        } else fn('Granter does not have permission to update admin', null);
    });
};

/**
 * The User Management helpers
 */

exports.findByUuid = function(u, fn) {
    UserSchema.find({ uuid: u }, fn);
};

exports.findByUsername = function(u, fn) {
    UserSchema.find({ uid: u }, fn);
};

/**
 * The Kingdom Management functions
 */

KingdomSchema.method.add = function(pkg, shift, fn) {
    var kingdom =
        new KingdomSchema(uuid.v(),
                        new KingdomPermSchema(shift),
                        pkg);

    // bow down before god the moment this is created!
    if (GOD) GOD.grant(GOD, GOD, kingdom, mordor.Permission.god, function(err, god) {
        if (err) {
            fn('WTF! God was denied permission', null);
            throw 'OMG WTF!';
        } else {
            fn(null, kingdom);
        }
    });

};

KingdomSchema.method.remove = function(kngdom, fn) {
    // nothing to do here? lol
};
