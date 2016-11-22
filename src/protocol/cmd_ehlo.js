'use strict';

const constants = require('../constants.js');

module.exports = async (next, conn, line) => {
	if (!line || !line.trim()) {
		conn.respond(501, 'EHLO requires domain/address - see RFC-2821 4.1.1.1');
		return null;
	}

	await conn.resetTransaction();

	conn.greeting	= 'EHLO';
	conn.heloHost	= line.split(/ +/)[0];

	return await next().then(async () => {
		const capabilities = [
			conn.app.get('me'),
			'PIPELINING',
			'8BITMIME',
			`SIZE ${conn.app.get('databytes')}`
		];

		conn.esmtp = true;

		await conn.app.hook('capabilities', conn, capabilities);
		conn.respond(250, capabilities);
	}, error => {
		switch (error.code) {
			case constants.deny:
				conn.respond(550, error, () => {
					conn.greeting	= null;
					conn.heloHost	= null;
				});

				break;

			case constants.denydisconnect:
				conn.respond(550, error, () => conn.disconnect());
				break;

			case constants.denysoft:
				conn.respond(450, error, () => {
					conn.greeting	= null;
					conn.heloHost	= null;
				});

				break;

			case constants.denysoftdisconnect:
				conn.respond(450, error, () => conn.disconnect());
				break;

			default:
				throw error;
		}
	});
};
