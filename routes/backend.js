/**
 * User: Russi
 * Date: 8/7/13
 * Time: 10:51 PM
 */

// gloooobal :O
var realm = require(process.cwd() + '/modules/modules.json');


exports.getKingdoms = function(app) {
    try {
        var kingdoms = [];
        realm.kingdoms.forEach(function(kingdom) {
            kingdoms.push(kingdom.name);
        })
        return kingdoms;
    } catch (err) {
        console.log("Error occured while fetching modules.json");
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }
}


exports.isEnabled = function(app, kingdomName) {
    var ret = false;
    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                if (kingdom.enabled == true) {
                    ret = true;
                }
            }
        })
    } catch (err) {
        console.log("Error occured while enabling module");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}

/**
 * @function enableKingdom
 * @description Enable a module / kingdom
 * @param app
 * @param modules
 * @param kingdom
 * @returns {boolean}
 */
exports.enableKingdom = function(app, kingdomName) {
    var ret = false;
    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                kingdom.enabled = true;
                ret = true;
            }
        })
        this.syncExports(app, realm);
    } catch (err) {
        console.log("Error occured while enabling module");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}

/**
 * @function disableKingdom
 * @description Disable a module / kingdom
 * @param kingdom
 * @returns {boolean}
 */
exports.disableKingdom = function(app, kingdomName){
    var ret = false;
    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                kingdom.enabled = false;
                this.leaveKingdom(app, kingdomName);
                ret = true;
            }
        })
        this.syncExports(app, realm);
    } catch (err) {
        console.log("Error occured while disabling module");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}


/**
 * @function initKingdom
 * @description Initialize a module / kingdom
 * @param kingdom
 * @returns {boolean}
 */
exports.initKingdom = function(app, kingdomName){
    var ret = false;
    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                var modInit = require(process.cwd() + '/modules/' + kingdom.dirName + '/' + kingdom.scripts.init);
                modInit.init();
                ret = true;
            }
        })
    } catch (err) {
        console.log("Error occured in initializing module");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}

/**
 * @function enterKingdom
 * @description Create a module / kingdom's routes
 * @param kingdom
 * @param app
 * @returns {boolean}
 */
exports.enterKingdom = function(app, kingdomName){
    var ret = false;
    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                app.use('/' + kingdom.name,
                    require(process.cwd() + '/modules/' + kingdom.dirName + '/' + kingdom.scripts.entry));
                ret = true;
            }
        })
    } catch (err) {
        console.log("Error occured in loading %s's entry", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}

/**
 * @function leaveKingdom
 * @description Uninit a module / kingdom's routes
 * @param kingdom
 * @param app
 * @returns {boolean}
 */
exports.leaveKingdom = function(kingdom, app){
    // Un-define all routing rules that might have been specified by the module
    try {
        app.use('/' + kingdom.name, function(req, res) {
            res.send(404);
        });
    } catch (err) {
        console.log("Error occured in un-initializing module %s's routes", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    // execute the module's custom uninit routine, allow it to exit cleanly
    try {
        kingdom.uninit();
    } catch (err) {
        console.log("Error occured in un-initializing module %s", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    return true;
}

/**
 * @function createKingdom
 * @description Create a new kingdom - install a module
 * @param rootDir
 * @param modules
 */
exports.createKingdom = function(rootDir, modules){
    //
}

/**
 * @function destroyKingdom
 * @description Destroy a new kingdom - uninstall a module
 * @param kingdom
 * @param modules
 */
exports.destroyKingdom = function(kingdom, modules){
    //
}


/**
 * @description Sync (blocking) provided JSON file with provided javascript variable
 * @param jsonVariable
 * @param jsonFile
 * @returns {boolean}
 */
exports.syncExports = function(app, jsonVariable, jsonFile){
    if (!jsonFile) {
        jsonFile = process.cwd() + '/modules/modules.json';
    }

    try{
        fs = require("fs");
        fs.writeFileSync(jsonFile, JSON.stringify(jsonVariable, null, 2));
    } catch (err) {
        console.log("Could not update modules.json");
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    return true;
}

exports.exposeAPI = function(apiName, apiModule, funcHandle){
    //
}

exports.unexposeAPI = function(apiName, apiModule){
    //
}

exports.queryAPI = function(apiName){
//    return apiModule;
}

exports.getAPI = function(apiName, apiModule){
    //
}
