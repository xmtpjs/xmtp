'use strict';

const constants	= require('../constants.js');
const rfc1869	= require('../utils/rfc1869.js');
const Address	= require('../utils/address');

const paramRegExp = /^([^=]+)(?:=(.+))?$/;

async function initTransaction(conn, line) {
	let results;
	let from;

	try {
		results	= rfc1869('mail', line, true);
		from	= new Address(results.shift());
	} catch (err) {
		conn.errors++;
		conn.respond(501, 'Command parsing failed');
		return null;
	}

	const params = {};

	results.forEach(param => {
		const [, key, value] = param.match(paramRegExp);

		if (key) {
			params[key.toUpperCase()] = value || null;
		}
	});

	if (!conn.esmtp && Object.keys(params).length > 0) {
		conn.respond(555, 'Invalid command parameters');
		return null;
	}

	if (params && params.SIZE && params.SIZE > 0) {
		const databytes = conn.app.get('databytes');

		if (databytes && databytes > 0 && params.SIZE > databytes) {
			conn.respond(550, 'Message too big!');
			return null;
		}
	}

	await conn.initTransaction();

	from.params					= params;
	conn.transaction.mailFrom	= from;

	return from;
}

module.exports = async (next, conn, line) => {
	if (!conn.heloHost) {
		conn.errors++;
		conn.respond(503, 'Use EHLO/HELO before MAIL');
		return null;
	}

	const from = await initTransaction(conn, line);

	if (!from) {
		return null;
	}

	return await next().then(() => {
		if (!conn.transaction) {
			return;
		}

		conn.respond(250, 'OK');
	}, error => {
		switch (error.code) {
			case constants.deny:
				conn.respond(550, error, () => conn.resetTransaction());
				break;

			case constants.denydisconnect:
				conn.respond(550, error, () => conn.disconnect());
				break;

			case constants.denysoft:
				conn.respond(450, error, () => conn.resetTransaction());
				break;

			case constants.denysoftdisconnect:
				conn.respond(450, error, () => conn.disconnect());
				break;

			default:
				throw error;
		}
	});
};
