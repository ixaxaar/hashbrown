
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

    Sentry.models.response = Backbone.Model.extend({
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

    Sentry.models.request = Backbone.Model.extend({
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

        listen: function(callback) {
            Sentry.events.on(this.get('uuid'), callback);
        },

        url: '/'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Login
///////////////////////////////////////////////////

    // login   
    Sentry.models.login = Backbone.Model.extend({
        defaults: {
            username: 'lavender',
            password: '123'
        },

        validate: function(m) {
//            return (($.strip(m.username) === m.username != null) &&
//            ($.strip(m.password) === m.password != null))
        },

        send: function() {
            this.save();
        },

        url: '/login',
        request: 'login'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Entity
///////////////////////////////////////////////////

    // createorg   
    Sentry.models.createorg = Backbone.Model.extend({
        defaults: {
            name: "",
            dbConnection: "",
            dbName: "",
            hash: "",
            kingdoms: ["kingslanding"]
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/user',
        request: 'createorg'
    });

    Sentry.models.createUser = Backbone.Model.extend({
        defaults: {
            username: "",
            password: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/users',
        request: 'add'
    });

    Sentry.models.promoteUser = Backbone.Model.extend({
        defaults: {
            username: "",
            permission: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/users',
        request: 'promote'
    });

    Sentry.models.grantUser = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/users',
        request: 'grant'
    });

    Sentry.models.revokeUser = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/users',
        request: 'revoke'
    });

    Sentry.models.reassociateUser = Backbone.Model.extend({
        defaults: {
            username: "",
            newParent: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/users',
        request: 'reassociate'
    });

    Sentry.models.deleteUser = Backbone.Model.extend({
        defaults: {
            username: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/users',
        request: 'delete'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Team
///////////////////////////////////////////////////

    Sentry.models.createTeam = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/user',
        request: 'addteam'
    });

    Sentry.models.addUserToTeam = Backbone.Model.extend({
        defaults: {
            name: "",
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/team',
        request: 'adduser'
    });

    Sentry.models.changeTeamOwner = Backbone.Model.extend({
        defaults: {
            name: "",
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/team',
        request: 'changeowner'
    });

    Sentry.models.getTeamMembers = Backbone.Model.extend({
        defaults: {
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/team',
        request: 'getallusers'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Winterfell
///////////////////////////////////////////////////

    Sentry.models.Winterfell = {};

    Sentry.models.Winterfell.newFeed = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'getallusers'
    });

    Sentry.models.Winterfell.checkinFeed = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'checkinfeed'
    });

    Sentry.models.Winterfell.checkoutFeed = Backbone.Model.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'checkoutfeed'
    });

    Sentry.models.Winterfell.getLatestFeed = Backbone.Model.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'getlatest'
    });

    Sentry.models.Winterfell.pullRequest = Backbone.Model.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'pullrequest'
    });

    Sentry.models.Winterfell.acceptPull = Backbone.Model.extend({
        defaults: {
            historyId: "",
            number: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'acceptpull'
    });

    Sentry.models.Winterfell.rejectPull = Backbone.Model.extend({
        defaults: {
            historyId: "",
            number: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'rejectpull'
    });

    Sentry.models.Winterfell.rejectPull = Backbone.Model.extend({
        defaults: {
            historyId: "",
            number: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'rejectpull'
    });

    Sentry.models.Winterfell.getUserHistory = Backbone.Model.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'getuserhistory'
    });

    Sentry.models.Winterfell.getFullHistory = Backbone.Model.extend({
        defaults: {
            historyId: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'getfullhistory'
    });

    Sentry.models.Winterfell.deleteFeed = Backbone.Model.extend({
        defaults: {
            uuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'deletefeed'
    });

    Sentry.models.Winterfell.newChildFeed = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'newchildfeed'
    });

    Sentry.models.Winterfell.deleteChildFeed = Backbone.Model.extend({
        defaults: {
            uuid: "",
            childuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/feed',
        request: 'deletechildfeed'
    });

    Sentry.models.Winterfell.userTimeline = Backbone.Model.extend({
        defaults: {
            slab: 0
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/timeline',
        request: 'usertimeline'
    });

    Sentry.models.Winterfell.teamTimeline = Backbone.Model.extend({
        defaults: {
            slab: 0,
            team: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/timeline',
        request: 'teamtimeline'
    });

    Sentry.models.Winterfell.broadcastTimeline = Backbone.Model.extend({
        defaults: {
            slab: 0
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/timeline',
        request: 'broadcasttimeline'
    });

    Sentry.models.Winterfell.tagTimeline = Backbone.Model.extend({
        defaults: {
            slab: 0,
            tags: []
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/timeline',
        request: 'tagtimeline'
    });

    Sentry.models.Winterfell.listDocs = Backbone.Model.extend({
        defaults: {
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/timeline',
        request: 'listdocs'
    });

    Sentry.models.Winterfell.searchDocs = Backbone.Model.extend({
        defaults: {
            slab: 0,
            query: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: '/winterfell/timeline',
        request: 'docsearch'
    });

///////////////////////////////////////////////////
//          Models: REST APIs - Kingslanding
///////////////////////////////////////////////////

    Sentry.models.Kingslanding = {};

    Sentry.models.Kingslanding.createTale = Backbone.Model.extend({
        defaults: {
            tale: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/tale',
        request: 'create'
    });

    Sentry.models.Kingslanding.destroyTale = Backbone.Model.extend({
        defaults: {
            uuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/tale',
        request: 'destroy'
    });

    Sentry.models.Kingslanding.sayTale = Backbone.Model.extend({
        defaults: {
            uuid: "",
            saying: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/tale',
        request: 'say'
    });

    Sentry.models.Kingslanding.unsayTale = Backbone.Model.extend({
        defaults: {
            uuid: "",
            sayinguuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/tale',
        request: 'unsay'
    });

    Sentry.models.Kingslanding.cheerTale = Backbone.Model.extend({
        defaults: {
            uuid: "",
            sayinguuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/tale',
        request: 'cheer'
    });

    Sentry.models.Kingslanding.uncheerTale = Backbone.Model.extend({
        defaults: {
            uuid: "",
            sayinguuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/tale',
        request: 'uncheer'
    });

    Sentry.models.Kingslanding.createCouncil = Backbone.Model.extend({
        defaults: {
            message: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'create'
    });

    Sentry.models.Kingslanding.inviteToCouncil = Backbone.Model.extend({
        defaults: {
            uuid: "",
            user: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'invite'
    });

    Sentry.models.Kingslanding.commentOnCouncil = Backbone.Model.extend({
        defaults: {
            uuid: "",
            comment: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'comment'
    });

    Sentry.models.Kingslanding.uncommentOnCouncil = Backbone.Model.extend({
        defaults: {
            uuid: "",
            commentuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'uncomment'
    });

    Sentry.models.Kingslanding.upvoteCouncil = Backbone.Model.extend({
        defaults: {
            uuid: "",
            commentuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'upvote'
    });

    Sentry.models.Kingslanding.downvoteCouncil = Backbone.Model.extend({
        defaults: {
            uuid: "",
            commentuuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'downvote'
    });

    Sentry.models.Kingslanding.conclusionCouncil = Backbone.Model.extend({
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
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'conclusion'
    });

    Sentry.models.Kingslanding.destroyCouncil = Backbone.Model.extend({
        defaults: {
            uuid: ""
        },

        validate: function(m) {
        },

        send: function(callback) {
            var req = new Sentry.models.request();
            req.set('request', this.request);
            req.set('body', JSON.stringify(this.toJSON()));
            req.url = this.url;
            req.listen(callback);
            var promise = req.save();
            $.when(promise).then(function() {
                console.log(promise.responseText);
            });
        },

        url: 'kingslanding/council',
        request: 'destroy'
    });


})();

