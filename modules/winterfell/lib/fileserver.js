/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 21/8/13
 * Time: 5:16 PM
 * To change this template use File | Settings | File Templates.
 */

// schema library
var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
var uuid = require('node-uuid');





var setupVersioning = function(schema, field) {
    schema.post('save',commit, function(doc) {
        var history = doc.connection.model('ContentHistorySchema');
        history.find({field: doc[field]}, function(err, his) {
            // ahh so, we already have history of this document
            if (obj) {

                // commit as a version
                if (commit) {
                    var _his = new __ContentHistory({ content: doc })
                }
                // this is a hanging version
                else {

                }
            }
        })
    });
};
module.exports = setupVersioning;



