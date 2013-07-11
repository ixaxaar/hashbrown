/**
 * User: Russi
 * Date: 8/7/13
 * Time: 10:51 PM
 */

/**
 * @function enableKingdom
 * @description Enable a module / kingdom
 * @param kingdom
 */
exports.enableKingdom = function(kingdom){
    try{
        kingdom.enabled = true;
    } catch (err) {
        console.log("Error occured while enabling module");
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    return true;
}

/**
 * @function disableKingdom
 * @description Disable a module / kingdom
 * @param kingdom
 * @returns {boolean}
 */
exports.disableKingdom = function(kingdom){
    try{
        kingdom.enabled = false;
    } catch (err) {
        console.log("Error occured while enabling module");
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    return true;
}


/**
 * @function initKingdom
 * @description Initialize a module / kingdom
 * @param kingdom
 * @returns {boolean}
 */
exports.initKingdom = function(kingdom){
    try {
        kingdom.init();
    } catch (err) {
        console.log("Error occured in initializing module %s", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    return true;
}

/**
 * @function enterKingdom
 * @description Create a module / kingdom's routes
 * @param kingdom
 * @param app
 * @returns {boolean}
 */
exports.enterKingdom = function(kingdom, app){
    try {
        app.use('/' + kingdom.name,
            require('./modules/' + kingdom.dirName + '/' + kingdom.scripts.entry)); // TODO: from present dir?
    } catch (err) {
        console.log("Error occured in loading %s's entry", kingdom.name);
        if ('development' == app.get('env')) {
            throw err;
        }
        return false;
    }

    return true;
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
        kingdom.exit();
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
 * @function syncExports
 * @description Sync provided JSON file with provided javascript variable
 * @param jsonVariable
 * @param jsonFile
 */
exports.syncExports = function(jsonVariable, jsonFile){

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

exports.gethandleofAPI = function(apiName, apiModule){
    //
}
