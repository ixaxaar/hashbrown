/**
 * User: Russi
 * Date: 9/7/13
 * Time: 9:16 PM
 */

backend = require(process.cwd() + '/routes/realm');

//Configure this module's routes:
//each app.get can define handlers for GET requests handled
//by each sub-module
module.exports = function () {
    var express = require('express');
    var app = express();

    app.get(/.*/, function (req, res) {
        var testapi = backend.getAPI('test', 'test');
        if (testapi) testapi('hahahahaha');
        res.send(req.path);
    })

    return app;
}();
