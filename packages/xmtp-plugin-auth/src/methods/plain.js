'use strict';

module.exports = async (next, conn, line, canAbort = true) => {
	const args = line.split(/\s+/).filter(arg => arg);

	if (args.length > 1) {
		conn.respond(501, 'Syntax error');
		return;
	}

	if (!args.length) {
		conn.nextHandler = 'auth_PLAIN';
		conn.respond(334, '');
		return;
	}

	if (canAbort && args[0] === '*') {
		conn.respond(501, 'AUTH aborted');
		return;
	}

	const data = new Buffer(args[0], 'base64').toString().split('\0');

	if (data.length !== 3) {
		conn.respond(500, 'Invalid response');
		return;
	}

	await conn.app.hook('auth', conn, {
		method: 'PLAIN',
		username: data[1],
		password: data[2],
		validatePassword: password => password === data[2]
	});
};
