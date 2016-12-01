'use strict';

const usernames = new WeakMap();

module.exports = async (next, conn, line, canAbort = true) => {
	const args = line.split(/\s+/).filter(arg => arg);

	if (args.length > 1) {
		conn.respond(501, 'Syntax error');
		return;
	} else if (!args.length) {
		conn.nextHandler = 'auth_LOGIN';
		conn.respond(334, 'VXNlcm5hbWU6');
		return;
	} else if (canAbort && args[0] === '*') {
		conn.respond(501, 'AUTH aborted');
		return;
	}

	const data = new Buffer(args[0], 'base64').toString();

	if (!data) {
		conn.respond(500, 'Invalid response');
		return;
	}

	const username = usernames.get(conn);

	if (!username) {
		conn.nextHandler = 'auth_LOGIN';

		usernames.set(conn, data);
		conn.respond(334, 'UGFzc3dvcmQ6');
		return;
	}

	usernames.delete(conn);

	await conn.app.hook('auth', conn, {
		method: 'LOGIN',
		username,
		password: data,
		validatePassword: password => password === data
	});
};
