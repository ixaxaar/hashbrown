/**
 * User: Russi
 * Date: 8/7/13
 * Time: 10:51 PM
 */

// gloooobal :O
exports.realm = require(process.cwd() + '/modules/modules.json');

// the 404 function
var narrowSea = function(req, res) {
    res.send(404);
}

// 404 default route number
var narrowSeaRoute = 0;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};


exports.narrowSea = function(app, func) {
    try {
        narrowSea = func;
    } catch (err) {
        console.log("Could not register 404 function");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    app.use(narrowSea);
}

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

_removeNarrowSea = function (app) {
    var i = 0;

    app.stack.forEach(function(stack) {
        if (stack.handle == narrowSea) {
            app.stack.remove(i);
        }
        i++;
    })
}

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


exports.enterKingdom = function(app, kingdomName){
    var ret = false;

    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                // add the routing middleware
                app.use('/' + kingdom.name,
                    require(process.cwd() + '/modules/' + kingdom.dirName + '/' + kingdom.scripts.entry));
                ret = true;
            }
        })
    } catch (err) {
        console.log("Error occured in loading entry");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}

exports.leaveKingdom = function(app, kingdomName){
    var ret = false;
    var i = 0;

    try {
        realm.kingdoms.forEach(function(kingdom) {
            if (kingdom.name == kingdomName) {
                // execute the module's custom uninit routine, allow it to exit cleanly
                require(process.cwd() + '/modules/' + kingdom.dirName + '/' + kingdom.scripts.uninit).uninit();

                // remove this module's route
                app.stack.forEach(function(stack){
                    console.log(stack.route);
                    if (stack.route == ('/' + kingdom.name)){
                        app.stack.remove(i);
                        ret = true;
                    }
                    i++;
                })
            }
        })
    } catch (err) {
        console.log("Error occured in un-initializing module's routes");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}


exports.createKingdom = function(app, rootDir){
    var ret = false;

    try {
        var fs = require('fs');
        rootDir = process.cwd() + '/modules/' + rootDir;
        var rootJson = rootDir + '/package.json';

        if (fs.existsSync(rootDir)) {
            if (fs.existsSync(rootJson)) {
                var newPackage = require(rootJson);

                // check if the package already exists, if it does not, add the
                // new json part to modules.json
                if (function () {
                    var evl = false;
                    realm.kingdoms.forEach(function(kingdom) {
                        if (kingdom.name == newPackage.name) evl = true;
                    });
                    return evl;
                }() == false) {
                    realm.kingdoms.push(newPackage);
                    console.log('pushed');
                    this.syncExports(app, realm);
                    ret = true;
                }
            }
        }
    } catch (err) {
        console.log("Could not create a new kingdom");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}


exports.destroyKingdom = function(app, kingdomName){
    var ret = false;
    var i = 0;

    try {
        // leave the kingdom and delete it
        if (this.leaveKingdom(app, kingdomName))
            realm.kingdoms.forEach(function (kingdom) {
                if (kingdom.name == kingdomName) {
                    realm.kingdoms.remove(i);
                    exports.syncExports(app, realm);
                    console.log('Removed');
                    ret = true;
                }
                i++;
            });

        // todo: delete the folder as well?
    } catch (err) {
        console.log("Could not destroy kingdom");
        if ('development' == app.get('env')) {
            throw err;
        }
    }

    return ret;
}


exports.syncExports = function(app, jsonVariable, jsonFile){
    if (!jsonFile) {
        jsonFile = process.cwd() + '/modules/modules.json';
    }
    if (!jsonVariable) {
        jsonVariable = realm;
    }
    try{
        var fs = require("fs");
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

exports.ExposedAPIs = [];

exports.exposeAPI = function(apiName, apiModule, apiHandle){
    var ret = false;

    try {
        //check if api name is taken
        if (function() {
            this.ExposedAPIs.forEach(function(api) {
                if ((api.name == apiName) && (api.module == apiModule)) return false;
            });
            return true;
        }) {
            // add the api
            this.ExposedAPIs[this.ExposedAPIs.length] = {
                'name'      : apiName,
                'module'    : apiModule,
                'handle'    : apiHandle
            };
            ret = true;
        }
    } catch (err) {
        console.log("Could not expose API");
    }

    return ret;
}

exports.unexposeAPI = function(apiName, apiModule){
    var ret = false;
    var i = 0;

    try {
        this.ExposedAPIs.forEach(function(api) {
            if ((apiName == api.name) && (apiModule == api.module)) {
                this.ExposedAPIs.remove(i);
                ret = true;
            }
            i++;
        })
    } catch (err) {
        console.log("Could not unexpose API");
    }

    return ret;
}

exports.getAPI = function(apiName, apiModule){
    var ret = false;

    try {
            this.ExposedAPIs.forEach(function(api) {
                if ((apiName == api.name) && (apiModule == api.module)) ret = api.handle;
            })
    } catch (err) {
        console.log("Could not get API handle");
    }

    return ret;
}
