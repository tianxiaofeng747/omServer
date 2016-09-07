"use strict";
/**
 * Protect window.console method calls, e.g. console is not defined on IE
 * unless dev tools are open, and IE doesn't define console.debug
 */
if (!window.console) {
    window.console = {};
}
// union of Chrome, FF, IE, and Safari console methods
var m = [
    "log", "info", "warn", "error", "debug", "trace", "dir", "group",
    "groupCollapsed", "groupEnd", "time", "timeEnd", "profile", "profileEnd",
    "dirxml", "assert", "count", "markTimeline", "timeStamp", "clear"
];
// define undefined methods as noops to prevent errors
for (var i = 0; i < m.length; i++) {
    if (!window.console[m[i]]) {
        window.console[m[i]] = function () {
        };
    }
}

var toArray = function (obj, from) {
    return Array.prototype.slice.call(obj, from);
};

var UUID_FEED = 0;
var baseMixin = {
    __init: function () {
        this.initialize.apply(this, arguments);
        this.initHook();
        //this.$el.data("controller",this); //cache the class instance in the jquery dom
        this.afterRender();
    },

    $el: null,

    jel: null,

    events: {
    },
    routes: {
    },
    initData: function () {
        //this.logger.warn("please rewrite initData method in your class.");
    },
    afterRender: function () {
        //this.logger.warn("please rewrite afterRender method in your class.");
    },
    initialize: function (auxObj) {
        for (var key in auxObj) {
            this[key] = auxObj[key];
        }
        this.$el ? (this.jel = this.$el) : '';
        this.jel ? (this.$el = this.jel) : '';
        this.delegateEvents();
        try {
            this._bindRoutes();
        } catch (ex) {
        }
        this.trigger('initialized');
    },
    initHook: function () {
    },
    render: function () {
    },
    $: function (selector) {
        this.jel ? (this.$el = this.jel) : '';
        return this.$el.find(selector);
    },
    find: function (selector) {
        this.jel ? (this.$el = this.jel) : '';
        return this.$el.find(selector);
    },
    getRootNode: function () {
        return this.$el;
    },
    delegateEvents: function () {
        // Cached regex to split keys for `delegate`.
        var eventSplitter = /^(\S+)\s*(.*)$/;
        var events = this.events;
        for (var key in events) {
            var method = events[key];
            if (!$.isFunction(method)) method = this[events[key]];
            if (!method) throw new Error('Event "' + events[key] + '" does not exist');
            method = method.bind(this);
            var match = key.match(eventSplitter);
            var eventName = match[1], selector = match[2];
            //todo need think if no validate, the match of el position should be change
            this.jel ? (this.$el = this.jel) : '';
            this.$el.delegate(selector, eventName, method);
        }
    },
    _bindRoutes: function () {
        if (!this.routes) return;
        var routes = [];

        for (var route in this.routes) {
            routes.unshift([route, this.routes[route]]);
        }
        for (var i = 0, l = routes.length; i
            < l; i++) {
            this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
        }
    },

    trigger: function () {
        var args = toArray(arguments);
        // do not bind the node, just use the method
        if (this.$el && this.$el.length >
            0) {
            this.$el.trigger.apply(this.$el, args);
        }
    },

    on: function () {
        var args = toArray(arguments);
        this.$el.on.apply(this.$el, args);
    },
    gc: function () {
        this.trigger('beforeGC');
        this.$el.unbind();
        this.$el.remove();
    }

};


var Mixin = function (base, mixins) {
    mixins.forEach ? "" : (mixins = [mixins]);
    mixins.forEach(function (mixin) {
        base.mixedIn = base.hasOwnProperty('mixedIn') ? base.mixedIn : [];
        if (base.mixedIn.indexOf(mixin) == -1) {
            if (typeof mixin !== 'function') {
                for (var i in mixin) {
                    mixin.hasOwnProperty(i) && mixin[i] ? base[i] = mixin[i] : ''; //json mixin
                }
            } else {
                mixin.call(base); //function mixin
            }
        }
        base.mixedIn.push(mixin);
    })
    return base.constructor;
};


//todo support more parameter for wrap
function wrap(base) {
    function moduleFactory() {
        if (this.__init) {
            this.__init();
        }
    }

    Mixin(moduleFactory.prototype, baseMixin);
    moduleFactory.mixin = Mixin;
    moduleFactory.connectTo = function (node, objAux) {
        this.prototype.jel = this.prototype.$el = node;
        this.prototype.logger = console;
        var m = new this();
        m.uuid = UUID_FEED++;
        m.jel.show();
        m.initData(objAux);
        node.data("uuid", "uuid" + m.uuid);
        return m;
    };
    return Mixin(moduleFactory.prototype, base);
}

module.exports = wrap;