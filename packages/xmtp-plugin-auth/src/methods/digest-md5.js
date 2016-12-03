'use strict';

const crypto	= require('crypto');
const debug		= require('debug')('xmtp:plugin:auth:digest-md5');

const notes = new WeakMap();

function parseResponse(response) {
	return new Buffer(response, 'base64')
		.toString()
		.match(/([^=]+)="?(.*?)"?(?:,|$)/g)
		.map(str => str.match(/([^=]+)="?(.*?)"?,?$/))
		.reduce((obj, [, key, value]) => {
			obj[key] = value;

			return obj;
		}, {});
}

function md5(str, encoding = 'hex') {
	return crypto
		.createHash('md5')
		.update(str)
		.digest(encoding);
}

function createResponseAuth(response, a1Base, a2Prefix = '') {
	const a1 = crypto
		.createHash('md5')
		.update(a1Base)
		.update(`:${response.nonce}:${response.cnonce}`);

	if (response.authzid) {
		a1.update(`:${response.authzid}`);
	}

	const a2 = ~['auth-int', 'auth-conf'].indexOf(response.qop)
		? md5(`${a2Prefix}:${response['digest-uri']}:00000000000000000000000000000000`)
		: md5(`${a2Prefix}:${response['digest-uri']}`);

	const a1Hex = a1.digest('hex');

	return md5(`${a1Hex}:${response.nonce}:${response.nc}:${response.cnonce}:${response.qop}:${a2}`);
}

module.exports = async (next, conn, line, canAbort = true) => {
	const args = line.split(/\s+/).filter(arg => arg);

	if (!notes.has(conn)) {
		if (args.length) {
			conn.respond(501, 'Syntax error');
			return;
		}

		const note = {
			challenge: [
				`realm="${conn.app.get('me')}"`,
				`nonce="${String(Math.random()).replace(/^[0.]+/, '').substr(0, 8)}"`,
				'qop="auth"',
				'charset=utf-8',
				'algorithm=md5-sess'
				// 'cipher="des,3des"'
			].join(',')
		};

		conn.nextHandler = 'auth_DIGEST-MD5';

		notes.set(conn, note);
		conn.respond(334, new Buffer(note.challenge).toString('base64'));
		return;
	} else if (canAbort && args[0] === '*') {
		conn.respond(501, 'AUTH aborted');
		return;
	}

	const note = notes.get(conn);

	if (!note.response) {
		const response = parseResponse(args[0]);

		let rspauth;

		const user = await conn.app.hook('auth', conn, {
			method: 'DIGEST-MD5',
			username: response.username,
			validateHash: hash => {
				const a1Base = Buffer.from(hash);

				const validated = createResponseAuth(response, a1Base, 'AUTHENTICATE') === response.response;

				if (validated) {
					rspauth = createResponseAuth(response, a1Base);
				}

				return validated;
			},
			validatePassword: password => {
				const a1Base = md5(`${response.username}:${response.realm}:${password}`, 'buffer');

				const validated = createResponseAuth(response, a1Base, 'AUTHENTICATE') === response.response;

				if (validated) {
					rspauth = createResponseAuth(response, a1Base);
				}

				return validated;
			}
		}, true);

		if (user) {
			note.response		= response;
			conn.nextHandler	= 'auth_DIGEST-MD5';
			conn.respond(334, new Buffer(`rspauth=${rspauth}`).toString('base64'));
		}

		return;
	}

	notes.delete(conn);

	debug(`authenticated user="${note.response.username}" method="DIGEST-MD5"`);
	conn.respond(235, 'Authentication successful');
};
