'use strict';

module.exports = async (next, conn, line) => {
	if (line && line.trim()) {
		conn.respond(501, 'QUIT does not accept arguments - see RFC 5321 Section 4.3.2');
		return null;
	}

	return await next().then(() => {
		conn.respond(221, `${conn.app.get('me')} closing connection.`, () => {
			conn.disconnect();
		});
	});
};
