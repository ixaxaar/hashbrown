/**
 * User: Russi
 * Date: 14/7/13
 * Time: 9:31 PM
 */

/* ONE DOES NOT SIMPLY WALK INTO MORDOR */

var crypto = require("crypto")
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

/** How ODNSWIM works:
 *  1. Login page generates aes hash of password, sends to server
 *  2. ODNSWIM generates a hash key of the hash and stores in DB
 */

/**
 * User's password hash structure
 */

function password(uuid, hash){
    this.user      =   uuid;
    this.key       =   _generateKeyToMordor(hash);
}

/**
 * Prmission verification functions
 */

_userPermission = function(granterPerm, resourcePerm) {

}

/**
 * User's permissions structure
 */

var userPermission = function userPermission(uuid){
    this.user              =   uuid;
    this.perm              =   0;
}

userPermission.prototype = {};
userPermission.prototype.permissionGranter = function(granter, kingdom) {
    var ret = false;
    if (_userPermission(granter.permissions.perm, this.perm) == CADMIN) {
        ret =  _addPerm(this.perm, kingdom);
    }
    return ret;
}

/**
 * Kingdom's permissions structure
 */

var kingdomPermission = function kingdomPermission(name){
        this.kingdom           =   name,
        this.perm              =   0
}

kingdomPermission.prototype = {};
kingdomPermission.prototype.permissionGranter = function(granter, user) {
    var ret = false;
    if (_userPermission(granter.permissions.perm, this.perm) == CADMIN) {
        ret =  _addPerm(this.perm, user);
    }
    return ret;
}

_grantPermission = function(granter, user, kingdom) {
    return (kingdom.grantPermission(granter, user)) ?
        user.grantPermission(granter, kingdom) : false;
}

_verifyPermission = function(user, resource) {
    var ret = false;
    //check if the user has permission to the resource's kingdom first
    if (resource.kingdom.hasAccess(user)) {
        if ()
    }
}

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
    res.redirect('/login')
}

/* Generate the key of received hash
 */
var _generateKeyToMordor = function(hash) {
    var salt = crypto.randomBytes(256);
    return key = salt + crypto.createCipher("aes192", hash);
}

