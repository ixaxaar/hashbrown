
/*
 * 404 page
 */

module.exports = function(req, res, next){
    if (!next)
        res.send(404);
    else
        // allow other dynamically added framework to have a chance
        next();
};
