
var Validator = require('jsonschema').Validator;
var v = new Validator();


/////////////////////////////////////////
//        User Validations
/////////////////////////////////////////

var userProfileValidationSchema = {
    "id": "/userProfileValidationSchema",
    "type": "object",
    "properties": {
        "uid": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string" }
    }
};

exports.userProfileValidationSchema = userProfileValidationSchema;

var passwordValidationSchema = {
    "id": "/passwordValidationSchema",
    "type": "object",
    "properties": {
        "hash": { "type": "string", "required": "true" }
    }
};

var userPermissionValidationSchema = {
    "id": "/userPermissionValidationSchema",
    "type": "object",
    "properties": {
        "perm": {
            "type": "array",
            "items": { "type": "integer" },
            "required": "true"
        },
        "admin": { "type": "integer", "required": "true" },
        "password": {
            "type": "array",
            "items": { "type": "/passwordValidationSchema" },
            "required": "true"
        }
    }
};

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
            "items": { "type": "string" },
            "required": "true"
        },
        "teams": {
            "type": "array",
            "items": { "type": "string"},
            "required": "true"
        },
        "org": { "type": "string", "required": "true" }
    }
};

v.addSchema(userProfileValidationSchema, '/userProfileValidationSchema');
v.addSchema(passwordValidationSchema, '/passwordValidationSchema');
v.addSchema(userPermissionValidationSchema, '/userPermissionValidationSchema');

exports.passwordValidationSchema = passwordValidationSchema;
exports.userPermissionValidationSchema = userPermissionValidationSchema;
exports.userValidationSchema = userValidationSchema;


/////////////////////////////////////////
//        Response Validations
/////////////////////////////////////////

var resultConstructorValidatorSchema = {
    "id": "/resultConstructorValidatorSchema",
    "type": "object",
    "properties": {
        "request": { "type": "string", "required": "true" },
        "uuid": { "type": "string", "required": "true" },
        "success": { "type": "boolean", "required": "true" },
        "msg": { "anyOf": [
                {
                    "description": "object"
                },
                {
                    "description": "string"
                }
            ]
        }
    }
};

var requestValidatorSchema = {
    "id": "/requestValidatorSchema",
    "type": "object",
    "properties": {
        "request": { "type": "string", "required": "true" },
        "uuid": { "type": "string", "required": "true" },
        "body": { "type": "object" } // not mandatory
    }
};

v.addSchema(resultConstructorValidatorSchema, "/resultConstructorValidatorSchema");
v.addSchema(requestValidatorSchema, "/requestValidatorSchema");

exports.resultConstructorValidatorSchema = resultConstructorValidatorSchema;
exports.requestValidatorSchema = requestValidatorSchema;


/////////////////////////////////////////
//        Entity Validations
/////////////////////////////////////////

var addUserValidationSchema = {
    "id": "/addUserValidationSchema",
    "type": "object",
    "properties": {
        "username" : { "type": "string", "required": "true" },
        "password" : { "type": "string", "required": "true" }
    }
};

var deleteUserValidationSchema = {
    "id": "/deleteUserValidationSchema",
    "type": "object",
    "properties": {
        "username" : { "type": "string", "required": "true" }
    }
};

var promoteUserValidationSchema = {
    "id": "/promoteUserValidationSchema",
    "type": "object",
    "properties": {
        "username" : { "type": "string" , "required": "true" },
        "permission" : { "type": "string", "required": "true" }
    }
};

var grantUserValidationSchema = {
    "id": "/grantUserValidationSchema",
    "type": "object",
    "properties": {
        "username" : { "type": "string" , "required": "true" },
        "permission" : { "type": "string", "required": "true" }
    }
};

var revokeUserValidationSchema = {
    "id": "/revokeUserValidationSchema",
    "type": "object",
    "properties": {
        "username" : { "type": "string" , "required": "true" },
        "permission" : { "type": "string", "required": "true" }
    }
};

var reassociateUserValidationSchema = {
    "id": "/reassociateUserValidationSchema",
    "type": "object",
    "properties": {
        "username" : { "type": "string" , "required": "true" },
        "permission" : { "type": "string", "required": "true" }
    }
};

v.addSchema(addUserValidationSchema, "/addUserValidationSchema");
v.addSchema(deleteUserValidationSchema, "/deleteUserValidationSchema");
v.addSchema(promoteUserValidationSchema, "/promoteUserValidationSchema");
v.addSchema(grantUserValidationSchema, "/grantUserValidationSchema");
v.addSchema(revokeUserValidationSchema, "/revokeUserValidationSchema");
v.addSchema(reassociateUserValidationSchema, "/reassociateUserValidationSchema");

exports.addUserValidationSchema = addUserValidationSchema;
exports.deleteUserValidationSchema = deleteUserValidationSchema;
exports.promoteUserValidationSchema = promoteUserValidationSchema;
exports.grantUserValidationSchema = grantUserValidationSchema;
exports.revokeUserValidationSchema = revokeUserValidationSchema;
exports.reassociateUserValidationSchema = reassociateUserValidationSchema;



/////////////////////////////////////////
//        Team Validations
/////////////////////////////////////////

var createTeamSchema = {
    "id": "/createTeamSchema",
    "type": "object",
    "properties": {
        "parent": { "type": "string" },
        "name": { "type": "string" },
        "dbName": { "type": "string" },
        "dbConnection": { "type": "string" }
    }
};

var addUserSchema = {
    "id": "/addUserSchema",
    "type": "object",
    "properties": {
        "name": { "type": "string", "required": true },
        "team": { "type": "string", "required": true }
    }
};

var godCreatesAnOrgSchema  = {
    "id": "/godCreatesAnOrgSchema",
    "type": "object",
    "properties": {
        "name": { "type": "string", "required": true },
        "dbConnection": { "type": "string", "required": true },
        "dbName": { "type": "string", "required": true },
        "hash": { "type": "string", "required": true },
        "kingdoms": {
            "type": "array",
            "items": { "type": "string" }
        }
    }
};

var changeTeamOwnerValidationSchema = {
    "id": "/changeTeamOwnerValidationSchema",
    "type": "object",
    "properties": {
        "name": { "type": "string" },
        "team": { "type": "string" }
    }
};

var teamValidationSchema = {
    "id": "/teamValidationSchema",
    "type": "object",
    "properties": {
        "uuid": { "type": "string", "required": "true" },
        "owner": { "type": "string", "required": "true" },
        "name": { "type": "string", "required": "true" },
        "orgName": { "type": "string", "required": "true" },
        "dbConnection": { "type": "string", "required": "true" },
        "dbName": { "type": "string", "required": "true" },
        "users": {
            "type": "array",
            "items": { "type": "string" }
        },
        "children": {
            "type": "array",
            "items": { "type": "string" }
        }
    }
};


v.addSchema(changeTeamOwnerValidationSchema, '/changeTeamOwnerValidationSchema');
v.addSchema(teamValidationSchema, '/teamValidationSchema');
v.addSchema(createTeamSchema, '/createTeamSchema');
v.addSchema(addUserSchema, '/addUserSchema');
v.addSchema(godCreatesAnOrgSchema, '/godCreatesAnOrgSchema');

exports.changeTeamOwnerValidationSchema = changeTeamOwnerValidationSchema;
exports.createTeamSchema = createTeamSchema;
exports.addUserSchema = addUserSchema;
exports.godCreatesAnOrgSchema = godCreatesAnOrgSchema;
exports.teamValidationSchema = teamValidationSchema;


exports.validator = v;
exports.validate = function(obj, schema) {
    if (obj) {
        var valid = !v.validate(obj, schema).errors.length;
        if (valid === false) {
            console.log(v.validate(obj, schema).errors.toString());
        }
        return valid;
    }
    else {
        log('warning', 'Object passed for validation was null');
        return 1;
    }
};