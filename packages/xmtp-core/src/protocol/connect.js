'use strict';

const constants = require('../constants.js');

module.exports = async (next, conn) => await next().then(() => {
	const host		= conn.app.get('me');
	const greeting	= conn.app.get('greeting');

	conn.respond(220, `${host} ESMTP ${greeting}`);
}, error => {
	switch (error.code) {
		case constants.deny:
			conn.loopRespond(554, 'Your mail is not welcome here');
			break;

		case constants.denydisconnect:
		case constants.disconnect:
			conn.respond(554, 'Your mail is not welcome here', () => conn.disconnect());
			break;

		case constants.denysoft:
			conn.loopRespond(421, 'Come back later');
			break;

		case constants.denysoftdisconnect:
			conn.respond(421, 'Come back later', () => conn.disconnect());
			break;

		default:
			throw error;
	}
});
