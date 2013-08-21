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
var path = require('path');
var uuid = require('node-uuid');

// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

var entity = require('./entity');

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
TeamSchema.index({ children: 1 }); //index separately as search by children is independent

TeamSchema.virtual('connectionString')
    .get(function () {
        return (this.dbConnection + '/' + this.dbName);
    });

TeamSchema.methods.CreateTeam = function (conn, user, name, dbConnection, dbName, parent, org, fn) {
    var that = this;
    var Team = conn.model("TeamSchema", TeamSchema);

    this.model("TeamSchema").findOne({ "name": name }, function(err, t) {
        if (!t) {
            var ret = null;
            name ? that.name = name : ret = 'name missing';
            user ? that.owner = user.uid : ret = 'user missing';
            dbConnection ? that.dbConnection = dbConnection : ret = 'dbConnection missing';
            dbName ? that.dbName = dbName : ret = 'dbName missing';
            that.orgName = org.name;

            // add the tree references
            if (parent) {
                if (!that.model("TeamSchema").findOne({ "name": parent },
                    function(err, p) {
                        if (!err && p) {
                            p.children.push(name);
                            return p.save(function(err) {
                                if (err) return true;
                                else return false;
                            })
                        }
                        else return false;
                })) {
                    ret = 'Could not find parent';
                }
            }
            console.log(that)
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

    var that = this;
    entity.AddtoTeam(user, this.connectionString, function(err) {
        that.save(function(err, sthat) {
            if (!err) fn(null, sthat);
            else fn('Could not add team to user');
        });
    });
};

TeamSchema.methods.RemoveUser = function(user, fn) {
    var ctr = 0;
    var that = this;

    this.users.forEach(function(u) {
        if (u == user.uid) {

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
    teams: [String],
    rootNodes: [String] // specifically for tree searching
});
OrganizationSchema.index({ name: 1 });

OrganizationSchema.virtual('connectionString')
    .get(function () {
        return (this.dbConnection + this.dbName);
    });

// locally this structure maintains the
// status of team-level db connections' status
var connections = [];

// this has to be inside cause every schema is mapped to its mongoose connection
OrganizationSchema.methods.Connect = function(fn) {
    // create a connection to this organization's database
    if (this.connectionString && !ConnMgr.getConnection(this.connectionString)) {
        console.log(this.connectionString)
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
    var that = this;

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
};

OrganizationSchema.methods.CreateTeam = function(user, name, dbConnection, dbName, parent, fn) {
    var conn = ConnMgr.getConnection(this.connectionString);
    var that = this;
    if (conn) {
        // get a mongoose model instance corresponding
        // to this organization's connection
        var Team = conn.model("TeamSchema", TeamSchema);

        // create a new team structure
        var team = new Team({});
        team.CreateTeam(conn, user, name, dbConnection, dbName, parent, this, function(err, t) {
            if (!err && t) {
                that.teams.push(t.name);
                // no parent specified, this team qualifies as a root node
                if (!parent) that.rootNodes.push(t.name);
                // connect to the team's database
                t.Connect(function(err) {
                    // now the org's data can be updated
                    that.save(function (err) { if (err) fn(err.message);
                                                        else fn(null, t); });
                    if (err) console.log("Could not connect, probably same DB");
                });
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

OrganizationSchema.methods.FindTeam = function(teamName, fn) {
    var conn = ConnMgr.getConnection(this.connectionString);
    var Team = conn.goose.model("TeamSchema", TeamSchema);

    if (conn) Team.findOne( {name: teamName}, function(err, t){
        if (!err && t) fn(null, t);
        else fn('Team not found', null);
    });
};

////////////////////////
// Tree Creator
////////////////////////

var node = function(name) {
    this.name =  name;
    this.children = {};
};

// todo: re-check this when sane
var recurseTree = function(conn, tree, root, fn) {
    root.children.forEach(function(c) {
        conn.findOne({ name: c }, function(err, child) {
            // the third criteria is to detect and avoid recursive associations
            if (!err && child && !child.children[root.name]) {
                var childNode = new node(child.name);
                if (child.children.length) recurseTree(conn, childNode, child);
                tree.children.push(childNode);
            }
        });
    });
    fn(tree);
};

OrganizationSchema.methods.TeamTree = function(fn) {
    var response = {};

    // get this org's database connection
    var conn = ConnMgr.getConnection(this.connectionString);
    var Team = conn.goose.model("TeamSchema", TeamSchema);

    var error = null;

    var rootNode = new node({});

    if (conn) {
        // create the org node
        root.name = this.name;

        // for each root node, find its children
        this.rootNodes.forEach(function(r) {
            Team.findOne({ name: r }, function(err, root) {
                if (!err && root) {
                    // add all the root nodes
                    rootNode.children.push(new node({ name: root.name }));
                    var thisTree = rootNode.children;
                    recurseTree(Team, thisTree, root, function(tree) {
                        if (!tree) error = true;
                    });
                }
                else console.log('Could not find team, database might need cleaning');
            });
        });
    }

    if (!error) fn(null, rootNode);
    else fn('Error occured while constructing tree');
};


var Organization = mongoose.model("OrganizationSchema", OrganizationSchema);
Organization.ensureIndexes( function(err) { if (err) console.log("ensureInedxes failed") } );

var findOrganization = function(name, fn) {
    Organization.findOne({"name": name }, fn);
};
exports.FindOrganization = findOrganization;


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
 *  org: String,
 *  parent: String,
 *  name: String,
 *  dbName: String,
 *  dbConnection: String
 * }
 *
 * Output:
 * {
 *  useruuid: String
 *  teamname: String,
 *  teamuuid: String
 * }
 *
 */
var createTeamSchema = {
    "id": "/createTeamSchema",
    "type": "object",
    "properties": {
        "org": { "type": "string" },
        "parent": { "type": "string" },
        "name": { "type": "string" },
        "dbName": { "type": "string" },
        "dbConnection": { "type": "string" }
    }
};
v.addSchema(createTeamSchema, '/createTeamSchema');

var CreateTeam = function(user, json, fn) {
    if (!v.validate(json, createTeamSchema).errors.length) {
        Organization.findOne({ name: json.org }, function(err, org) {
            if (!err && org) {
                verify(user, org, function(err) {
                    if (!err) {
                        org.CreateTeam(user, json.name,
                            json.dbConnection, json.dbName, json.parent, function(err, team) {
                                if (!err && team) {
                                    var response = {
                                        "useruuid": user.uuid,
                                        "teamname": team.name,
                                        "teamuuid": team.uuid
                                    };
                                    fn(null, response);
                                }
                                else fn(err);
                            });
                    }
                    else fn('User does not have permission to do that');
                });
            } else fn('No such organization exists');
        });
    }
    else fn('Request format is wrong');
};


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
 *  useruuid: String
 * }
 *
 */
var addUserSchema = {
    "id": "/addUserSchema",
    "type": "object",
    "properties": {
        "name": String,
        "team": String
    }
};

var AddUser = function(granter, json, fn) {
    if (!v.validate(json, addUserSchema).errors.length) {
        findOrganization(granter.org, function(err, org) {
            console.log(granter.org)
            if (!err && org) {
                org.FindTeam(json.team, function(err, t) {
                    if (!err && t) entity.findByUsername(json.name, function(err,  u) {
                        if (!err && u) {
                            // verify if the granter owns the team, or if the granter is higher-up
                            verify(granter, t, function(err) {
                                if (!err) {
                                    t.AddUser(u, function(err, au) {
                                        if (!err) fn(null, { useruuid: au.uuid });
                                        else fn(err, null);
                                    });
                                }
                                else fn('User does not have permission to do that');
                            });
                        }
                    });
                });
            }
            else fn('Could not find organization');
        });
    }
    else fn('Request format is wrong');
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
 *  useruuid: String
 * }
 *
 */

var godCreatesAnOrgSchema  = {
    "id": "/godCreatesAnOrgSchema",
    "type": "object",
    "properties": {
        "name": { "type": "string", "required": true },
        "dbConnection": { "type": "string", "required": true },
        "dbName": { "type": "string", "required": true },
        "hash": { "type": "string", "required": true },
        "kingdoms": {
            "type": "array",
            "items": { "type": "string" }
        }
    }
};
v.addSchema(godCreatesAnOrgSchema, '/godCreatesAnOrgSchema');

var GodCreatesAnOrg = function(user, json, fn) {
    if (!v.validate(json, godCreatesAnOrgSchema).errors.length) {
        if (user.uid == 'god') {
            var org = new Organization();

            // create an organization an user and bind the user to that organization
            org.Create(user, json.name, json.dbConnection, json.dbName, function(err, newo) {
                if (!err && newo) {
                    entity.addOrgUser(user, json.name, newo.name,
                        json.hash, json.kingdoms, function(err, newu) {
                        if (!err && newu) {
                            var response = {
                                "useruuid" : newu.uuid
                            };
                            fn(null, response);
                        }
                        else fn(err, null);
                    });
                }
                else fn(err);
            });
        }
        else fn('thou shalt not be god!');
    } else fn('Request format is wrong');
};

/**
 * JSON body structure:
 * Input
 * {
 *  name: String,
 *  dbConnection: String
 * }
 *
 * Output:
 * {
 *  orguuid: String,
 *  useruuid: String
 * }
 *
 */

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
            AddUser(req.user, req.body.body, function(err, response) {
                res.send(new result(req.body.uuid, req.body.request,
                    (response ? response : err),
                    (err ? false : true)));
            });
            break;

        case 'removeuser':
            DelUser(req.user, req.body.body, function(err) {
            });
            break;

        case 'getallusers':
            GetAllUsers(req.user, req.body.body, function(err) {
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
            CreateTeam(req.user, req.body.body, function(err, response) {
                res.send(new result(req.body.uuid, req.body.request,
                    (response ? response : err),
                    (err ? false : true)));
            });
            break;

        case 'removeteam':
            DelTeam(req.user, req.body.body, function(err, response) {
                res.send(new result(req.body.uuid, req.body.request,
                    err,
                    (response ? response : err),
                    (err ? false : true)));
            });
            break;

        case 'createorg':
            GodCreatesAnOrg(req.user, req.body.body, function(err, response) {
                res.send(new result(req.body.uuid, req.body.request,
                    (response ? response : err),
                    (err ? false : true)));
            });
            break;

        case 'removeorg':
            GodDestroysAnOrg(req.user, req.body.body, function(err, response) {
                res.send(new result(req.body.uuid, req.body.request,
                    (response ? response : err),
                    (err ? false : true)));
            });
            break;
            
        default:
            res.send(new result(req.body.uuid, req.body.request, 'Invalid request', false));
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
    Organization.find({}, function(err, orgs) {
        // connect all organizations and their teams
        if (!err) {
            orgs.forEach(function(o) {
                o.Connect(function(err)
                { if (err) console.log('Could not connect organization ' + o.name + err) });
            });
        }
    })
};
exports.Init = ConnectAll;



