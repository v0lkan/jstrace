# jstrace

  Dynamic tracing for JavaScript, written in JavaScript, providing you insight into your live nodejs applications, at the process, machine, or cluster level.

  Similar to systems like [dtrace](http://dtrace.org/) or [ktap](http://www.ktap.org/), the goal of dynamic tracing is to enable a rich set of debugging information in live processes, often in production in order to help discover the root of an issue. These
  libraries have very minimal overhead when disabled, and may be enabled
  externally when needed.

## Installation

 Library:

```
$ npm install jstrace
```

  Client:

```
$ npm install -g jstrace
```

## Features

 - dynamic tracing :)
 - local / remote execution support
 - minimal overhead when idle
 - flexible scripting capabilities
 - probe name filtering
 - pid, process title, and hostname filtering
 - remote messaging for map/reduce style reporting
 - multi-process support, inspect your cluster in realtime

## Usage

```

  Usage: jstrace [options] <script>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -p, --pid <pid>        trace with the given <pid>
    -t, --title <pattern>  trace with title matching <pattern>
    -H, --host <pattern>   trace with hostname matching <pattern>

```

## Example

### Instrumentation

 Suppose for example you have probes set up to mark the
 start and end of an http request, you may want to quickly
 tap into the process and see which part of the request/response
 cycle is hindering latency.

 This contrived example isn't very exciting, and only has two
 probes, but it illustrates the capabilites. We simply mark the start and
 end of the request, as well as providing the request id.

```js
var trace = require('jstrace');
var http = require('http');

var ids = 0;

var server = http.createServer(function(req, res){
  var id = ++ids;

  trace('request:start', { id: id });
  setTimeout(function(){

    res.end('hello world');
    trace('request:end', { id: id });
  }, Math.random() * 250 | 0);
});

server.listen(3000);
```

### Analysis

 The `jstrace(1)` executable accepts a script which exports functions with trace patterns
 to match. These function names tell jstrace which traces to subscribe to. The `trace` object passed contains the information given to the in-processe `trace()` call, along with additional metadata such as `.timestamp`, `.hostname`, `.pid`, and `.title`.

 We can use this data to add anything we like, here we're simply mapping the requset ids to output deltas between the two. Note that we export the function named `.local`, there are two functions supported by jstrace, however `.local` means that the trace objects are sent over the wire and analysis is performed local to `jstrace(1)`.

```js
var m = {};

exports.local = function(traces){
  traces.on('request:start', function(trace){
    m[trace.id] = trace.timestamp;
  });

  traces.on('request:end', function(trace){
    var d = Date.now() - m[trace.id];
    console.log('%s -> %sms', trace.id, d);
  });
};
```

 To run the script just pass it to `jstrace(1)` and watch the output flow!

```
$ jstrace response-duration.js

298 -> 50ms
302 -> 34ms
299 -> 112ms
287 -> 184ms
289 -> 188ms
297 -> 124ms
286 -> 218ms
295 -> 195ms
300 -> 167ms
304 -> 161ms
307 -> 116ms
301 -> 206ms
305 -> 136ms
314 -> 19ms
```

### Plotting distribution

  Using node modules such as [bars](https://github.com/jstrace/bars) can aid in analysis, for exmaple plotting the distribution of response status codes over time.

```js
var clear = require('clear');
var bars = require('bars');

var m = {};

exports.local = function(traces){
  traces.on('request:end', function(trace){
    m[trace.status] = m[trace.status] || 0;
    m[trace.status]++;
  });
};

setInterval(function(){
  clear();
  console.log();
  console.log(bars(m, { bar: '=', width: 30 }));
}, 1000);
```

```
  200 | ============================== | 6
  404 | ====================           | 4
  500 | ====================           | 4
  505 | ===============                | 3
  400 | ==========                     | 2
  201 | =====                          | 1


  201 | ============================== | 19
  500 | ===========================    | 17
  505 | =====================          | 13
  200 | ===================            | 12
  404 | ===================            | 12
  400 | =================              | 11


  500 | ============================== | 19
  201 | ========================       | 15
  200 | ===================            | 12
  404 | ===================            | 12
  505 | =================              | 11
  400 | ===========                    | 7

...
```

 To reset the data per-interval tick all you'd have to do is add `m = {};` at the end of the `setInterval()` callback to refresh the data!

### Charting

  Create realtime charts using [ascii-chart](https://github.com/jstrace/chart) to monitor changes over time:

 ![](https://dl.dropboxusercontent.com/u/6396913/misc/Screen%20Shot%202014-02-27%20at%209.16.12%20AM.png)

```js
var chart = require('chart');
var clear = require('clear');

var data = [];
var n = 0;

exports.local = function(traces){
  traces.on('request:end', function(trace){ n++ });
};

setInterval(function(){
  data.push(n);
  n = 0;
  clear();
  console.log(chart(data));
}, 1000);

```


## Conventions

### Naming probes

 In general you should use ":" as a separator for pattern matching, and prefix with something relevant for your module, such as the module's name. Here are some examples:

 - `express:request:start`
 - `express:socket:error`
 - `koa:request:start`
 - `koa:request:end`
 - `myapp:login`
 - `myapp:logout`

### Dependency injection

 If your library supports tracing, it's best that you do _not_
 add jstrace as a dependency, instead you should provide a `trace` option
 to let the user pass in jstrace if they wish. Some people call this "dependency injection". For example:

```js
function MyLib(opts) {
  opts = opts || {};
  this.trace = opts.trace || function(){};
  this.trace('something', { some: 'data' });
}
```

  The premise here is that the community should start instrumenting libraries with this functionality so that node becomes easier to profile, monitor, and debug. This is especially important for detecting latency issues across async boundaries, as they not necessarily CPU-bound and may not show up in profiles at all.

## Trace object

 The trace object sent to both local and remote subscription handlers.

 - `timestamp` timestamp at the time of invocation
 - `hostname` machine hostname
 - `title` process title
 - `pid` process id
 - `name` trace name
 - `*` all other properties given

# License

  MIT
