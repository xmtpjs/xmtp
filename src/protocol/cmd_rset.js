'use strict';

module.exports = async (next, conn, line) => {
	if (line && line.trim()) {
		conn.respond(501, 'RSET does not accept arguments');
		return null;
	}

	return await next().then(() => {
		conn.respond(250, 'OK', () => {
			conn.resetTransaction();
		});
	});
};
