
(function() {
    
    var Sentry = {};

    // ze namespace
    Sentry.models = {};
    Sentry.views = {};
    Sentry.colections = {};
    Sentry.template = {};
    Sentry.events = _.extend({}, Backbone.Events);
    Sentry.router = {};
    Sentry.uuid = uuid.v4;


///////////////////////////////////////////////////
//          Models: REST APIs request-response
///////////////////////////////////////////////////

    Sentry.models.response = Backbone.Models.extend({
        defaults: {
            request: '',
            uuid: Sentry.uuid(),
            success: false,
            body: {}
        },

        validate: function(m) {
            return ( typeof m.request == 'string' &&
                typeof m.uuid == 'string' &&
                typeof m.success == 'boolean'
                // m.msg instanceof Object
                );
        },

        trigger: function(m) {
            if (this.isValid) Sentry.events.trigger('m.uuid', this.model.toJSON());
        },

        error: function(m) {
            if (m.success) return null;
            else return true;
        },

        result: function(m) {
            return m.msg;
        }
    });

    Sentry.models.request = Backbone.Models.extend({
        defaults: {
            request: '',
            uuid: Sentry.uuid(),
            body: {}
        },

        validate: function(m) {
            return ( typeof m.request == 'string' &&
                typeof m.uuid == 'string' &&
                m.body instanceof Object
                );
        },

        send: function(url, body, callback) {
            this.set('body', body.toJSON());
            this.url = url;
            this.listen(callback);
            this.save();
        },

        listen: function(callback) {
            Sentry.events.on(this.model.get('uuid'), callback);
        }
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Login
///////////////////////////////////////////////////

    // login   
    Sentry.models.login = Backbone.Models.extend({
        defaults: {
            username: 'none',
            password: 'none'
        },

        validate: function(m) {
            return (($.strip(m.username) === m.username != null) && 
            ($.strip(m.password) === m.password != null))
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', 'login');
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/login',
        request: 'login'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Entity
///////////////////////////////////////////////////

    // createorg   
    Sentry.models.createorg = Backbone.Models.extend({
        defaults: {
            name: "",
            dbConnection: null,
            dbName: null,
            hash: "",
            kingdoms: ["kingslanding"]
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/user',
        request: 'createorg'
    });

    Sentry.models.createUser = Backbone.Models.extend({
        defaults: {
            username: "",
            password: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/users',
        request: 'add'
    });

    Sentry.models.promoteUser = Backbone.Models.extend({
        defaults: {
            username: "",
            permission: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/users',
        request: 'promote'
    });

    Sentry.models.grantUser = Backbone.Models.extend({
        defaults: {
            username: "",
            permission: "",
            kingdom: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/users',
        request: 'grant'
    });

    Sentry.models.revokeUser = Backbone.Models.extend({
        defaults: {
            username: "",
            permission: "",
            kingdom: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/users',
        request: 'revoke'
    });

    Sentry.models.reassociateUser = Backbone.Models.extend({
        defaults: {
            username: "",
            newParent: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/users',
        request: 'reassociate'
    });

    Sentry.models.deleteUser = Backbone.Models.extend({
        defaults: {
            username: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/users',
        request: 'delete'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Team
///////////////////////////////////////////////////

    Sentry.models.createTeam = Backbone.Models.extend({
        defaults: {
            parent: "",
            name: "",
            dbName: "",
            dbConnection: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/user',
        request: 'addteam'
    });

    Sentry.models.addUserToTeam = Backbone.Models.extend({
        defaults: {
            name: "",
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/team',
        request: 'adduser'
    });

    Sentry.models.changeTeamOwner = Backbone.Models.extend({
        defaults: {
            name: "",
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/team',
        request: 'changeowner'
    });

    Sentry.models.getTeamMembers = Backbone.Models.extend({
        defaults: {
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/team',
        request: 'getallusers'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Winterfell
///////////////////////////////////////////////////

    Sentry.models.Winterfell = {};

    Sentry.models.Winterfell.newFeed = Backbone.Models.extend({
        defaults: {
            content: "",
            file: "",
            name: "",
            mime: "", 
            location: "",
            belongs: [],
            tags: [],
            mentions: [],
            associations: [],
            private: false,
            broadcast: false,
            versioned: false
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'getallusers'
    });

    Sentry.models.Winterfell.checkinFeed = Backbone.Models.extend({
        defaults: {
            content: "",
            file: "",
            name: "",
            mime: "", 
            location: "",
            belongs: [],
            tags: [],
            mentions: [],
            associations: [],
            historyId: "",
            private: false,
            broadcast: false,
            versioned: false
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'checkinfeed'
    });

    Sentry.models.Winterfell.checkoutFeed = Backbone.Models.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'checkoutfeed'
    });

    Sentry.models.Winterfell.getLatestFeed = Backbone.Models.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'getlatest'
    });

    Sentry.models.Winterfell.pullRequest = Backbone.Models.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'pullrequest'
    });

    Sentry.models.Winterfell.acceptPull = Backbone.Models.extend({
        defaults: {
            historyId: "",
            number: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'acceptpull'
    });

    Sentry.models.Winterfell.rejectPull = Backbone.Models.extend({
        defaults: {
            historyId: "",
            number: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'rejectpull'
    });

    Sentry.models.Winterfell.rejectPull = Backbone.Models.extend({
        defaults: {
            historyId: "",
            number: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'rejectpull'
    });

    Sentry.models.Winterfell.getUserHistory = Backbone.Models.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'getuserhistory'
    });

    Sentry.models.Winterfell.getFullHistory = Backbone.Models.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'getfullhistory'
    });

    Sentry.models.Winterfell.deleteFeed = Backbone.Models.extend({
        defaults: {
            uuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'deletefeed'
    });

    Sentry.models.Winterfell.newChildFeed = Backbone.Models.extend({
        defaults: {
            uuid: "",
            content: "",
            mentions: []
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'newchildfeed'
    });

    Sentry.models.Winterfell.deleteChildFeed = Backbone.Models.extend({
        defaults: {
            uuid: "",
            childuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/feed',
        request: 'deletechildfeed'
    });

    Sentry.models.Winterfell.userTimeline = Backbone.Models.extend({
        defaults: {
            slab: 0
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/timeline',
        request: 'usertimeline'
    });

    Sentry.models.Winterfell.teamTimeline = Backbone.Models.extend({
        defaults: {
            slab: 0,
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/timeline',
        request: 'teamtimeline'
    });

    Sentry.models.Winterfell.broadcastTimeline = Backbone.Models.extend({
        defaults: {
            slab: 0
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/timeline',
        request: 'broadcasttimeline'
    });

    Sentry.models.Winterfell.tagTimeline = Backbone.Models.extend({
        defaults: {
            slab: 0,
            tags: []
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/timeline',
        request: 'tagtimeline'
    });

    Sentry.models.Winterfell.listDocs = Backbone.Models.extend({
        defaults: {
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/timeline',
        request: 'listdocs'
    });

    Sentry.models.Winterfell.searchDocs = Backbone.Models.extend({
        defaults: {
            slab: 0,
            query: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: '/winterfell/timeline',
        request: 'docsearch'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Kingslanding
///////////////////////////////////////////////////

    Sentry.Models.Kingslanding = {};

    Sentry.models.Kingslanding.createTale = Backbone.Models.extend({
        defaults: {
            tale: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/tale',
        request: 'create'
    });

    Sentry.models.Kingslanding.destroyTale = Backbone.Models.extend({
        defaults: {
            uuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/tale',
        request: 'destroy'
    });

    Sentry.models.Kingslanding.sayTale = Backbone.Models.extend({
        defaults: {
            uuid: "",
            saying: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/tale',
        request: 'say'
    });

    Sentry.models.Kingslanding.unsayTale = Backbone.Models.extend({
        defaults: {
            uuid: "",
            sayinguuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/tale',
        request: 'unsay'
    });

    Sentry.models.Kingslanding.cheerTale = Backbone.Models.extend({
        defaults: {
            uuid: "",
            sayinguuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/tale',
        request: 'cheer'
    });

    Sentry.models.Kingslanding.uncheerTale = Backbone.Models.extend({
        defaults: {
            uuid: "",
            sayinguuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/tale',
        request: 'uncheer'
    });

    Sentry.models.Kingslanding.createCouncil = Backbone.Models.extend({
        defaults: {
            message: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'create'
    });

    Sentry.models.Kingslanding.inviteToCouncil = Backbone.Models.extend({
        defaults: {
            uuid: "",
            user: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'invite'
    });

    Sentry.models.Kingslanding.commentOnCouncil = Backbone.Models.extend({
        defaults: {
            uuid: "",
            comment: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'comment'
    });

    Sentry.models.Kingslanding.uncommentOnCouncil = Backbone.Models.extend({
        defaults: {
            uuid: "",
            commentuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'uncomment'
    });

    Sentry.models.Kingslanding.upvoteCouncil = Backbone.Models.extend({
        defaults: {
            uuid: "",
            commentuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'upvote'
    });

    Sentry.models.Kingslanding.downvoteCouncil = Backbone.Models.extend({
        defaults: {
            uuid: "",
            commentuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'downvote'
    });

    Sentry.models.Kingslanding.conclusionCouncil = Backbone.Models.extend({
        defaults: {
            uuid: "",
            commentuuid: "",
            conclusion: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'conclusion'
    });

    Sentry.models.Kingslanding.destroyCouncil = Backbone.Models.extend({
        defaults: {
            uuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.send(this.url, this.model.toJSON(), callback);
        },

        url: 'kingslanding/council',
        request: 'destroy'
    });


})();

