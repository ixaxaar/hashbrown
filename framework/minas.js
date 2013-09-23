
/*
 * GET pages.
 */

var mordor = require('./ODNSWIM');

exports.tirith = function(req, res){
    res.render('home', { user: req.user, title: 'Home' });
};

exports.ithil = function(req, res){
    res.render('controls', { user: req.user, title: 'Controls' });
};

exports.arnor = function(req, res) {
    res.render('me', { user: req.user, title: 'Me' });
};
