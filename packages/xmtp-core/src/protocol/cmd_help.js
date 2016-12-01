'use strict';

module.exports = async (next, conn) => await next().then(() => {
	conn.respond(214, 'See https://tools.ietf.org/html/rfc5321 for details');
});
