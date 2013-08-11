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

ConnectionMgr.prototype.clearConnection = function(conn, connectionString){
    return this.connections[connectionString] = undefined;
};

////////////////////////////////
//   Team Schema
////////////////////////////////

var TeamSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    name: String,
    orgName: String,
    dbConnection: String,
    dbName: { type: String, default: uuid.v4() },
    children: [String]
});
TeamSchema.index({ name: 1 , orgName: 1 });

TeamSchema.virtual('connectionString')
    .get(function () {
        return (this.dbConnection + '/' + this.dbName);
    });

TeamSchema.methods.CreateTeam = function (name, dbConnection, dbName, parent, org, fn) {
    var that = this;

    team.findOne({ "name": name }, function(err, t) {
        if (!t) {
            var ret = null;
            name ? that.name = name : ret = 'name missing';
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

    if (cstring) {
        var conn = mongoose.createConnection(cstring);
        return fn(null, conn);
    } else return fn('Could not connect', null);
};

TeamSchema.methods.Disconnect = function(conn, fn) {
    conn.close();
    return fn(true);
};

TeamSchema.methods.Destroy = function(conn, fn) {
    this.Disconnect(conn);
    team.findOne({ "name": name }, function(err, t) {
        if (!err && t) t.delete(fn);
        else fn('Team not found');
    });
};

////////////////////////////////
//   Organization Schema
////////////////////////////////

var OrganizationSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
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

OrganizationSchema.virtual("connection")
    .get(function() {
        return connections.forEach(function(c) {
            if (c.name == this.name)
                return c;
        });
    })
    .set(function(goose, del) {
        if (del) {
            var ctr = 0;
            connections.forEach(function(c) {
                if (c.name == this.name)
                    c.remove(ctr);
                ctr++;
            });
            return true;
        }
        if (!connections.forEach(function(c) {
            if (c.name == this.name) {
                c.goose = goose;
                return !!c;
            }
        })) {
            var newc = {
                "name": this.name,
                "goose": goose
            };
            return !!connections.push(newc);
        } else return true;
    });

// this has to be inside cause every schema is mapped to its mongoose connection
OrganizationSchema.methods.Connect = function(fn) {
    // create a connection to this organization's database
    if (this.connectionString) {
        var conn = mongoose.createConnection(this.connectionString);
        // save the connection instance
        this.connnection.set(conn);

        // todo: now connect to all team databases

        return (fn) && fn(null, conn);
    } else return (fn) && fn('No database connection provided');
};

OrganizationSchema.methods.Disconnect = function(fn) {
    //
};

OrganizationSchema.methods.Create = function(name, dbConnection, dbName, fn) {
    var ret = null;
    (name) ? this.name = name : ret = 'name missing';
    (dbConnection) ? this.dbConnection = dbConnection : ret = 'dbConnection missing';
    (dbName) ? this.dbName = dbName :  ret = 'dbName missing';
    if (ret) this.save(fn);
    else fn(ret, null);
};

OrganizationSchema.methods.CreateTeam = function(name, dbConnection, dbName, parent, fn) {
    var conn = this.connection;
    if (conn) {
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
    //
};

var Organization = mongoose.model("OrganizationSchema", OrganizationSchema);
Organization.ensureIndexes( function(err) { if (err) consolelog("ensureInedxes failed") } );

Organization.statics.Find = function(name, fn) {
    this.findOne({"name": name }, fn);
};

////////////////////////////////
//   Winterfell Schema
////////////////////////////////

var WinterfellSchema = new Schema({
    local: { type: String, default: settingsdb },
    orgs: [OrganizationSchema]
});
var Winterfell = mongoose.model("WinterfellSchema", WinterfellSchema);

var findOrganization = function(json, fn) {
    return Organization.findOne({ name: json.name }, fn);
};

////////////////////////////////
//   Winterfell Constructor
////////////////////////////////

var BirthofAStark = function() {
    // connect everything we know of
    Organization.find({}, function(err, o) {
        //
    })
};
module.exports = BirthofAStark;

////////////////////////////////
//   JSON Request Servers
////////////////////////////////

/**
 * json request structure:
 * {
 *  name: String,
 *  dbName: String,
 *  dbConnection: String,
 * }
 */
var CreateOrganization = function(json, fn) {
    Organization.findOne({ name: json.name }, function(err, o) {
        if (!o) {
            var org = new Organization({});
            org.Create(json.name, json.dbConnection, json.dbName, function(err, o) {
                if (!err && o) org.Connect(fn);
                else fn('Could not create organization', null);
            });
        } else if (err) fn(err, null);
        else fn('Organization alrady exists', null);
    });
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
var CreateTeam = function(json, fn) {
    Organization.findOne({ name: json.name }, function(err, o) {
        if (!err && o) {
            org.CreateTeam(json.name,
                json.dbConnection, json.dbName, json.parent, o, fn);
        } else fn('No such organization exists');
    });
};
