
var goose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = Schema.ObjectId;

// the local database storing organization schemas
var settingsdb = 'mongodb://localhost/teams';
var mongoose = goose.createConnection(settingsdb);


var path = require('path');
var uuid = require('node-uuid');
var _ = require('underscore');

// json schema validation - for request jsons
var validation = require('./validation')
    , v = validation.validator
    , validate = validation.validate
    , userValidationSchema = validation.userValidationSchema
    , createTeamSchema = validation.createTeamSchema
    , addUserSchema = validation.addUserSchema
    , teamValidationSchema = validation.teamValidationSchema
    , godCreatesAnOrgSchema = validation.godCreatesAnOrgSchema
    , changeTeamOwnerValidationSchema = validation.changeTeamOwnerValidationSchema;

var entity = require('./entity');
var mordor = require('./ODNSWIM')
    , permissions = mordor.Permission;


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

////////////////////////////////
//   Connection Manager
////////////////////////////////

// stores all data of all the database connections
// todo: can we centralize this into redis?
var connectionMgr = function() {
    this.connections = {};
};

connectionMgr.prototype.getConnection = function(connectionString){
    return this.connections[connectionString];
};

connectionMgr.prototype.setConnection = function(conn, connectionString){
    return this.connections[connectionString] = conn;
};

// never do this, as mutiple entities can refer to this connection
// delete one and cause errors everywhere!
//connectionMgr.prototype.clearConnection = function(connectionString){
//    return this.connections[connectionString] = undefined;
//};

var connMgr = new connectionMgr();

// this can be called from anywhere
exports.GetConnection = connMgr.getConnection;

////////////////////////////////
//   Team Schema
////////////////////////////////

var TeamSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    owner: String,
    name: String,
    orgName: String,
    dbConnection: String,
    dbName: { type: String, default: uuid.v4() },
    users: [String],
    children: [String]
});
TeamSchema.index({ name: 1 , orgName: 1 });
TeamSchema.index({ children: 1 }); //index separately as search by children is independent

TeamSchema.virtual('connectionString')
    .get(function () {
        return (this.dbConnection + '/' + this.dbName);
    });

TeamSchema.methods.createTeam = function (conn, granter, name, dbConnection, dbName, parent, fn) {
    var that = this;
    var Team = conn.model("TeamSchema", TeamSchema);

    if (validate(granter, userValidationSchema)) {
        // see if the team already exists
        that.model("TeamSchema").findOne({ "name": name }, function(err, t) {
            if (!t) {
                var ret = null;
                name ? that.name = name : ret = 'name missing';
                granter ? that.owner = granter.uid : ret = 'user missing';
                dbConnection ? that.dbConnection = dbConnection : ret = 'dbConnection missing';
                dbName ? that.dbName = dbName : ret = 'dbName missing';
                that.orgName = granter.org;

                // add the tree references
                if (parent) {
                    if (!that.model("TeamSchema").findOne({ "name": parent },
                        function(err, p) {
                            if (!err && p) {
                                p.children.push(name);
                                return p.save(function(err) { return !!err; });
                            }
                            else return false;
                        })) {
                        ret = 'Could not find parent';
                    }
                }

                console.log(ret)
                if (!ret) that.save(function(err, st) {
                    if (!err && st) {
                        fn(null, st);
                    }
                    else fn('Could not save team', null);
                });
                else fn(ret, null);
            } else {
                console.log(err);
                fn('Team by the same name already exists', null);
            }
        });
    }
    else fn('Request format is wrong', null);
};

// not to be used directly
TeamSchema.methods._connect = function(fn) {
    var cstring = this.connectionString;
    var exist = connMgr.getConnection(cstring);
    console.log(cstring)

    if (cstring && !exist) {
        var conn = goose.createConnection(cstring);
        // save connection instance
        connMgr.setConnection(conn, cstring);
        return fn(null, conn);
    }
    // connection already exists, return that
    else if (exist) {
        return fn(null, exist);
    }
    else {
        return fn('Could not connect', null);
    }
};

// not to be used directly
TeamSchema.methods._disconnect = function(fn) {
    connMgr.getConnection(this.connectionString).close();
    return fn(true);
};

TeamSchema.methods.destroy = function(fn) {
    var conn = connMgr.getConnection(this.connectionString);
    this._disconnect(conn);
    this.delete(fn);
};

TeamSchema.methods.addUser = function(user, fn) {
    if (validate(user, userValidationSchema)) {

        var that = this;
        entity.addtoTeam(user, this.name, function(err, u) {
            if (!err && u) {
                that.users.push(u.uid);
                that.save(function(err, sthat) {
                    if (!err && sthat) fn(null, sthat);
                    else fn('Could not add team to user');
                });
            }
            else {
                fn('Could not add team to user');
            }
        });
    }
    else fn('Request format is wrong', null);
};

TeamSchema.methods.setOwner = function(user, fn) {
    if (validate(user, userValidationSchema)) {
        this.owner = user.uid;
        fn(null, this);
    }
    else fn('Request format is wrong', null);
};

TeamSchema.methods.removeUser = function(user, fn) {
    if (validate(user, userValidationSchema)) {
        var ctr = 0;
        var that = this;
        var removed = false;

        this.users.forEach(function(u) {
            if (u == user.uid) {
                that.users.remove(ctr);
                entity.removeFromTeam(user, this.connection, function(err) {
                    if (!err) fn(null, this);
                    else fn('Could not remove user from team');
                    removed = true; // so that fn will not be called again
                });
            }
            ctr++;
        });
        if (!removed) fn('Could not find user in this team', null);
    }
    else fn('Request format is wrong', null);
};


////////////////////////////////
//   Organization Schema
////////////////////////////////

var OrganizationSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    owner: String,
    name: String,
    dbConnection: String,
    dbName: { type: String, default: uuid.v4() },
    teams: [String]
});
OrganizationSchema.index({ name: 1 });

OrganizationSchema.virtual('connectionString')
    .get(function () {
        return (this.dbConnection + '/' + this.dbName);
    });

// this has to be inside cause every schema is mapped to its mongoose connection
OrganizationSchema.methods._connect = function(fn) {
    var exist = connMgr.getConnection(this.connectionString);

    // create a connection to this organization's database
    if (this.connectionString && !conn) {
        console.log(this.connectionString)
        var conn = goose.createConnection(this.connectionString);
        // save the connection instance
        connMgr.setConnection(conn, this.connectionString);

        // todo: now connect to all team databases

        return (fn) && fn(null, conn);
    }
    // connection already exists, return that
    else if (exist) return fn(null, exist);
    else return (fn) && fn('Already connected?');
};

OrganizationSchema.methods._disconnect = function(fn) {
    if (this.connectionString && connMgr.getConnection(this.connectionString)) {
        connMgr.getConnection(this.connectionString).close();
        fn(null);
    } else fn('Connection is already closed');
};

OrganizationSchema.methods.createOrg = function(user, name, dbConnection, dbName, fn) {
    var that = this;

    if (validate(user, userValidationSchema)) {
        Organization.findOne( {name: name}, function(err, org) {
            if (!org) {
                var ret = null;
                (name) ? that.name = name : ret = 'name missing';
                (user) ? that.owner = name : ret = 'user is missing';
                (dbConnection) ? that.dbConnection = dbConnection : ret = 'dbConnection missing';
                (dbName) ? that.dbName = dbName :  ret = 'dbName missing';
                if (!ret) that.save(function(err, newo) {
                    if (!err) { fn(null, newo); }
                    else fn(err.message);
                });
                else fn(ret, null);
            }
            else fn('Organization exists');
        });
    }
    else fn('Request format is wrong');
};

OrganizationSchema.methods.createTeam = function(granter, name, dbConnection, dbName, parent, fn) {
    var conn = connMgr.getConnection(this.connectionString);
    var that = this;

    if (validate(granter, userValidationSchema)) {
        if (conn) {
            // get a mongoose model instance corresponding
            // to this organization's connection
            var Team = conn.model("TeamSchema", TeamSchema);

            // create a new team structure
            var team = new Team({});
            team.createTeam(conn, granter, name, dbConnection, dbName, parent, function(err, t) {
                if (!err && t) {
                    that.teams.push(t.name);
                    // connect to the team's database
                    t._connect(function(err) {
                        // now the org's data can be updated
                        if (!err) that.save(function (err) { if (err) fn(err.message);
                                                    else fn(null, t); });
                        else fn('Could not connect to database', null);
                    });
                }
                else fn(err, null);
            });
        }
        else fn('Organization is not connected', null);
    }
    else fn('Request format is wrong');
};

OrganizationSchema.methods.destroy = function() {
    this._disconnect();
//    this.delete(fn);
};

OrganizationSchema.methods.findTeam = function(teamName, fn) {
    var conn = connMgr.getConnection(this.connectionString);
    var Team = conn.model("TeamSchema", TeamSchema);

    if (conn) Team.findOne( {name: teamName}, function(err, t){
        if (!err && t) fn(null, t);
        else fn('Team not found', null);
    });
};

////////////////////////
// Tree Creator
////////////////////////

var teamTree = function(team, conn) {
    this.owner = team.owner;
    this.name = team.name;
    this.dbConnection = team.dbConnection;
    this.databaseName = team.dbName;
    this.users = team.users;
    this.children = [];
    var that = this;

//    if (conn) {
//        var Team = conn.model("TeamSchema", TeamSchema);
        team.children.forEach(function(c) {
//            // todo: problem this _cannot_ execute in sync! wtf!
//            Team.findOne({ name: c }, function(err, child) {
//                if (!err && child) {
//                    that.children.push(new teamTree(child, conn));
//                }
            that.children.push(c);
            });
//        });
//    }
};

OrganizationSchema.methods.TeamTree = function(teamName, org, fn) {
    var Team = connMgr.getConnection(org.connectionString).model("TeamSchema", TeamSchema);
    Team.findOne({ name: teamName }, function(err, t) {
//        console.log(new teamTree(t, connMgr.getConnection(org.connectionString)))
        if (!err && t) fn(null, new teamTree(t, connMgr.getConnection(org.connectionString)));
        else fn('Could not find team', null);
    });
};

var Organization = mongoose.model("OrganizationSchema", OrganizationSchema);
Organization.ensureIndexes( function(err) { if (err) console.log("ensureInedxes failed") } );

var findOrganization = function(name, fn) {
    Organization.findOne({"name": name }, fn);
};
exports.findOrganization = findOrganization;
exports.findTeam = function(name, org, fn) {
    exports.findOrganization(org, function(err, o) {
        o.findTeam(name, fn);
    })
};

////////////////////////////////
//   Permission Verification for
//   any operations over here
////////////////////////////////

var verify = function(user, entity, fn) {
    // only if you're a manager or higher and you own the resource, you can make changes
    // P.S. team owners have to be specified manually after team's creation
    if ((permissions.hasAdminPermission(user, permissions.mgr)) &&
        (entity.owner == user))
    {
        console.log('here')
        fn(null);
    }

    // admin and higher accounts can make changes if their organizations are the same
    else if ((permissions.hasAdminPermission(user, permissions.admin))
        && (user.org == entity.orgName))
    {
        console.log('here2')
        fn(null);
    }

    // NOTE: this has an interesting side-effect:
    // only org-level users can create an org-level team
    // e.g. 'Engineering dept', then on the engg dept admin
    // can create subteams, and the subteam owners or the admin can create more
    // subteams and so on. mgrs of a team can create their own sub-teams

    else fn('Permission denied');
};


////////////////////////////////
//   JSON Request Servers
////////////////////////////////

/**
 * JSON body structure:
 * Input
 * {
 *  uuid: String,
 *  type: String,
 *  success: Boolean,
 *  msg: {}
 * }
 *
 */
var result = function(uuid, type, msg, outcome){
    this.uuid = uuid;
    this.type = type;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};


/**
 * json body structure:
 * Input:
 * {
 *  team: String
 * }
 *
 * Output:
 * {
 * tree
 * }
 *
 */
var getAllUsers = function(user, json, fn) {
    Organization.findOne({ name: user.org }, function(err, org) {
        if (!err && org) {
            org.TeamTree(json.team, org, function(err, tree) {
                if (!err) fn(true, tree);
                else fn(false, err);
            });
        }
        else fn(false, 'could not find organization');
    });
};
exports.getAllUsers = getAllUsers;

/**
 * json body structure:
 * Input:
 * {
 *  parent: String,
 *  name: String,
 *  dbName: String,
 *  dbConnection: String
 * }
 *
 * Output:
 * {
 *  useruid: String
 *  teamname: String
 * }
 *
 */
var createTeam = function(user, json, fn) {
    if (validate(json, createTeamSchema)) {
        Organization.findOne({ name: user.org }, function(err, org) {
            if (!err && org) {
//                verify(user, org, function(err) {
//                    if (!err) {
                        org.createTeam(user, json.name,
                            json.dbConnection, json.dbName, json.parent, function(err, team) {
                                if (!err && team) {
                                    var response = {
                                        "useruid": user.uid,
                                        "teamname": team.name
                                    };
                                    fn(true, response);
                                }
                                else fn(false, err);
                            });
//                    }
//                    else fn(false, 'User does not have permission to do that');
//                });
            } else fn(false, 'No such organization exists');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.createTeam = createTeam;

/**
 * json body structure:
 * Input:
 * {
 *  name: String,
 *  team: String
 * }
 *
 * Output:
 * {
 *  useruid: String
 * }
 *
 */
var addUser = function(granter, json, fn) {
    if (validate(json, addUserSchema)) {
        findOrganization(granter.org, function(err, org) {
            console.log(granter.org)
            if (!err && org) {
                org.findTeam(json.team, function(err, t) {
                    if (!err && t) {
                        entity.findByUsername(json.name, function(err,  u) {
                            if (!err && u) {
                                // verify if the granter owns the team, or if the granter is higher-up
                                verify(granter, t, function(err) {
                                    if (!err) {
                                        // todo: prevent one user to be added multiple times
                                        t.addUser(u, function(err, au) {
                                            if (!err) fn(null, { useruid: au.children });
                                            else fn(false, err);
                                        });
                                    }
                                    else fn(false, 'User does not have permission to do that');
                                });
                            }
                            else fn(false, 'Could not find user');
                        });
                    }
                    else fn(false, 'Could not find team');
                });
            }
            else fn(false, 'Could not find organization');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.addUser = addUser;

/**
 * json body structure:
 * Input:
 * {
 *  name: String,
 *  team: String
 * }
 *
 * Output:
 * {
 *  useruid: String
 * }
 *
 */
var changeTeamOwner = function(granter, json, fn) {
    if (validate(json, changeTeamOwnerValidationSchema)) {
        findOrganization(granter.org, function(err, org) {
            if (!err && org) {
                org.findTeam(json.team, function(err, t) {
                    if (!err && t) {
                        verify(granter, t, function(err) {
                            entity.findByUsername(json.name, function(err, u) {
                                if (!err && u ) t.setOwner(u, function(err, t) {
                                    if (!err && t) t.save(function(err, t) {
                                        if (!err && t) fn(true, JSON.stringify(t));
                                        else fn(false, 'Could not save');
                                    });
                                });
                                else fn(false, 'User not found');
                            })
                        })
                    }
                    else fn(false, 'Could not find team');
                })
            }
            else fn(false, 'Could not find organization');
        });
    }
    else fn(false, 'Request format is wrong');
};
exports.changeTeamOwner = changeTeamOwner;

/**
 * JSON body structure:
 * Input
 * {
 *  name: String,
 *  dbConnection: String,
 *  dbName: String,
 *  hash: String,
 *  kingdoms: [String]
 * }
 *
 * Output:
 * {
 *  useruid: String
 * }
 *
 */
var godCreatesAnOrg = function(user, json, fn) {
    if (validate(json, godCreatesAnOrgSchema)) {
        if (user.uid === 'god') {
            var org = new Organization();

            // create an organization an user and bind the user to that organization
            org.createOrg(user, json.name, json.dbConnection, json.dbName, function(err, newo) {
                if (!err && newo) {
                    entity.addOrgUser(user, json.name, newo.name,
                        json.hash, json.kingdoms, function(err, newu) {
                        if (!err && newu) {
                            var response = {
                                "useruid" : newu.uid
                            };
                            fn(true, response);
                        }
                        else fn(false, err);
                    });
                }
                else fn(false, err);
            });
        }
        else fn(false, 'thou shalt not be god!');
    } else fn(false, 'Request format is wrong');
};
exports.godCreatesAnOrg = godCreatesAnOrg;

exports.forEachOrg = function(fn) {
    Organization.find({}, function(err, orgs) {
        if (!err && orgs.length) {
            orgs.forEach(fn);
        }
    });
};

exports.forEachTeam = function(fn) {
    Organization.find({}, function(err, orgs) {
        if (!err && orgs.length) {
            orgs.forEach(function(o) {
                var conn = connMgr.getConnection(o.connectionString);
                var Team = conn.model("TeamSchema", TeamSchema);

                if (conn) Team.find({}, function(err, teams) {
                    teams.forEach(fn);
                });
            });
        }
    });
};


var teamConstructor = function() {
    // connect everything we know of
    Organization.find({}, function(err, orgs) {
        // connect all organizations and their teams
        if (!err) {
            orgs.forEach(function(o) {
                console.log(o)
                o._connect(function(err)
                { if (err) console.log('Could not connect organization ' + o.name + err) });
            });
        }
    });
};
exports.team = teamConstructor;

