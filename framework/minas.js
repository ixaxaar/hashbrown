
/*
 * GET home page.
 */

var mordor = require('./ODNSWIM');

exports.tirith = function(req, res){
    res.render('home', { user: req.user, title: 'Home' });
};

exports.ithil = function(req, res){
    res.render('controls', { user: req.user, title: 'Controls' });
};
