/**
 * User: Russi
 * Date: 14/7/13
 * Time: 9:31 PM
 */

/* ONE DOES NOT SIMPLY WALK INTO MORDOR */

var crypto = require("crypto");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var backend = require('backend');
var _ = require('underscore');

/** How ODNSWIM works:
 *  1. Login page generates aes hash of password, sends to server
 *  2. ODNSWIM generates a hash key of the hash and stores in DB
 */

/**
 * Permission levels and operations
 * Actions <-> permissions have direct mapping
 */

exports.Permission = {
    'root'  :   15,
    'org'   :   5,
    'admin' :   4,
    'mgr'   :   3,
    'modify':   2,
    'access':   1,
    'none'  :   0,
    'hasPermission'         :   _hasPermission,
    'calcMaxPermission'     :   _calcMaxPermission
};

_hasPermission = function(entity, kingdom, perm) {
    for (var p in Permission) {
        if (p == 0) return false;
        if (entity.perm[kingdom.permEntry] >= perm) return true;
    }
};

// a user's parent is his org
// an org's parent is itself
// every kingdom has to have a different permEntry!
_calcMaxPermission = function(entity, kingdom) {
    for (var p in Permission) {
        if (Perm[p] == 0) return 0;
        if ((entity.perm[kingdom.permEntry] & Perm[p]) &&
            (entity.parent.perm >= entity.perm[kingdom.permEntry])) return Perm[p];
    }
};

/* Generate the key of received hash
 */
function _generateKeyToMordor(hash) {
    var salt = crypto.randomBytes(256);
    return salt + crypto.createCipher("aes192", hash);
}

/**
 * User's password hash structure
 */

function password(uuid, hash){
    this.user      =   uuid;
    this.key       =   _generateKeyToMordor(hash);
}

/**
 * Permission verification functions
 */

_permission = function(granter, resource) {
    return ((granter.perm & resource.perm_mask) >> resource.perm_shift);
};

/**
 * User's permissions structure
 */

exports.UserPermission = function (uuid, hash){
    this.user              =   uuid;
    this.perm              =   0;
    this.password          =   new password(this.uuid, hash);
};

UserPermission.prototype = {};

// update the user's permission with respect to a module
UserPermission.prototype.granter = function(granter, user, permission) {
    var ret = false;

    // granter has admin rights for the module
    if (Permission.hasPermission(granter, kingdom, Permission['admin'])) {
        // granter is asking to give permission within his rights
        if (permission <= granter.perm[kingdom.permEntry])
            user.perm[kingdom.permEntry] = permission;
    }
    return ret;
};

/**
 * Kingdom's permissions structure
 */

exports.KingdomPermission = function (uuid){
    this.kingdom           =   uuid;
    this.permEntry         =   backend.realm.kingdoms.length();
};

KingdomPermission.prototype = {};

/**
 * Permission evaluation functions
 */

// evaluate permissions for users
exports.evalAccessPermission = function(reqUrl, user) {
    var mod = backend.realm.getKingdoms(app);
    var url = (reqUrl.split('/'))[0];

    mod.forEach(function(m) {
        if (m == url) {
            mod = m;
            break;
        }
    });

    // for accessing modules, an ACCESS permission is sufficient
    // however, for other creating content, a CREATE permission is reqd.
    // that will obviously be handled while creating content by the content mgr.
    return Permission.hasPermission(user, mod, Permission.access);
};

// only manager or admin can enter the control panel for e.g.
exports.evalAdminPermission = function(reqUrl, user) {
    var mod = backend.realm.getKingdoms(app);
    var url = (reqUrl.split('/'))[0];

    mod.forEach(function(m) {
        if (m == url) {
            mod = m;
            break;
        }
    });

    return (Permission.hasPermission(user, mod, Permission.mgr) ||
        Permission.hasPermission(user, mod, Permission.admin));
};

/**
 * Construct the gates of MORDOR!
 */
module.exports = InstallBlackGate;

function InstallBlackGate(app){
    app.use(passport.initialize());
    app.use(passport.session());
}

exports.createTheBlackGates = function() {
    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        _findUserById(id, function (err, user) {
            done(err, user);
        });
    });

    // Use the LocalStrategy within Passport.
    //   Strategies in passport require a `verify` function, which accept
    //   credentials (in this case, a username and password), and invoke a callback
    //   with a user object.  In the real world, this would query a database;
    //   however, in this example we are using a baked-in set of users.
    passport.use(new LocalStrategy(
        function(username, password, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {

                // Find the user by username.  If there is no user with the given
                // username, or the password is not correct, set the user to `false` to
                // indicate failure and set a flash message.  Otherwise, return the
                // authenticated `user`.
                findByUsername(username, function(err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false,
                        {message: 'Unknown user ' + username }); }
                    if (user.password != _generateKeyToMordor(password)) {
                        return done(null, false, {message: 'Invalid password'});
                    }
                    return done(null, user);
                })
            });
        }
    ));
}


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
exports.openGatesOfMordor = function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
}


