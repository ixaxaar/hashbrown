/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 19/7/13
 * Time: 3:25 PM
 * To change this template use File | Settings | File Templates.
 */


/*
 * GET home page.
 */

exports.login = function(req, res){
    res.render('home', { title: 'Login' });
};