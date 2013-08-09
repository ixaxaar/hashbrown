/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 7/8/13
 * Time: 4:02 PM
 * To change this template use File | Settings | File Templates.
 */

// list of mongo databases to connect to,
// organization specific
var mongoose = require('mongoose')
    , Schema = goose.Schema
    , ObjectId = Schema.ObjectId;

var uuid = require('node-uuid');

var settingsdb = 'mongodb://localhost/winterfell';
var Connections = null;

// db settings for a team
var TeamConnectionSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    name: String,
    dbconnection: String,
    dbName: String
});
TeamConnectionSchema.index({name: 1});
var TeamDbConnection = mongoose.model("TeamConnectionSchema", TeamConnectionSchema);

// db settings for an organization
var OrgConnectionSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    name: String,
    dbconnection: String,
    teams: [TeamConnectionSchema]
});
OrgConnectionSchema.index({name: 1});
var OrgDbConnection = mongoose.model("OrgConnectionSchema", OrgConnectionSchema);

// the entire db connection structure
var DbConnectionSchema = new Schema({
    local: { type: String, default: settingsdb },
    orgs: [OrgConnectionSchema]
});
var DbConnection = mongoose.model("DbConnectionSchema", DbConnectionSchema);
DbConnection.ensureIndexes(function(err, obj) { if (err) console.log('Could not ensure index'); });

// register a team's db connection
exports.TeamDbRegister = function(name, parent, collection, fn) {
    var tcs = new TeamDbConnection({});
    tcs.name = name;
    tcs.dbconnection = connection;
    tcs.dbName = name;
    Connections.findOne({ name: parent }, function(err, p) {
        if (!err) p.findOne({ name: name }, function(err, n) {
           if (n) {
               if (p) {
                   p.teams.push(tcs);
                   Collections.save(function(err, c) {
                       if (!err) fn(null, p);
                       else fn('Could not save', null);
                   });
               }
               else fn('Could not find parent', null);
           } else fn('Team name exists', null);
        });
        else fn('Could not find parent', null);
    });
};

exports.TeamDbModify = function(name, org, connection, fn) {
    Connections.findOne({ 'orgs.name': org }, function(err, o) {
        if (!err && o) {
            o.findOne({ 'teams.name': name }, function(err, t) {
                if (!err && t) {
                    if (name) (t.name = name) && (t.dbName = name);
                    if (connection) t.dbconnection = connection;
                    fn(null, t);
                } else fn('Team not found', null);
            });
        } else fn('Organization not found', null);
    })
};

// register a organization's db connection
exports.OrgDbRegister = function(name, connectionString, fn) {
    var ocs = new OrgDbConnection({});
    ocs.name = name;
    ocs.dbconnection = connectionString;
    Connections.push(ocs);
    Connections.save(function(err, c) {
        if (!err) fn(null, c);
        else fn('Could not save', null);
    });
};

exports.dbconnect = dbconnect;

// takes either org or team name as input
dbconnect = function(org, team) {
    var goose = require('mongoose')
        , Schema = goose.Schema
        , ObjectId = Schema.ObjectId;

    if (org && team) {
        Connections.find({'orgs.name': org}, function(err, o) {
            if (!err && o) {
                o.find({'teams.name': team}, function(err, t) {
                    if (!err && t)
                        goose.connect(t.dbconnection + '/' + t.dbName);
                });
            }
        });
    }
    else if (org)
        Connections.find({'orgs.name': org}, function(err, o) {
            if (!err && o)
                goose.connect(o.dbconnection);
        });

    return [goose, Schema, ObjectId];
};

exports.useDatabase = function(goose, connection, name) {
    return goose.connect(connection + '/' + name);
};

// Initialize database connection
exports.dbinit = function() {
    mongoose.connect(settingsdb);
    var settings = new DbConnection({});
    settings.findOne(function(err, s) {
        if (!err && s) {
            Connections = s;
        }
        // to be executed only the __FIRST__ time
        else {
            Connections = new DbConnection({});
            Connections.save(function(err, s) {
                if (err) console.log('Could not create new database');
            });
        }
    });
};
