/**
 * User: Russi
 * Date: 14/7/13
 * Time: 9:08 PM
 */


function user(userinfo) {
    return {
        'user'      :   userinfo.userid,
        'name'      :   userinfo.name,
        'type'      :   USER,
        'domain'    :   USER
    }
}

function feed() {
    this.user;
    this.content;
    this.commentsll;
    this.usersll;
}
