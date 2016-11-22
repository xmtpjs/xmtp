'use strict';

const constants	= require('../constants.js');
const rfc1869	= require('../utils/rfc1869.js');
const Address	= require('../utils/address');

const paramRegExp = /^([^=]+)(?:=(.+))?$/;

async function parseRcpt(conn, line) {
	let results;
	let rcpt;

	try {
		results	= rfc1869('rcpt', line, true);
		rcpt	= new Address(results.shift());
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

	rcpt.params = params;
	conn.transaction.rcptTo.push(rcpt);

	return rcpt;
}

function removeRcpt({ transaction: { rcptTo } }, rcpt) {
	const idx = rcptTo.indexOf(rcpt);

	rcptTo.splice(idx, 1);
}

module.exports = async (next, conn, line) => {
	if (!conn.transaction || !conn.transaction.mailFrom) {
		conn.errors++;
		conn.respond(503, 'Use MAIL before RCPT');
		return null;
	}

	const rcpt = await parseRcpt(conn, line);

	if (!rcpt) {
		return null;
	} if (conn.app.hasHook('rcpt')) {
		const ok = await conn.app.hook('rcpt', rcpt);

		if (!ok) {
			conn.respond(550, `I cannot deliver mail for ${rcpt}`, () => removeRcpt(conn, rcpt));
			return null;
		}
	}

	return await next().then(() => {
		if (!conn.transaction) {
			return;
		}

		conn.respond(250, 'OK');
	}, error => {
		switch (error.code) {
			case constants.deny:
				conn.respond(550, error, () => removeRcpt(conn, rcpt));
				break;

			case constants.denydisconnect:
				conn.respond(550, error, () => conn.disconnect());
				break;

			case constants.denysoft:
				conn.respond(450, error, () => removeRcpt(conn, rcpt));
				break;

			case constants.denysoftdisconnect:
				conn.respond(450, error, () => conn.disconnect());
				break;

			default:
				throw error;
		}
	});
};
