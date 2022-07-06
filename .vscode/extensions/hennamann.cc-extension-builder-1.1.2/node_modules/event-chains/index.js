const DEFAULT      = '__default__';
const STOPPED      = {};
const ADD_EVENT    = 'newListener';
const REMOVE_EVENT = 'removeListener';
const DEF_EVENTS   = ` ${ADD_EVENT} ${REMOVE_EVENT} `;

class EventEmitter {
  constructor(eventName) {
    Object.defineProperty(this, 'events', {value : {}});
  }

  singleEvent() {
    Object.defineProperty(this, 'single', {value: true});

    return this;
  }

  addListener(event, listener, scope) {
    let [eventName, handler] = this.single && !~DEF_EVENTS.indexOf(` ${eventName} `)
      ? [DEFAULT, event]
      : [event, listener];

    this.addHandler(eventName, {
        handler : handler
      , scope   : scope
    });

    this.__emit('newListener', [eventName, handler]);

    return this;
  }

  on() {
    this.addListener(...arguments);

    return this;
  }

  once(event, listener, scope) {
    let [eventName, handler] = this.single && !~DEF_EVENTS.indexOf(` ${eventName} `)
      ? [DEFAULT, event]
      : [event, listener];

    this.addHandler(eventName, {
        handler : handler
      , once    : true
      , scope   : scope
    });

    return this;
  }

  removeListener(event, listener) {
    let [eventName, handler] = this.single && !~DEF_EVENTS.indexOf(` ${eventName} `)
      ? [DEFAULT, event]
      : [event, listener];

    let handlers = this.events[eventName];

    if (!handlers) { return; }

    handlers = handlers.filter(function(handlerObj) {
      if (handlerObj.handler === handler) {
        this.__emit('removeListener', (this.single ? [] : [eventName]).concat(handlerObj.handler));
        return false;
      }

      return true;
    });

    return this;
  }

  removeAllListeners(handler) {
    let eventName      = this.single ? DEFAULT : handler;
    let eventsToRemove = eventName ? {[eventName] : this.events[eventName]} : this.events;

    Object.keys(eventsToRemove)

      // push the removeListener event to be the last event removed
      .sort(function(a, b) {
        return (a === REMOVE_EVENT) ? 1 : (b === REMOVE_EVENT) ? -1 : 0;
      })

      .forEach((eventName) => {
        eventsToRemove[eventName].forEach(function(handlerObj) {
          this.__emit('removeListener', (this.single ? [] : [eventName]).concat(handlerObj.handler));
        }, this);

        this.events[eventName] = [];
      }, this);

    return this;
  }

  setMaxListeners(n) {
    this.maxListeners = n;

    return this;
  }

  defaultMaxListeners(n) {
    Object.defineProperty(EventEmitter.prototype, 'maxListeners', {
        value     : n
      , writeable : true
    });

    return this;
  }

  listeners(event) {
    return (this.events[event] || [])
      .map(function(handler) {
        return handler.handler;
      });
  }

  emit(event) {
    return this.__emit.apply(this, this.single ? [DEFAULT, ...arguments] : arguments);
  }
}

Object.defineProperties(EventEmitter.prototype, {
  maxListeners : {
      value     : 10
    , writeable : true
  }

  , __emit : {
    value : function(eventName) {
      let args = [].slice.call(arguments, 1);

      let handlers = this.events[eventName] || [];
      let promise  = Promise.resolve();
      let self     = this;

      handlers.forEach(function(handler, index) {
        promise = promise.then(function() {
          let rejected = null;
          let scope    = handler.scope || self;

          scope.stop = function() {
            rejected = Promise.reject(STOPPED);
          };

          let handlerRes = handler.handler.call(scope, ...args);

          scope.stop = undefined;

          return rejected || handlerRes;
        });

        if (handler.once) {
          handlers.splice(index, 1);
        }
      });

      promise.catch((err) => {
        if (err !== STOPPED) {
          throw err;
        }
      });

      return this;
    }
  }

  , addHandler : {
    value : function(eventName, handler) {
      let events = this.events[eventName] || (this.events[eventName] = []);

      if ((events.length >= this.maxListeners) && (!this.warned || !this.warned[eventName])) {
        console.warn(`warning: possible EventEmitter memory leak detected. ${events.length + 1} bar listeners added. ` +
          `Use emitter.setMaxListeners() to increase limit.`);

        if (!this.warned) {
          Object.defineProperty(this, 'warned', {value : {}});
        }

        this.warned[eventName] = true;
      }

      this.events[eventName].push(handler);
    }
  }
});

EventEmitter.listenerCount = function(emitter, event) {
  return emitter.listeners(event).length;
};

module.exports = EventEmitter;
