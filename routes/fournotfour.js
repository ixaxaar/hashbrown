
/*
 * 404 page
 */

module.exports = function(req, res, next){
    if (!next)
        res.send(404);
    else
        // allow other dynamically added routes to have a chance
        next();
};
