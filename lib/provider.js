'use strict';

/*
 * __.--~~.,-.__            «« kiraz — tap into live Node.JS apps »»
 * `~-._.-(`-.__`-.
 *         \     This program is distributed under the terms of the MIT license.
 *          \--.       Please see the `LICENSE.md` file for details.
 *         /#   \
 *         \    /            Send your comments and suggestions to:
 *          '--'            <https://github.com/v0lkan/kiraz/issues>
 */

/**
 * Module dependencies.
 */

var Server = require('./server');
var assert = require('assert');

/**
 * Communication server.
 */

var server = new Server();

/**
 * Starts the server.
 *
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
exports.start = function(options) {
    server.start(options);
};

/**
 * Creates a probe with the given `name` and optional properties `obj`.
 *
 * @param {String} name
 * @param {Object} [obj]
 * @api public
 */
exports.trace = function(name, obj){
  // global subscription flag, only enabled
  // when the jstrace(1) executable is in use
  if (!server.subscribing) return;

  // is .remote present and subscribed to this probe
  if (server.remote && server.remote.subscribed(name)) {
    server.remote.send(name, obj);
  }

  // is .local present and subscribed to this probe
  if (server.subscribed(name)) server.send(name, obj);
};
