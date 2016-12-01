'use strict';

const util		= require('util');
const crypto	= require('crypto');

const challenges = new WeakMap();

module.exports = async (next, conn, line, canAbort = true) => {
	const args		= line.split(/\s+/).filter(arg => arg);
	const challenge	= challenges.get(conn);

	if (!challenge) {
		if (args.length) {
			conn.respond(501, 'Syntax error');
			return;
		}

		const newChallenge = util.format(
			'<%s.%s@%s>',
            String(Math.random()).replace(/^[0.]+/, '').substr(0, 8),
            Math.floor(Date.now() / 1000),
            conn.app.get('me')
        );

		conn.nextHandler = 'auth_CRAM-MD5';

		challenges.set(conn, newChallenge);
		conn.respond(334, new Buffer(newChallenge).toString('base64'));
		return;
	} else if (canAbort && args[0] === '*') {
		conn.respond(501, 'AUTH aborted');
		return;
	}

	const [username, response] = new Buffer(args[0], 'base64').toString().split(' ');

	challenges.delete(conn);

	await conn.app.hook('auth', conn, {
		method: 'CRAM-MD5',
		username,
		validatePassword: password => {
			const hash = crypto
				.createHmac('md5', password)
				.update(challenge)
				.digest('hex');

			return hash === (response || '').toLowerCase();
		}
	});
};
