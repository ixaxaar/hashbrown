/**
 * User: Russi
 * Date: 9/7/13
 * Time: 9:22 PM
 */

var framework = require('../../framework');

var express = require('express');
var app = express();

//Configure this module's framework:
//each app.get can define handlers for GET requests handled
//by each sub-module
module.exports = function () {
    // the POST routes
    app.post(/.*/, framework.checkCredentials);

    var winterfell = require('./lib/');
    winterfell(app);

//    any intermediate GET routes go here

//    for everything else
    app.all("*", function(req, res) { return res.send(404); });

    return app;
}();

