'use strict';

module.exports = async (next, conn) => {
	const responded = await next();

	if (!responded) {
		conn.respond(252, 'Try to send something. I\'ll try my best');
	}
};
