/**
 * User: Russi
 * Date: 9/7/13
 * Time: 9:16 PM
 */

var express = require('express');

// global variables for interaction with framework
var app;
// todo: auto-remove this
var kingdom;

var backend = require(process.cwd() + '/routes/realm');
var realm = require(process.cwd() + '/routes/realm');
var mordor = require(process.cwd() + '/routes/ODNSWIM');
var entity = require(process.cwd() + '/routes/entity');

//Configure this module's routes:
//each app.get can define handlers for GET requests handled
//by each sub-module
module.exports = function () {
    app = express();
    kingdom = new entity.Kingdom(require(process.cwd() +
        '/modules/kingslanding/' + 'package.json'), 2);

    app.get(/.*/,function (req, res) {
        checkAccess(req, res, function() {
            var testapi = backend.getAPI('test', 'test');
            if (testapi) testapi('hahahahaha');
            res.send(req.path);
        });
    });

    return app;
}();


// An example for access control to modules
var checkAccess = function(req, res, fn) {
    if (req.isAuthenticated() &&
        mordor.Permission.hasPermission(req.user, kingdom, mordor.Permission.access))
        {return fn();}
    res.redirect('/login');
};
