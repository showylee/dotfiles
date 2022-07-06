# Event Chains

This is a copy of the node `EventEmitter` API with a few changes:

## Async

All events are emitted asynchronously.  This means that given the following
  code:

```js
var obj = new EventEmitter();
obj.on('foo', function(){ console.log('foo'); });
obj.emit('foo');
console.log('bar');
```

The native EventEmitter will log:

```
foo
bar
```

Whereas this library will log:

```
bar
foo
```

This is a design decision.  Since _some_ handlers can now be forced to be async
  (see "Event Execution and Cancellation" below), it's appropriate for them
  _all_ to be async.

## Scope

The event listener functions (`.addListener`, `.on`, `.once`) accept an
  optional 3rd `scope` argument.

## Single Event Emitters

Taking a cue from [signals](http://millermedeiros.github.io/js-signals/), you
can have EventEmitters with "default" events:

```js
var events = new EventEmitter().singleEvent();
events.addListener(function(){

});
events.emit('a', 'b', 'c');
```

Note that `newListener` and `removeListener` still fire, but they only include
  one argument, the listener function.  These become the _only_ events you can
  manually listen for.  Every function drops the `event` param _except_ when
  listening for one of these two events.

## Event Execution and Cancellation

Events can be stopped by calling `this.stop()` from within an event, or by
  returning a promise that gets rejected.

Note that if you return a promise, all future event handlers will get delayed
  until the promise is resolved.  If you return anything other than a promise,
  the next event handler will get called immediately.

```js
events.addListener(function(animal){
  if (animal === 'spider') {
    this.stop();
  }
});
```
