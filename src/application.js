'use strict';

const net			= require('net');
const debug			= require('debug')('mx:application');
const Emitter		= require('events').EventEmitter;
const Connection	= require('./connection.js');
const protocol		= require('./protocol.js');
const compose		= require('./utils/compose.js');

class Application extends Emitter {
	constructor() {
		super();

		this.hooks		= null;
		this.env		= process.env.NODE_ENV || 'development';
		this.servers	= [];
		this.middleware	= {};
		this.settings	= {
			me: 'localhost',
			greeting: 'Server',
			databytes: 20 * 1024 * 1024,
			max_line_length: 512,
			max_data_line_length: 992
		};

		protocol(this);
	}

	set(key, value) {
		this.settings[key] = value;
	}

	get(key) {
		return this.settings[key];
	}

	listen(port = 25, host = '0.0.0.0') {
		const server = net.createServer(this.callback());

		// server.unref();
		server.on('error', err => this.emit('error', err));
		server.on('listening', () => {
			debug(`Listening on ${server.address().address}:${server.address().port}`);
			this.emit('listening');
		});

		server.listen(port, host);

		debug('listen');
		this.servers.push(server);
	}

	hasHook(name) {
		return !!this.hooks[name];
	}

	hook(name, ...args) {
		if (!this.hooks[name]) {
			return Promise.resolve();
		}

		return this.hooks[name](...args);
	}

	use(hook, fn) {
		if (!this.middleware[hook]) {
			this.middleware[hook] = [];
		}

		debug(`use ${hook}`);
		this.middleware[hook].push(fn);

		return this;
	}

	callback() {
		this.hooks = Object.keys(this.middleware).reduce((obj, hook) => {
			obj[hook] = compose(this.middleware[hook]); // eslint-disable-line no-param-reassign
			return obj;
		}, {});

		if (!this.listeners('error').length) {
			this.on('error', this.handleError);
		}

		return conn => new Connection(this, conn);
	}

	handleError(err) { // eslint-disable-line class-methods-use-this
		const msg = err.stack || err.toString();

		console.error(); // eslint-disable-line no-console
		console.error(msg.replace(/^/gm, '  ')); // eslint-disable-line no-console
		console.error(); // eslint-disable-line no-console
	}
}

module.exports				= () => new Application();
module.exports.Application	= Application;
