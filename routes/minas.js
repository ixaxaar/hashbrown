
/*
 * GET home page.
 */

var mordor = require('./ODNSWIM');

exports.tirith = function(req, res){
    res.render('home', { title: 'Tirith' + req.user.uuid });
};

exports.ithil = function(req, res){
    if (req.user.uuid >= mordor.Permission.admin)
        res.render('home', { title: 'Ithil' + req.user.uuid });
    else
        res.render('home', { title: 'Ithil' + req.user.uuid + 'as a user' });
};
