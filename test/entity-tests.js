
var Validator = require("jsonschema").Validator;
var v = new Validator();


// for user validation
exports.userValidationSchema = function() {
    var userProfileValidationSchema = {
        "id": "/userProfileValidationSchema",
        "type": "object",
        "properties": {
            "uid": { "type": "string" },
            "name": { "type": "string" },
            "email": { "type": "string" }
        }
    };
    v.addSchema(userProfileValidationSchema, "/userProfileValidationSchema");

    var passwordValidationSchema = {
        "id": "/passwordValidationSchema",
        "type": "object",
        "properties": {
            "hash": { "type": "string", "required": "true" }
        }
    };
    v.addSchema(passwordValidationSchema, '/passwordValidationSchema');

    var userPermissionValidationSchema = {
        "id": "/userPermissionValidationSchema",
        "type": "object",
        "properties": {
            "perm": {
                "type": "array",
                "items": "integer",
                "required": "true"
            },
            "admin": { "type": "integer", "required": "true" },
            "password": {
                "type": "array",
                "items": "$passwordValidationSchema",
                "required": "true"
            }
        }
    };
    v.addSchema(userPermissionValidationSchema, "/userPermissionValidationSchema");

    var userValidationSchema = {
        "id": "/userValidationSchema",
        "type": "object",
        "properties": {
            "uuid": { "type": "string", "required": "true" },
            "uid": { "type": "string", "required": "true" },
            "profile": { "$ref": "/userProfileValidationSchema", "required": "true" },
            "perm": { "$ref": "/userPermissionValidationSchema", "required": "true" },
            "children": {
                "type": "array",
                "items": "string",
                "required": "true"
            },
            "teams": {
                "type": "array",
                "items": "string",
                "required": "true"
            },
            "org": { "type": "string", "required": "true" }
        }
    };
    v.addSchema(userValidationSchema, "/userValidationSchema");

    return userValidationSchema;
};

exports.validate = function(obj, schema) {
    return !v.validate(obj, schema).errors.length;
};
