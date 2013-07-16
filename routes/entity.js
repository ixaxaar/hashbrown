/**
 * Created with JetBrains WebStorm.
 * User: ixaxaar
 * Date: 16/7/13
 * Time: 11:45 PM
 * To change this template use File | Settings | File Templates.
 */

var mordor = require('ODNSWIM');
uuid = require('node-uuid');

var User = function(parent, hash) {
    this.uuid       =   uuid.v4();
    this.data       =   new userData();
    this.perm       =   new mordor.userPermission(this.uuid, hash);
    this.parent     =   parent;
}