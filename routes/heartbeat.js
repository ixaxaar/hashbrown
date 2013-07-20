/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 20/7/13
 * Time: 7:05 PM
 * To change this template use File | Settings | File Templates.
 */

/** Note: these are VERY costly operations, use at your descretion */

var nodemailer = require('nodemailer');

// todo; just a placeholder in case we are forgetting something
var notifyDevs = true;

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "hashbrownmailer@gmail.com",
        pass: "rashmisloth"
    }
});

// todo: this has to be changed, for security issues
var devEmails = ['hashbrownlog@gmail.com'];

exports.notifyServerPassword = function(hash, fn) {
    if (notifyDevs) {
        // for amazon, attach the AWS EC2 server info as well
        // http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs_custom_container.html
        var instanceID = '';

        smtpTransport.sendMail({
            from: "Hashbrown Mailer <hashbrownmailer@gmail.com>",
            to: devEmails.join(','),
            subject: "[Hashbrown] Instance UUID",
            text: "uuid:" + hash + "\ninstance ID: " + instanceID + "\n" + new Date
        }, function(error, response){
            if(error){
                console.log(error);
            }else{
                if (fn) fn();
            }
        });
    } else fn();
};

exports.notifyDevelopers = function(subj, errMsg, emails, fn) {
    if (notifyDevs) {
        smtpTransport.sendMail({
            from: "Hashbrown Notifier <hashbrownmailer@gmail.com>",
            to: emails.join(','),
            subject: "[Hashbrown] " + subj,
            text: subj + ": " + errMsg + "\n" + new Date
        }, function(error, response){
            if(error){
                console.log(error);
            }else{
                if (fn) fn();
            }
        });
    } else fn();
};

/** Signal handling - in case of serious errors, mail the devs! */

exports.turnMeOn = function(cleanup) {
    process.on( 'SIGINT', function() {
        console.log("gracefully shutting down from  SIGINT" );
        exports.notifyDevelopers("Error", "Received SIGINT, quitting", devEmails,
            function(){
                // some other closing procedures go here
                if (cleanup) cleanup();
                process.exit();
        });
    });

    process.on( 'SIGHUP', function() {
        console.log("gracefully shutting down from  SIGHUP");
        exports.notifyDevelopers("Error", "Received SIGHUP, quitting", devEmails,
            function(){
                // some other closing procedures go here
                if (cleanup) clanup();
                process.exit();
        });
    });

    /** Heartbeat */
    setInterval(function() {
        exports.notifyDevelopers("Info", "Heartbeat", devEmails, function(){
        });
    }, 500000);
};
