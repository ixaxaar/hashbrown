
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

exports.anor = function(req, res) {
    res.render('me', { user: req.user, title: 'Me' });
};

exports.morgul = function(req, res) {
    // for file uploads
    if (req.files) {
        console.log(req.files);
    }
    else res.send(503);
};
