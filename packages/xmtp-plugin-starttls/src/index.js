'use strict';

const debug									= require('debug')('xmtp:plugin:starttls');
const { createSecureContext, TLSSocket }	= require('tls');

module.exports = options => app => {
	const secureContext = createSecureContext(options);

	app.use('capabilities', async (next, conn, capabilities) => {
		if (!conn.secure) {
			capabilities.push('STARTTLS');
		}

		await next();
	});

	app.use('cmd_starttls', async (next, conn) => {
		if (conn.secure) {
			conn.respond(503, 'TLS already active');
			return;
		}

		await next();

		conn.respond(220, 'Ready to start TLS');
		conn.socket.removeAllListeners();

		const secureSocket = new TLSSocket(conn.socket, Object.assign({
			secureContext
		}, options.socket || {}, {
			isServer: true,
			server: conn.server
		}));

		const connProxy = new Proxy(conn, {
			get(target, name) {
				if (name !== 'socket') {
					return target[name];
				}

				return secureSocket;
			}
		});

		connProxy.setup();

		conn.socket.on('error', error => secureSocket.emit(error));
		secureSocket.on('secure', () => {
			conn.secure	= true;
			conn.socket	= secureSocket;

			const { name, version } = secureSocket.getCipher();

			debug(`upgraded cipher=${name} version=${version}`);
		});
	});
};
