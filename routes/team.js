/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 7/8/13
 * Time: 4:02 PM
 * To change this template use File | Settings | File Templates.
 */


var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var memcached = require('memcached');

var uuid = require('node-uuid');

// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

// the local database storing organization schemas
var settingsdb = 'mongodb://localhost/winterfell';

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
var ConnectionMgr = function() {
    this.connections = {};
};

ConnectionMgr.prototype.getConnection = function(connectionString){
    return this.connections[connectionString];
};

ConnectionMgr.prototype.setConnection = function(conn, connectionString){
    return this.connections[connectionString] = conn;
};

ConnectionMgr.prototype.clearConnection = function(connectionString){
    return this.connections[connectionString] = undefined;
};

var ConnMgr = new ConnectionMgr();

// this can be called from anywhere
exports.GetConnection = ConnMgr.getConnection;

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

TeamSchema.virtual('connectionString')
    .get(function () {
        return (this.dbConnection + '/' + this.dbName);
    });

TeamSchema.methods.CreateTeam = function (user, name, dbConnection, dbName, parent, org, fn) {
    var that = this;

    team.findOne({ "name": name }, function(err, t) {
        if (!t) {
            var ret = null;
            name ? that.name = name : ret = 'name missing';
            user ? that.owner = user.uid : ret = 'user missing';
            dbConnection ? that.dbConnection = dbConnection : ret = 'dbConnection missing';
            dbName ? that.dbName = dbName : ret = 'dbName missing';
            that.orgName = org.name;

            // add the tree references
            if (parent) {
                if (!this.findOne({ "name": parent }, function(err, p) {
                    if (!err && p) return !!p.children.push(name);
                    else return false;
                })) {
                    ret = 'Could not find parent';
                }
            }

            if (ret) that.save(function(err, st) {
                if (!err && st) fn(null, st);
                else fn('Could not save team', null);
            });
            else fn(ret, null);
        } else fn('Team by the same name already exists', null);
    });
};

TeamSchema.methods.Connect = function(fn) {
    var cstring = this.connnectionString;

    if (cstring && !ConnMgr.getConnection(cstring)) {
        var conn = mongoose.createConnection(cstring);
        // save connection instance
        Connmgr.setConnection(conn, cstring);
        return fn(null, conn);
    } else return fn('Could not connect', null);
};

TeamSchema.methods.Disconnect = function(fn) {
    ConnMgr.getConnection(this.connectionString).close();
    ConnMgr.clearConnection(this.connectionString);
    return fn(true);
};

TeamSchema.methods.Destroy = function(fn) {
    var conn = ConnMgr.getConnection(this.connectionString);
    this.Disconnect(conn);
    this.delete(fn);
};

TeamSchema.methods.GetConnection = function() {
    return ConnMgr.getConnection(this.connectionString);
};

TeamSchema.methods.AddUser = function(user, fn) {
    this.users.push(user.uid);
    var entity = require('./entity');
    entity.AddtoTeam(user, this.connection, function(err) {
        if (!err) fn(null, this);
        else fn('Could not add team to user');
    });
};

TeamSchema.methods.RemoveUser = function(user, fn) {
    var ctr = 0;
    var that = this;

    this.users.forEach(function(u) {
        if (u == user.uid) {
            var entity = require('./entity');

            that.users.remove(ctr);
            entity.RemoveFromTeam(user, this.connection, function(err) {
                if (!err) fn(null, this);
                else fn('Could not add team to user');
            });
        }
        ctr++;
    });
    // note: point of inconsistence, callback might not necessarily be called
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

// locally this structure maintains the
// status of team-level db connections' status
var connections = [];

// this has to be inside cause every schema is mapped to its mongoose connection
OrganizationSchema.methods.Connect = function(fn) {
    // create a connection to this organization's database
    if (this.connectionString && !ConnMgr.getConnection(this.connectionString)) {
        var conn = mongoose.createConnection(this.connectionString);
        // save the connection instance
        ConnMgr.setConnection(conn, this.connectionString);

        // todo: now connect to all team databases

        return (fn) && fn(null, conn);
    } else return (fn) && fn('Already connected?');
};

OrganizationSchema.methods.Disconnect = function(fn) {
    if (this.connectionString && ConnMgr.getConnection(this.connectionString)) {
        ConnMgr.getConnection(this.connectionString).close();
        ConnMgr.clearConnection(this.connectionString);
        fn(null);
    } else fn('Connection is already closed');
};

OrganizationSchema.methods.Create = function(user, name, dbConnection, dbName, fn) {
    var ret = null;
    (name) ? this.name = name : ret = 'name missing';
    (user) ? this.owner = user.uid : ret = 'user is missing';
    (dbConnection) ? this.dbConnection = dbConnection : ret = 'dbConnection missing';
    (dbName) ? this.dbName = dbName :  ret = 'dbName missing';
    if (!ret) this.save(function(err, newo) {
        if (!err) { fn(null, newo); }
        else fn(err.message);
    });
    else fn(ret, null);
};

OrganizationSchema.methods.CreateTeam = function(name, dbConnection, dbName, parent, fn) {
    var conn = this.connection;
    if (conn) {
        // get a mongoose model instance corresponding
        // to this organization's connection
        var Team = conn.goose.model("TeamSchema", TeamSchema);

        // create a new team structure
        var team = new Team({});
        t.CreateTeam(name, dbConnection, dbName, parent, this, function(err, t) {
            if (!err && conn) {
                this.teams.push(t.name);
                // connect to the team's database
                t.Connect(fn);
            }
            else fn(err, null);
        });
    }
    else fn('Organizaion is not connected', null);
};

OrganizationSchema.methods.Destroy = function() {
    var conn = ConnMgr.getConnection(this.connectionString);
    this.Disconnect(conn);
    this.delete(fn);
};

OrganizationSchema.methods.AddUserToTeam = function(teamName, user, fn) {
    var conn = ConnMgr.getConnection(this.connectionString);
    var Team = conn.goose.model("TeamSchema", TeamSchema);

    if (conn) Team.findOne( {name: teamName}, function(err, t) {
        if (user.d)
        if (!err && t) t.AddUser(user, fn);
        else fn('No such team exists', null);
    });
    else fn('Could not get database connection', null);
};

OrganizationSchema.methods.RemoveUserFromTeam = function(teamName, user, fn) {
    var conn = ConnMgr.getConnection(this.connectionString);
    var Team = conn.goose.model("TeamSchema", TeamSchema);

    if (conn) Team.findOne( {name: teamName}, function(err, t) {
        if (!err && t) t.RemoveUser(user, fn);
        else fn('No such team exists', null);
    });
    else fn('Could not get database connection', null);
};

var Organization = mongoose.model("OrganizationSchema", OrganizationSchema);
Organization.ensureIndexes( function(err) { if (err) consolelog("ensureInedxes failed") } );

exports.FindOrganization = function(name, fn) {
    Organization.findOne({"name": name }, fn);
};

////////////////////////////////
//   Permission Verification for
//   any operations over here
////////////////////////////////

var verify = function(user, entity, fn) {
    var mordor = require('./ODNSWIM');

    // only if you're a manager or higher and you own the resource, you can make changes
    // P.S. team owners have to be specified manually after team's creation
    if ((mordor.Permission.hasAdminPermission(user, mordor.Permission.mgr)) &&
        (entity.owner == user))
        fn(true);

    // org and higher accounts can make changes if their organizations are the same
    else if ((mordor.Permission.hasAdminPermission(user, mordor.Permission.org))
        && (user.org == entity.orgName))
        fn(true);

    // NOTE: this has an interesting side-effect:
    // only org-level users can create an org-level team
    // e.g. 'Engineering dept', then on the engg dept admin
    // can create subteams, and the subteam owners or the admin can create more
    // subteams and so on. mgrs of a team can create their own sub-teams

    else fn(false);
};


////////////////////////////////
//   JSON Request Servers
////////////////////////////////

var result = function(uuid, type, msg, outcome){
    this.uuid = uuid;
    this.type = type;
    this.success =  (outcome ? true : false);
    this.msg = msg;
};

/**
 * json request structure:
 * {
 *  name: String,
 *  dbName: String,
 *  dbConnection: String,
 * }
 */
var CreateOrganization = function(user, json, fn) {
    if (user.uid == god)
    Organization.findOne({ name: json.name }, function(err, o) {
        if (!o) {
            var org = new Organization({});
            org.Create(user, json.name, json.dbConnection, json.dbName, function(err, o) {
                if (!err && o) org.Connect(fn);
                else fn('Could not create organization', null);
            });
        } else if (err) fn(err, null);
        else fn('Organization alrady exists', null);
    });
    else fn('No you dont!');
};

/**
 * json request structure:
 * {
 *  org: String,
 *  parent: String,
 *  name: String,
 *  dbName: String,
 *  dbConnection: String,
 * }
 */
var CreateTeam = function(user, json, fn) {
    Organization.findOne({ name: json.name }, function(err, o) {
        if (!err && o) {
            verify(user, org, function(err) {
                if (!err) {
                    org.CreateTeam(user, json.name,
                        json.dbConnection, json.dbName, json.parent, o, fn);
                }
                else fn('User does not have permission to do that');
            });
        } else fn('No such organization exists');
    });
};

/**
 * json request structure:
 * {
 *  org: String,
 *  team: String,
 *  user: String
 * }
 */
var AddUser = function(user, json, fn) {
    if (json.team && json.organization) {
        findOrganization(json.organization, function(err, org) {
            if (!err && org) {
                verify(user, org, function(err) {
                    if (!err) {
                        org.AddUserToTeam(json.team, user, function(err, t) {
                            if (!err) fn(null);
                            else fn(err);
                        });
                    }
                    else fn('User does not have permission to do that');
                });
            }
            else fn('Could not find organization');
        });
    }
    else fn('Parameters missing');
};



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
 *  orguuid: String,
 *  useruuid: String
 * }
 *
 */

var GodCreatesAnOrgSchema  = {
    "id": "/GodCreatesAnOrgSchema",
    "type": "object",
    "properties": {
        "name": string,
        "dbConnection": { "type": string },
        "dbname": { "type": string },
        "hash": { "type": string },
        "kingdoms": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
};
v.addSchema(GodCreatesAnOrgSchema, '/GodCreatesAnOrgSchema');

var GodCreatesAnOrg = function(user, json, fn) {
    if (v.validate(json, GodCreatesAnOrgSchema)) {
        if (user.uid == 'god') {
            var org = new Organization();

            // create an organization an user and bind the user to that organization
            org.Create(user, json.name, json.dbConnection, json.dbName, function(err, newo) {
                if (!err && newo) {
                    var entity = require('./entity');
                    entity.addOrgUser(user, json.name, newo.connectionString, json.hash, json.kingdoms, function(err, newu) {
                        if (!err) {
                            var response = {
                                "orguuid" : newo.uuid,
                                "useruuid" : newu.uuid
                            };
                            fn(null, response);
                        }
                        else fn(err, null);
                    });
                }
                else fn('Could not create user org');
            });
        }
        else fn('thou shalt not be god!');
    } else fn('Request format is wrong');
};

/**
 * JSON structure:
 * {
 *  uuid: String,
 *  request: String,
 *  body: {}
 * }
 *
 */
var teamServer = function(req, res, next) {
    req.accepts('application/json');

    if (req.body) switch(req.body.request) {
        case 'adduser':
            AddUser(req.user, req.body.body, function(err) {
                res.send(new result(req.request, err, (err ? false : true)));
            });
            break;

        case 'removeuser':
            DelUser(req.user, req.body.body, function(err) {
                res.send(new result(req.request, err, (err ? false : true)));
            });
            break;

        case 'getallusers':
            GetAllUsers(req.user, req.body.body, function(err) {
                res.send(new result(req.request, err, (err ? false : true)));
            });
            break;

        default:
            res.send(new result(req.request, 'Invalid request', false));
            break;
    }
};

var orgServer = function(req, res, next) {
    req.accepts('application/json');

    if (req.body) switch(req.body.request) {
        case 'addteam':
            CreateTeam(req.user, req.body.body, function(err) {
                res.send(new result(req.uuid, req.request, err, (err ? false : true)));
            });
            break;

        case 'removeteam':
            DelTeam(req.user, req.body.body, function(err) {
                res.send(new result(req.uuid, req.request, err, (err ? false : true)));
            });
            break;

        case 'createorg':
            GodCreatesAnOrg(req.user, req.body.body, function(err) {
                res.send(new result(req.uuid, req.request, err, (err ? false : true)));
            });
            break;

        case 'removeorg':
            GodDestroysAnOrg(req.user, req.body.body, function(err) {
                res.send(new result(req.uuid, req.request, err, (err ? false : true)));
            });
            break;
            
        default:
            res.send(new result(req.uuid, req.request, 'Invalid request', false));
            break;
    }
};

////////////////////////////////
//   Winterfell Constructor
////////////////////////////////

var ConnectAll = function(app) {
    // set up the routes
    app.post('/team', teamServer);
    app.post('/organization', orgServer);

    // connect everything we know of
    Organization.find({}, function(err, o) {
        // connect all organizations and their teams
        if (!err) {
            o.forEach(function(org) {
                org.Connect(function() { console.log('Could not connect organization') });
            });
        }
    })
};
exports.Init = ConnectAll;



