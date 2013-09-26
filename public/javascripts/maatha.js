
(function() {
    
    var App = {};

    // ze namespace
    App.models = {};
    App.views = {};
    App.colections = {};
    App.template = {};
    App.events = _.extend({}, Backbone.Events);
    App.router = {};
    App.uuid = uuid.v4;


///////////////////////////////////////////////////
//          Models: REST APIs request-response
///////////////////////////////////////////////////

    App.models.response = Backbone.Models.extend({
        validate: function(m) {
            return ( typeof m.request == 'string' &&
                typeof m.uuid == 'string' &&
                typeof m.success == 'boolean'
                // m.msg instanceof Object
                );
        },

        trigger: function(m) {
            if (this.isValid) App.events.trigger('m.uuid');
        },

        error: function(m) {
            if (m.success) return null;
            else return true;
        },

        result: function(m) {
            return m.msg;
        }
    });

    App.models.request = Backbone.Models.extend({
        defaults: {
            request: '',
            uuid: App.uuid(),
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
            App.events.on(this.model.get('uuid'), callback);
        }
    });

///////////////////////////////////////////////////
//          Models: REST APIs
///////////////////////////////////////////////////

    // login   
    App.models.login = Backbone.Models.extend({
        defaults: {
            username: 'none',
            password: 'none'
        },

        validate: function(m) {
            return (($.strip(m.username) === m.username != null) && 
            ($.strip(m.password) === m.password != null))
        },

        send: function(callback) {
            var req = new App.models.request();
            req.set('request', 'login');
            req.send(this.url, this.toJSON(), callback);
        },

        url: '/login',
        request: 'login'
    });

    // createorg   
    App.models.createorg = Backbone.Models.extend({
        defaults: {
            name: "",
            dbConnection: null,
            dbName: null,
            hash: "",
            kingdoms: ["kingslanding"]
        },

        validate: function(m) {
            return (($.strip(m.username) === m.username != null) && 
            ($.strip(m.password) === m.password != null))
        },

        send: function(callback) {
            var req = new App.models.request();
            req.set('request', this.request);
            req.send(this.url, this.toJSON(), callback);
        },

        url: '/user',
        request: 'createorg'
    });




})();

