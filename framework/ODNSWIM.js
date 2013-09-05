/**
 * User: Russi
 * Date: 14/7/13
 * Time: 9:31 PM
 */

/* ONE DOES NOT SIMPLY WALK INTO MORDOR */

// External Dependencies
var crypto = require("crypto");
var LocalStrategy = require('passport-local').Strategy;

// db
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

// Internal Dependencies
var entity = require('./entity');

// json schema validation - for request jsons
var validation = require('./validation')
    , v = validation.validator
    , userValidationSchema = validation.userValidationSchema;


/** How ODNSWIM works:
 *  1. Login page generates aes hash of password, sends to server
 *  2. ODNSWIM generates a hash key of the hash and stores in DB
 */

/**
 * Permission levels and operations
 * Actions <-> permissions have direct mapping
 */

var _hasPermission = function(entity, kingdom, perm) {
    return (entity.perm[0].perm[kingdom.perm[0].permEntry] >= perm);
};

var _hasAdminPermission = function(entity, perm) {
    return (entity.perm[0].admin > perm);
};

// every kingdom has to have a different permEntry!
var _calcMaxPermission = function(entity, kingdom, fn) {
    if (entity.perm[0].perm[kingdom.perm[0].permEntry]) {
        fn(null, entity.perm[0].perm[kingdom.perm[0].permEntry]);
    } else fn('entity does not have any permissions for kingdom.', null);
};

var _hasGreaterPermission = function(granter, user, fn) {
    if (granter.org === user.org) {
        if ((granter.perm[0].admin > user.perm[0].admin) ||
            ((granter.perm[0].admin & user.perm[0].admin) == Permission.god)) {
            fn(null);
        } else fn('Granter has lesser permission than user');
    }
    else if (granter.uid === 'god') fn(null);
    else {
        log('warning', 'someone tried to access other organizations user');
        fn('you stop right there buddy');
    }
};

var Permission = {
    'god'   :   1 << 15,
    'org'   :   1 << 5,
    'admin' :   1 << 4,
    'mgr'   :   1 << 3,
    'modify':   1 << 2,
    'access':   1 << 1,
    'none'  :   1 << 0,
    'hasPermission'         :   _hasPermission,
    'hasAdminPermission'    :   _hasAdminPermission,
    'calcMaxPermission'     :   _calcMaxPermission,
    'hasGreaterPermission'  :   _hasGreaterPermission
};
exports.Permission = Permission;

/* Generate the key of received hash
 */

//todo: this is not fit for shared multiple instances, fetch from DB
var salt = '';//crypto.randomBytes(256);

function _generateKeyToMordor(hash) {
    return salt + crypto.createHash("md5").update(hash).digest("hex");
}

////////////////////////////////////
//      Schemas
////////////////////////////////////

/**
 * User's password hash structure
 */

var PasswordSchema = Schema({
    hash:       String
});

PasswordSchema.methods.Change = function(newhash) {
    this.hash = _generateKeyToMordor(newhash);
};

// register the model globally
var PasswordS = mongoose.model("PasswordSchema", PasswordSchema);
exports.Password = PasswordS;

/**
 * User's permissions structure
 */

UserPermissionSchema = Schema({
    perm:       [Number],
    admin:      Number,
    password:   [PasswordSchema]
});

////////////////////////////////////
//      Methods
////////////////////////////////////

// function having the sole authority to grant user's permissions
UserPermissionSchema.methods.grant = function(granter, user, kingdom, perm, fn) {
    Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            // check if granter is trying to grant permission at most
            // one level below his own
            if (Permission.hasPermission(granter, kingdom, perm << 1)) {
                if ((!user.perm[0].perm[kingdom.perm[0].permEntry]) ||
                    (user.perm[0].perm[kingdom.perm[0].permEntry] < perm)) {
                    // do some gymnastics
                    var ctr = 0;
                    while(ctr <= kingdom.perm[0].permEntry) {
                        if (user.perm[0].perm[ctr] == null)
                            user.perm[0].perm.push(0);
                        ctr++;
                    }

                    user.perm[0].perm[kingdom.perm[0].permEntry] = perm;
                    // note: direct access to mongoose arrays need to be
                    // explicitly marked as modified, else mongo will not save
                    user.perm[0].markModified('perm');
                    fn(null, user);
                } else {
                    fn('Permission is already granted', null);
                }
            } else {
                fn("Does not have authority over module to grant permission.", null);
            }
        } else fn("Does not have authority over user to grant permission.", null);
    });
};

UserPermissionSchema.methods.getPermission = function(granter, user, kingdom, fn) {
    Permission.hasGreaterPermission(granter, user, function(err) {
        // this functionality is available to the granter as well as the user
        if (!err || granter.uid === user.uid) {
            return user.perm[0].perm[kingdom.perm[0].permEntry] = perm;
        } else fn("Does not have authority see permission.", null);
    });
};

// function having the sole authority to revoke user's permissions
UserPermissionSchema.methods.revoke = function(granter, user, kingdom, perm, fn) {
    Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            // check if granter is trying to grant permission at most
            // one level below his own
            if (Permission.hasPermission(granter, kingdom,
                user.perm[0].perm[kingdom.perm[0].permEntry] << 1)) {
                // modify the permission if the permission does not exist or
                if (user.perm[0].perm[kingdom.perm[0].permEntry] > perm) {
                    // do some gymnastics
                    console.log(user.perm[0].perm[kingdom.perm[0].permEntry])
                    console.log(perm)
                    var ctr = 0;
                    while(ctr <= kingdom.perm[0].permEntry) {
                        if (user.perm[0].perm[ctr] == null)
                            user.perm[0].perm.push(0);
                        ctr++;
                    }

                    user.perm[0].perm[kingdom.perm[0].permEntry] = perm;
                    // note: direct access to mongoose arrays need to be
                    // explicitly marked as modified, else mongo will not save
                    user.perm[0].markModified('perm');
                    fn(null, user);
                } else {
                    fn('Permission is already revoked', null);
                }
            } else {
                fn("Does not have authority over module to grant permission.", null);
            }
        } else fn("Does not have authority over user to grant permission.", null);
    });
};

// promote or demote a user's admin rights
UserPermissionSchema.methods.promote = function(granter, user, perm, fn) {
    Permission.hasGreaterPermission(granter, user, function(err) {
        if (!err) {
            if (Permission.hasAdminPermission(granter, perm)) {
                user.perm[0].admin = perm;
                fn(null, user);
            }
            else fn('Granter does not have sufficient admin permissions');
        } else fn('Granter has lesser permission than user', null);
    });
};

var UserPermission = mongoose.model("UserPermissionSchema", UserPermissionSchema);
exports.UserPermissionSchema = UserPermissionSchema;
exports.UserPermission = UserPermission;

/**
 * Kingdom's permissions structure
 */

KingdomPermissionSchema = Schema({
    uuid:       String,
    permEntry:  Number
});

var KingdomPermission = mongoose.model("KingdomPermissionSchema", KingdomPermissionSchema);
exports.KingdomPermissionSchema = KingdomPermissionSchema;
exports.KingdomPermission = KingdomPermission;

/**
 * Construct the gates of MORDOR!
 */
var BlackGate = function(app, express, passport) {
    app.use(express.cookieParser('ahdbahsdavdjhbfhk'));
    var RedisStore = require('connect-redis')(express);
    app.use(express.session({
        secret: "kqsdjfmlksdhfhzirzeoibrzecrbzuzefcuercazeafxzeokwdfzeijfxcerig",
        store: new RedisStore({ host: 'localhost' })
    }));
    app.use(passport.initialize());
    app.use(passport.session());
};
exports.BlackGate = BlackGate;


var serializer = function(user, done) {
    log('debug', user.uid + ' serialized');
    done(null, user.uid);
};

var deserializer = function(id, done) {
    entity.findByUsername(id, function(err, u) {
        if (u) log('debug', u.uid + ' deserialized');
        if (err) log('crit', err);
        done(err, u);
    });
};

exports.createTheBlackGates = function(passport) {
    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.
    passport.serializeUser(serializer);

    passport.deserializeUser(deserializer);

    // Use the LocalStrategy within Passport.
    //   Strategies in passport require a `verify` function, which accept
    //   credentials (in this case, a username and password), and invoke a callback
    //   with a user object.
    passport.use(new LocalStrategy(
        function(username, password, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {
                // Find the user by username.  If there is no user with the given
                // username, or the password is not correct, set the user to `false` to
                // indicate failure.  Otherwise, return the
                // authenticated `user`.
                entity.findByUsername(username, function(err, user) {
                    // failure cases
                    if (err) { return done(err); }
                    if (!user) { return done(null, false,
                        {message: 'Unknown user ' + username }); }

                    // match password
                    if (user.perm[0].password[0].hash !=
                        _generateKeyToMordor(password)) {
                        return done(null, false, {message: 'Invalid password'});
                    }
                    else {
                        log('info', user.uid + ' user auth passed');
                        return done(null, user);
                    }
                });
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
    var r = false;
    var u = req.url.split('/')[1];

    if (req.isAuthenticated()) {
        if (u != '') {
            // okay, so the user is authenticated,
            // check if user has at least access premissions
            entity.findKingdomByUrl(u, function(err, k) {
                if (!err && k) {
                    Permission.calcMaxPermission(req.user, k, function(err, p) {
                        if ((!err) && (p >= Permission.access)) r = true;
                    });
                } else r = true;
            });
        } else r = true;

        if (r) return next();
        else return res.redirect('/');
    }
    else return res.redirect('/login');
};
