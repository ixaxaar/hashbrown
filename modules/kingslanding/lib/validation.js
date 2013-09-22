
// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

var framework = require('../../../framework');

// for the requests and responses, we reuse the framework's request-response structure
exports.requestValidatorSchema = framework.requestValidatorSchema;
exports.resultConstructorValidatorSchema = framework.resultConstructorValidatorSchema;


/////////////////////////////////////////
//        Council Request Validations
/////////////////////////////////////////

var newCouncilValidatorSchema = {
    "id": "/newCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "agenda": { "type": "string", "required": "true" }
    }
};
exports.newCouncilValidatorSchema = newCouncilValidatorSchema;

var inviteCouncilValidatorSchema = {
    "id": "/inviteCouncilValidatorSchema",
        "type": "object",
        "properties": {
        "uuid": { "type": "string", "required": "true" },
        "user": { "type": "string", "required": "true" }
    }
};
exports.inviteCouncilValidatorSchema = inviteCouncilValidatorSchema;

var commentCouncilValidatorSchema = {
    "id": "/commentCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "comment": { "type": "string", "required": "true" }
    }
};
exports.commentCouncilValidatorSchema = commentCouncilValidatorSchema;

var uncommentCouncilValidatorSchema = {
    "id": "/uncommentCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "commentuuid": { "type": "string", "required": "true" }
    }
};
exports.uncommentCouncilValidatorSchema = uncommentCouncilValidatorSchema;

var upvoteCouncilValidatorSchema = {
    "id": "/upvoteCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "commentuuid": { "type": "string", "required": "true" }
    }
};
exports.upvoteCouncilValidatorSchema = upvoteCouncilValidatorSchema;

var downvoteCouncilValidatorSchema = {
    "id": "/downvoteCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "commentuuid": { "type": "string", "required": "true" }
    }
};
exports.downvoteCouncilValidatorSchema = downvoteCouncilValidatorSchema;

var conclusionCouncilValidatorSchema = {
    "id": "/upvoteCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "commentuuid": { "type": "string", "required": "true" },
        "conclusion": { "type": "string", "required": "true" }
    }
};
exports.conclusionCouncilValidatorSchema = conclusionCouncilValidatorSchema;

var destroyCouncilValidatorSchema = {
    "id": "/destroyCouncilValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" }
    }
};
exports.destroyCouncilValidatorSchema = destroyCouncilValidatorSchema;


/////////////////////////////////////////
//        Tale Request Validations
/////////////////////////////////////////

var createTaleValidatorSchema = {
    "id": "/createTaleValidatorSchema",
    "type": "object",
    "properties": {
        "tale": { "type": "string", "required": "true" }
    }
};
exports.createTaleValidatorSchema = createTaleValidatorSchema;

var destroyTaleValidatorSchema = {
    "id": "/destroyTaleValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" }
    }
};
exports.destroyTaleValidatorSchema = destroyTaleValidatorSchema;

var sayTaleValidatorSchema = {
    "id": "/sayTaleValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "saying": { "type": "string", "required": "true" }
    }
};
exports.sayTaleValidatorSchema = sayTaleValidatorSchema;

var unsayTaleValidatorSchema = {
    "id": "/unsayTaleValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "sayinguuid": { "type": "string", "required": "true" }
    }
};
exports.unsayTaleValidatorSchema = unsayTaleValidatorSchema;

var cheerTaleValidatorSchema = {
    "id": "/cheerTaleValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "sayinguuid": { "type": "string" }
    }
};
exports.cheerTaleValidatorSchema = cheerTaleValidatorSchema;

var uncheerTaleValidatorSchema = {
    "id": "/uncheerTaleValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "sayinguuid": { "type": "string" }
    }
};
exports.uncheerTaleValidatorSchema = uncheerTaleValidatorSchema;



exports.validator = v;
exports.validate = function(obj, schema) {
    if (obj) {
        var valid = !v.validate(obj, schema).errors.length;
        if (valid === false) {
            console.log(v.validate(obj, schema).errors);
        }
        return valid;
    }
    else {
        log('warning', 'Object passed for validation was null');
        return 1;
    }
};
