/**
 * User: Russi
 * Date: 13/7/13
 * Time: 8:55 PM
 */

var RouteStack = [];

function route(app) {
    this.app = app;
    this.routetable = [];
}

function routeTableEntry(route, handler) {
    this.route = route;
    this.regexp = new RegExp(route);
    this.handler = handler;
}

exports.createRoutingTable = function(app) {
    var route = new route(app);
    RouteStack.push(route);
}

_searchRoutingTable = function(table, route){
    table.forEach(function (e) {
        return (e.route.toString() == route.toString()) ? e.handler : null;
    })
}

_searchRoute = function(app, route) {
    RouteStack.forEach(function (r) {
        return (r.app == app) ? (_searchRoutingTable(r.routetable, route)) : null;
    })
}

exports.createRoute = function(app, routePath) {

}
