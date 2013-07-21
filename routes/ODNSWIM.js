/**
 * User: Russi
 * Date: 14/7/13
 * Time: 9:31 PM
 */

/* ONE DOES NOT SIMPLY WALK INTO MORDOR */

var crypto = require("crypto");
var LocalStrategy = require('passport-local').Strategy;
var realm = require('./realm');
var _ = require('underscore');
var entity = require('./entity');

/** How ODNSWIM works:
 *  1. Login page generates aes hash of password, sends to server
 *  2. ODNSWIM generates a hash key of the hash and stores in DB
 */

/**
 * Permission levels and operations
 * Actions <-> permissions have direct mapping
 */

var _hasPermission = function(entity, kingdom, perm) {
    return (entity.perm.perm[kingdom.perm.permEntry] >= perm);
};

// a user's parent is his org
// an org's parent is itself
// every kingdom has to have a different permEntry!
var _calcMaxPermission = function(entity, kingdom) {
    for (var p in Permission) {
        if (Perm[p] == 0) return 0;
        if ((entity.perm[kingdom.perm.permEntry] & Perm[p]) &&
            (entity.parent.perm >= entity.perm[kingdom.perm.permEntry]))
            return Perm[p];
    }
};

exports.Permission = {
    'god'   :   15,
    'org'   :   5,
    'admin' :   4,
    'mgr'   :   3,
    'modify':   2,
    'access':   1,
    'none'  :   0,
    'hasPermission'         :   _hasPermission,
    'calcMaxPermission'     :   _calcMaxPermission
};

/* Generate the key of received hash
 */

//todo: this is not fit for shared multiple instances, fetch from DB
var salt = crypto.randomBytes(256);

function _generateKeyToMordor(hash) {
    return salt + crypto.createHash("md5").update(hash).digest("hex");
}

/**
 * User's password hash structure
 */

function password(uuid, hash){
    this.user      =   uuid;
    this.hash      =   _generateKeyToMordor(hash);
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
    this.password          =   new password(uuid, hash);
};

this.UserPermission.prototype = {};

// update the user's permission with respect to a module
this.UserPermission.prototype.granter =
    function(granter, user, kingdom, permission) {
    var ret = false;

    // granter has admin rights for the module
    if (Permission.hasPermission(granter, kingdom, Permission['admin'])) {
        // granter is asking to give permission within his rights
        if (permission <= granter.perm[kingdom.perm.permEntry])
            user.perm.perm[kingdom.perm.permEntry] = permission;
    }
    return ret;
};

/**
 * Kingdom's permissions structure
 */

exports.KingdomPermission = function (uuid, shift){
    this.kingdom           =   uuid;
    this.permEntry         =   shift;
};

this.KingdomPermission.prototype = {};

/**
 * Permission evaluation function
 */

// evaluate permissions for users
exports.evalPermission = function(reqUrl, user, perm) {
    var mod = realm.realm.getKingdoms(app);
    var url = (reqUrl.split('/'))[0];

    mod.forEach(function(m) {
        if (m == url) {
            mod = m;
        }
    });

    // for accessing modules, an ACCESS permission is sufficient
    // however, for other creating content, a CREATE permission is reqd.
    // that will obviously be handled while creating content by the content mgr.
    // only manager or admin can enter the control panel for e.g.
    return Permission.hasPermission(user, mod, perm);
};

/**
 * Construct the gates of MORDOR!
 */
exports.BlackGate = BlackGate;

function BlackGate(app, passport){
    app.use(passport.initialize());
    app.use(passport.session());
}

exports.createTheBlackGates = function(passport) {
    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.
    passport.serializeUser(function(user, done) {
//        entity.add(user, function(u){
            done(null, user.uuid);
//        });
    });

    passport.deserializeUser(function(id, done) {
        entity.findByUuid(id, function(err, u) {
            done(err, u);
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
                entity.findByUsername(username, function(err, user) {
                    // failure cases
                    if (err) { return done(err); }
                    if (!user) { return done(null, false,
                        {message: 'Unknown user ' + username }); }

                    // match password
                    if (user.perm.password.hash !=
                        _generateKeyToMordor(password)) {
                        return done(null, false, {message: 'Invalid password'});
                    }
                    else return done(null, user);
                })
            });
        }
    ));
};


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
exports.openBlackGate = function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
}

// check if a user's organization has access to this kingdom
// an organization's permissions can only be altered by god :O
var checkOrgPermission = function(user, kingdom) {

}

