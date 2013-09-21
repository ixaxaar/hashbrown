
/*
 * GET home page.
 */

var mordor = require('./ODNSWIM');

exports.tirith = function(req, res){
    res.render('home', { user: req.user, title: 'Home' });
};

exports.ithil = function(req, res){
    if (req.user.uuid >= mordor.Permission.admin)
        res.render('home', { user: req.user, title: 'Home' });
    else
        res.render('home', { user: req.user, title: 'Home' });
};
