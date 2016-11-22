'use strict';

const path	= require('path');
const debug	= require('debug')('mx:protocol');

const dir = path.resolve(__dirname, 'protocol');

const commands = require('fs').readdirSync(dir).reduce((prev, file) => {
	const command = path.basename(file, path.extname(file));

	debug(`Loading protocol handler "${command}"`);
	prev[command] = require(path.resolve(dir, file)); // eslint-disable-line

	return prev;
}, {});

// quit
// - proxy
// x internalcmd
// rset
// x vrfy
// noop
// help
// mail
// rcpt
// data

module.exports = app => {
	Object.keys(commands).forEach(cmd => app.use(cmd, commands[cmd]));
};
