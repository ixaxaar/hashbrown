
// this is more like an include file for whatever should be exported from /framework

var entity = require('./framework/entity');
var validation = require('./framework/validation');
var team = require('./framework/team');
var mordor = require('./framework/ODNSWIM');
var minas = require('./framework/minas');
var realm = require('./framework/realm');
var heartbeat = require('./framework/heartbeat');

exports.entity = entity;
exports.validation = validation;
exports.mordor = mordor;
exports.minas = minas;
exports.realm = realm;
exports.heartbeat = heartbeat;
exports.login = require('./framework/login');
exports.fournotfour = require('./framework/fournotfour');

// entity's exports
exports.findUserbyuid = entity.findByUsername;
exports.forEachUser = entity.forEachUser;

// validation's exports
exports.validator = validation.validator;
exports.userValidationSchema = validation.userValidationSchema;
exports.teamValidationSchema = validation.teamValidationSchema;
exports.requestValidatorSchema = validation.requestValidatorSchema;
exports.resultConstructorValidatorSchema = validation.resultConstructorValidatorSchema;

// mordor's exports
exports.permissions = mordor.Permission;
exports.checkCredentials = mordor.openBlackGate;

// heartbeat's exports
exports.notifyDevelopers = heartbeat.notifyDevelopers;
exports.heartbeatEnabled = heartbeat.report;

// minas exports - todo: remove this
exports.tirith = minas.tirith;
exports.ithil = minas.ithil;

// realm's exports
exports.narrowSea = realm.narrowSea;
exports.getKingdoms = realm.getKingdoms;
exports.isEnabled = realm.isEnabled;
exports.enableKingdom = realm.enableKingdom;
exports.disableKingdom = realm.disableKingdom;
exports.initKingdom = realm.initKingdom;
exports.enterKingdom = realm.enterKingdom;
exports.leaveKingdom = realm.leaveKingdom;
exports.createKingdom = realm.createKingdom;
exports.destroyKingdom = realm.destroyKingdom;
exports.syncExports = realm.syncExports;
exports.exposeAPI = realm.exposeAPI;
exports.unexposeAPI = realm.unexposeAPI;
exports.getAPI = realm.getAPI;


// team's exports
exports.findOrganization = team.findOrganization;
exports.findTeam = team.findTeam;
exports.getConnection = team.GetConnection;
exports.forEachOrg = team.forEachOrg;
exports.forEachTeam = team.forEachTeam;
