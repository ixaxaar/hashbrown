
var assert = require("assert");

var entity = require("./entity");
var User = entity.User;

var schemas = require('./entity-tests');
var validate = schemas.validate;

var GOD = null;

before(function(done) {
    var user = new User({});

    user.addUser(null, 'god', '123', function(err, g) {
        if (!err) {
            if(validate(g, schemas.userValidationSchema)) {
                GOD = g;
                console.log(JSON.stringify(g, null, 2));
                done();
            }
            else done('could not validate');
        }
        else done(err);
    });
});

var testuser = null;

describe('user', function() {
    describe('#addUser', function() {

        it('should create a user in db', function(done) {
            var user = new User({});
            user.addUser(GOD, 'user1', '123', function(err, u) {
                if (!err) {
                    if(validate(u, schemas.userValidationSchema)) {
                        console.log(JSON.stringify(u, null, 2));
                        testuser = u;
                        done();
                    }
                    else done('could not validate');
                }
                else done(err);
            })
        });
    }); 
});


describe('user', function() {
    describe('#grant', function() {
        console.log(testuser)
        it('should grant user permission', function(done) {
            testuser.grant(GOD, 'winterfell', 'none', function(err, u) {
                if (!err) {
                    if(validate(u, schemas.userValidationSchema)) {
                        console.log(JSON.stringify(u, null, 2));
                        done();
                    }
                    else done('could not validate');
                }
            });
        });
    });
});




// describe('#grant', function() {
//         it('should grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'access', function(err, u) {
//                 if (!err) {
//                     if(validate(u, schemas.userValidationSchema)) {
//                         console.log(JSON.stringify(u, null, 2));
//                         done();
//                     }
//                     else done('could not validate');
//                 }
//             });
//         });
//     });

//     describe('#grant', function() {
//         it('should grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'modify', function(err, u) {
//                 if (!err) {
//                     if(validate(u, schemas.userValidationSchema)) {
//                         console.log(JSON.stringify(u, null, 2));
//                         done();
//                     }
//                     else done('could not validate');
//                 }
//             });
//         });
//     });

//     describe('#grant', function() {
//         it('should grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'mgr', function(err, u) {
//                 if (!err) {
//                     if(validate(u, schemas.userValidationSchema)) {
//                         console.log(JSON.stringify(u, null, 2));
//                         done();
//                     }
//                     else done('could not validate');
//                 }
//             });
//         });
//     });

//     describe('#grant', function() {
//         it('should grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'admin', function(err, u) {
//                 if (!err) {
//                     if(validate(u, schemas.userValidationSchema)) {
//                         console.log(JSON.stringify(u, null, 2));
//                         done();
//                     }
//                     else done('could not validate');
//                 }
//             });
//         });
//     });

//     describe('#grant', function() {
//         it('should grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'org', function(err, u) {
//                 if (!err) {
//                     if(validate(u, schemas.userValidationSchema)) {
//                         console.log(JSON.stringify(u, null, 2));
//                         done();
//                     }
//                     else done('could not validate');
//                 }
//             });
//         });
//     });

//     describe('#grant', function() {
//         it('should not grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'blah', function(err, u) {
//                 if (err) {
//                     done();
//                 }
//                 else done('failed');
//             });
//         });
//     });

//     describe('#grant', function() {
//         it('should not grant user permission', function(done) {
//             testuser.grant(GOD, 'winterfell', 'god', function(err, u) {
//                 if (err) {
//                     done();
//                 }
//                 else done('failed');
//             });
//         });
//     });















