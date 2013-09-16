
// json schema validation - for request jsons
var Validator = require('jsonschema').Validator;
var v = new Validator();



var childFeedValidatorSchema = {
    "id": "/childFeedValidatorSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "created": { "type": "date", "required": "true" },
        "updated": { "type": "date", "required": "true" },
        "content": { "type": "date" }
    }
};
exports.childFeedValidatorSchema = childFeedValidatorSchema;

var feedValidationSchema = {
    "id": "/feedValidationSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "org": { "type": "string", "required": "true" },
        "created": { "type": "date", "required": "true" },
        "updated": { "type": "date", "required": "true" },
        "content": { "$ref": "/childFeedValidatorSchema" },
        "teams": {
            "type": "array",
            "items": { "type": "string"}
        },
        "receivers": {
            "type": "array",
            "items": { "type": "string"}
        },
        "children": {
            "type": "array",
            "items": { "type": "string"}
        },
        "broadcast": { "type": "boolean" }
    }
};
exports.feedValidationSchema = feedValidationSchema;



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
