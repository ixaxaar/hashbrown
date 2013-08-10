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
//   Organization Schema
////////////////////////////////

var OrganizationSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    name: String,
    dbConnection: String,
    dbName: { type: String, default: uuid.v4() },
    teams: [String]
});
TeamSchema.index({ name: 1 });

// this has to be inside cause every schema is mapped to its mongoose connection
OrganizationSchema.methods.Connect = function(fn) {
    if (this.dbconnection) {
        var goose = require('mongoose')
            , gooseSchema = goose.Schema
            , gooseObjectId = gooseSchema.ObjectId;

        ////////////////////////////////
        //   Team Schema
        ////////////////////////////////

        var TeamSchema = new gooseSchema({
            uuid: { type: String, default: uuid.v4() },
            name: String,
            orgname: String,
            dbconnection: String,
            dbName: { type: String, default: uuid.v4() },
            teams: [String]
        });
        TeamSchema.index({ name: 1 , orgname: 1 });
        var team = mongoose.model("TeamSchema", TeamSchema);
        team.ensureIndexes(function(err)
            { if (err) consolelog("ensureInedxes failed") } );

        // create a connection to this organization's database
        goose.createConnection(this.dbconnection);

        return (fn) && fn(null, goose, team);
    } else return (fn) && fn('No database connection provided');
};

var Organization = mongoose.model("OrganizationSchema", OrganizationSchema);
Organization.ensureIndexes( function(err) { if (err) consolelog("ensureInedxes failed") } );

////////////////////////////////
//   Winterfell Schema
////////////////////////////////

var WinterfellSchema = new Schema({
    local: { type: String, default: settingsdb },
    orgs: [OrganizationSchema]
});
var Winterfell = mongoose.model("WinterfellSchema", WinterfellSchema);

////////////////////////////////
//   Winterfell Constructor
////////////////////////////////

var BirthofAStark = function() {
    //
};
module.exports = BirthofAStark;

var connections = {};

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
           var ret = true;
           var org = new Organization({});
           (json.name) ? (org.name = json.name) : (ret = false);
           (json.dbconnection) ? (org.dbConnection = json.dbConnection) : (ret = false);
           (json.dbname) ? (org.dbName = json.dbname) : (ret = false);
           if (ret) org.save(function(err, so) {
               if (!err && so)
               // connect to the organization's database
               org.Connect(function(err, goose, team) {
                   if (!err && goose && team) {
                       connections.push({
                           "name": org.name,
                           "mongoose": goose,
                           "team": team
                       });
                       fn(null, so);
                   } else fn('Could not connect to organizations database', so);
               });
               else fn("Could not save organization", null);
           });
           else fn("Invalid request", null);
       } else fn('Organization alrady exists', null);
    });
};


/**
 * json request structure:
 * {
 *  name: String
 * }
 */
var DisconnectOrganization = function(json, fn) {
    Organization.findOne({ name: json.name }, function(err, o) {
        if (!err && o) {
            var ret = false;
            var ctr = 0;
            connections.forEach(function(c) {
                if (c.name == o.name) {
                    if (c.goose) {
                        c.goose.connection.close();
                        ret = true;
                    }
                    if (ret) connections.remove(ctr) && fn(null);
                } else fn('Could not close connection');
                ctr++;
            });
        } else fn('Could not find organization');
    });
};
