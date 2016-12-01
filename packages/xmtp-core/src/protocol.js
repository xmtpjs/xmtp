'use strict';

const path	= require('path');
const debug	= require('debug')('xmtp:protocol');

const dir = path.resolve(__dirname, 'protocol');

const commands = require('fs').readdirSync(dir).reduce((obj, file) => {
	const command = path.basename(file, path.extname(file));

	debug(`Loading protocol handler "${command}"`);
	obj[command] = require(path.resolve(dir, file)); // eslint-disable-line

	return obj;
}, {});

module.exports = app => {
	Object.keys(commands).forEach(cmd => app.use(cmd, commands[cmd]));
};
