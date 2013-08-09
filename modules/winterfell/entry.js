/**
 * User: Russi
 * Date: 9/7/13
 * Time: 9:22 PM
 */

var mordor = require('../../routes/ODNSWIM');

var validateAccess = function(req, res, next) {

};


//Configure this module's routes:
//each app.get can define handlers for GET requests handled
//by each sub-module
module.exports = function () {
    var express = require('express');
    var app = express();

    app.get(/.*/, function (req, res) {
        res.send(req.path);
    });

    app.post(/.*/, require("./lib/feed"));

    return app;
}();

