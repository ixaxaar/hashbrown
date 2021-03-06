
// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

var framework = require('../../../framework');

// for the requests and responses, we reuse the framework's request-response structure
exports.requestValidatorSchema = framework.requestValidatorSchema;
exports.resultConstructorValidatorSchema = framework.resultConstructorValidatorSchema;

/////////////////////////////////////////
//        Feed Request Validations
/////////////////////////////////////////

var createFeedSchema = {
    "id": "/createFeedSchema",
    "type": "object",
    "properties": {
        "content": { "type": "string", "required": "true" },
        "file": { "type": "string" }, //todo:  should we make it mandatory to upload files as well?
        "name": { "type": "string" },
        "mime": { "type": "string" },
        "location": { "type": "string" },
        "belongs": {
            "type": "array",
            "items": { "type": "string"}
        },
        "mentions": {
            "type": "array",
            "items": { "type": "string"}
        },
        "private": { "type": "boolean" },
        "tags": {
            "type": "array",
            "items": { "type": "string"}
        },
        "versioned": { "type": "boolean" },
        "associations": {
            "type": "array",
            "items": { "type": "string"}
        },
        "historyId": { "type": "string" },
        "broadcast": { "type": "boolean" }
    }
};
v.addSchema(createFeedSchema, '/createFeedSchema');
exports.createFeedSchema = createFeedSchema;

var addChildSchema = {
    "id": "/addChildSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "content": { "type": "string", "required": "true" },
        "mentions": {
            "type": "array",
            "items": { "type": "string" }
        }
    }
};
v.addSchema(addChildSchema, '/addChildSchema');
exports.addChildSchema = addChildSchema;

var removeChildValidationSchema = {
    "id": "/removeChildValidationSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "childuuid": { "type": "string", "required": "true" }
    }
};
v.addSchema(removeChildValidationSchema, '/removeChildValidationSchema');
exports.removeChildValidationSchema = removeChildValidationSchema;

var removeFeedValidationSchema = {
    "id": "/removeFeedValidationSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" }
    }
};
v.addSchema(removeFeedValidationSchema, '/removeFeedValidationSchema');
exports.removeFeedValidationSchema = removeFeedValidationSchema;

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

