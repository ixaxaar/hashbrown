/**
 * User: Russi
 * Date: 9/7/13
 * Time: 9:56 PM
 */


var winston = require('winston');
global.log = winston.log;

module.exports = function(){
    var timeline = require('./lib/timeline');
    timeline.init();
};
