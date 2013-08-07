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

var DbConnectionSchema = new Schema({
    local: { type: String, default: 'mongodb://localhost/winterfell' },
    orgs: []
});

exports.dbconnect = dbconnect;

dbconnect = function(org) {
    var oose = require('mongoose')
        , Schema = goose.Schema
        , ObjectId = Schema.ObjectId;

    if (!org)
        goose.connect(orgdb.local);


    return [goose, Schema, ObjectId];
}
