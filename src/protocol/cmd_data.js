'use strict';

const constants = require('../constants.js');

module.exports = async (next, conn, line) => {
	if (line) {
		conn.errors++;
		conn.respond(501, 'Syntax error');
		return null;
	}

	if (!conn.transaction) {
		conn.errors++;
		conn.respond(503, 'MAIL required first');
		return null;
	}

	if (!conn.transaction.rcptTo.length) {
		if (conn.pipelining) {
			conn.respond(554, 'No valid recipients');
		} else {
			conn.errors++;
			conn.respond(503, 'RCPT required first');
		}

		return null;
	}

	return await next().then(() => {
		if (!conn.transaction) {
			return;
		}

		conn.respond(354, 'OK', () => {
			conn.state = conn.constructor.states.STATE_DATA;
		});
	}, error => {
		switch (error.code) {
			case constants.deny:
				conn.respond(554, error, () => conn.resetTransaction());
				break;

			case constants.denydisconnect:
				conn.respond(554, error, () => conn.disconnect());
				break;

			case constants.denysoft:
				conn.respond(451, error, () => conn.resetTransaction());
				break;

			case constants.denysoftdisconnect:
				conn.respond(451, error, () => conn.disconnect());
				break;

			default:
				throw error;
		}
	});
};
