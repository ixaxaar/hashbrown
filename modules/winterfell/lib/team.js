

var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

var uuid = require('node-uuid');

mongoose.connect('mongodb://localhost/teams');

var TeamSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    name: String,
    teams: [String]
});
var Team = mongoose.model("TeamSchema", TeamSchema);

var OrganizationSchema = new Schema({
    uuid: { type: String, default: uuid.v4() },
    name: String,
    teams: [String]
});
var Organization = mongoose.model("OrganizationSchema", OrganizationSchema);

/**
 * json request structure:
 * {
 *  name: String,
 *  dbConnection: String,
 * }
 */
exports.CreateOrganization = function(user, jsonRequest, fn) {
    var org = new Organization({});
    var ret = true;
    jsonRequest.name ? (org.name = jsonRequest.name) : ret = false;
};
