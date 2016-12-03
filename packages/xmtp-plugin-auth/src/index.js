'use strict';

const path	= require('path');
const debug	= require('debug')('xmtp:plugin:auth');

const dir = path.resolve(__dirname, 'methods');

const authMethods = require('fs').readdirSync(dir).reduce((obj, file) => {
	const command = path.basename(file, path.extname(file)).toUpperCase();

	debug(`Loading auth method handler "${command}"`);
	obj[command] = require(path.resolve(dir, file)); // eslint-disable-line

	return obj;
}, {});

module.exports = options => app => {
	if (typeof options.onAuth !== 'function') {
		throw new Error('`onAuth` method is required');
	}

	const methods = options.methods || ['PLAIN', 'LOGIN'];

	methods
		.filter(method => method in authMethods)
		.forEach(method => app.use(`auth_${method}`, authMethods[method]));

	app.use('capabilities', async (next, conn, capabilities) => {
		if (conn.secure || options.allowInsecureAuth) {
			capabilities.push(`AUTH ${methods.join(' ')}`);
			capabilities.push(`AUTH=${methods.join(' ')}`);
		}

		await next();
	});

	app.use('auth', async (next, conn, data, ignoreResponse = false) => {
		conn.user = await options.onAuth(data);

		if (!conn.user) {
			conn.nextHandler = false;

			conn.respond(535, 'Authentication credentials invalid');
			return null;
		} else if (ignoreResponse) {
			return conn.user;
		}

		debug(`authenticated user="${data.username}" method="${data.method}"`);
		conn.respond(235, 'Authentication successful');

		return conn.user;
	});

	app.use('cmd_auth', async (next, conn, line) => {
		if (!line || !line.trim()) {
			conn.respond(501, 'AUTH requires parameters');
			return;
		} else if (!conn.secure && !options.allowInsecureAuth) {
			conn.respond(538, 'Must issue a STARTTLS command first');
			return;
		} else if (conn.user) {
			conn.respond(503, 'No identity changes permitted');
			return;
		}

		const [, method, , remaining]	= /^([^ ]*)( +(.*))?$/.exec(line);
		const hook						= `auth_${method.toUpperCase()}`;

		if (!app.hasHook(hook)) {
			conn.respond(504, 'Unrecognized AUTH method');
			return;
		}

		await app.hook(hook, conn, remaining || '', false);
	});
};

module.exports.methods = Object.keys(authMethods);
