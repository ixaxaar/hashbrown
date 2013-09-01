
// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();

var framework = require('../../../framework');

// for the requests and responses, we reuse the framework's request-response structure
exports.requestValidatorSchema = framework.requestValidatorSchema;
exports.resultConstructorValidatorSchema = framework.resultConstructorValidatorSchema;

var createFeedSchema = {
    "id": "/createFeedSchema",
    "type": "object",
    "properties": {
        "content": { "type": "string", "required": "true" },
        "file": { "type": "string" }, //todo:  should we make it mandatory to upload files as well?
        "name": { "type": "string" },
        "location": { "type": "string" },
        "belongs": {
            "type": "array",
            "items": "string"
        },
        "mentions": {
            "type": "array",
            "items": "string"
        }
    },
    "private": { "type": "string" },
    "tags": {
        "type": "array",
        "items": "string"
    },
    "versioned": { "type": "boolean" },
    "associations": {
        "type": "array",
        "items": "object"
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
            "items": "string"
        }
    }
};
v.addSchema(addChildSchema, '/addChildSchema');
exports.addChildSchema = addChildSchema;

exports.validator = v;
exports.validate = function(object, schema) {
    return !v.validate(object, schema).errors.length;
};
