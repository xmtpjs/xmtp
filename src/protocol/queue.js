'use strict';

const constants = require('../constants.js');

module.exports = async (next, conn) => await next().then(() => conn.app.hook('queue_ok', conn), error => {
	switch (error.code) {
		case constants.deny:
			conn.respond(550, 'Message denied', () => conn.resetTransaction());
			break;

		case constants.denydisconnect:
			conn.respond(550, 'Message denied', () => conn.disconnect());
			break;

		case constants.denysoft:
			conn.respond(450, 'Message temporarily denied', () => conn.resetTransaction());
			break;

		case constants.denysoftdisconnect:
			conn.respond(450, 'Message temporarily denied', () => conn.disconnect());
			break;

		default:
			throw error;
	}
});
