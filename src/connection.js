'use strict';

const debug			= require('debug')('xmtp:connection');
const constants		= require('./constants.js');
const Transaction	= require('./transaction');
const dateUtils		= require('./utils/date.js');

const states = {
	STATE_CMD: 1,
	STATE_LOOP: 2,
	STATE_DATA: 3,
	STATE_PAUSE: 4,
	STATE_PAUSE_SMTP: 5,
	STATE_PAUSE_DATA: 6,
	STATE_DISCONNECTING: 99,
	STATE_DISCONNECTED: 100
};

function indexOfLF(buf, maxLength) {
	for (let i = 0; i < buf.length; i++) {
		if (maxLength && i === maxLength) {
			break;
		}

		if (buf[i] === 0x0a) {
			return i;
		}
	}

	return -1;
}

module.exports = class Connection {
	constructor(app, socket, server) {
		this.app	= app;
		this.socket	= socket;
		this.server	= server;
		this.errors = 0;
		this.state	= states.STATE_PAUSE;
		this.esmtp = false;

		try {
			this.setup();
		} catch (error) {
			app.emit('error', error);
			return;
		}

		debug(`connect ip=${socket.remoteAddress} port=${socket.remotePort}`);

		app.hook('connect', this).catch(error => {
			app.emit('error', error);
		});
	}

	static get states() {
		return states;
	}

	setup() {
		if (!this.socket.remoteAddress) {
			debug('No IP was provided');
			this.socket.destroy();

			throw new Error('No IP was provided');
		}

		this.socket.on('end', this.disconnect.bind(this));
		this.socket.on('close', this.disconnect.bind(this));

		this.socket.on('error', err => {
			if (this.state >= states.STATE_DISCONNECTING) {
				return;
			}

			debug('Connection Error: %s', err);
			this.disconnect();
		});

		this.socket.on('timeout', () => {
			if (this.state >= states.STATE_DISCONNECTING) {
				return;
			}

			this.respond(421, 'timeout', this.disconnect.bind(this));
		});

		this.socket.on('data', data => this.processData(data));
	}

	respond(code, msg, func = () => null) {
		if (this.state === states.STATE_DISCONNECTED) {
			func();
			return;
		}

		if (typeof msg === 'object' && msg.constructor.name === 'DSN') {
			code	= msg.code; // eslint-disable-line no-param-reassign
			msg		= msg.reply; // eslint-disable-line no-param-reassign
		}

		const messages = Array.isArray(msg) ?
			msg.filter(line => /\S/.test(line)) :
			msg.split(/\n/);

		let message = '';

		while (messages.length) {
			const mess = messages.shift();
			const line = code + (messages.length ? '-' : ' ') + mess;

			message += `${line}\r\n`;

			debug(`S: ${line}`);
		}

		try {
			this.socket.write(message);
		} catch (e) {
			this.disconnect();
			return;
		}

		if (this.state !== states.STATE_LOOP) {
			this.state = states.STATE_CMD;
		}

		func();
		this.processCurrentData();
	}

	loopRespond(code, msg) {
		if (this.state >= states.STATE_DISCONNECTING) {
			return;
		}

		this.state		= states.STATE_LOOP;
		this.loopCode	= code;
		this.loopMsg	= msg;

		this.respond(code, msg);
	}

	pause() {
		if (this.state >= states.STATE_DISCONNECTING) {
			return;
		}

		this.socket.pause();

		if (this.state !== states.STATE_PAUSE_DATA) {
			this.prevState = this.state;
		}

		this.state = states.STATE_PAUSE_DATA;
	}

	resume() {
		if (this.state >= states.STATE_DISCONNECTING) {
			return;
		}

		this.socket.resume();

		if (this.prevState) {
			this.state		= this.prevState;
			this.prevState	= null;
		}

		setImmediate(() => this.processCurrentData());
	}

	async resetTransaction() {
		if (this.transaction && this.transaction.resetting === false) {
			this.transaction.resetting = true;

			this.pause();
			await this.app.hook('reset_transaction');

			this.transaction = null;

			this.resume();
		} else {
			this.transaction = null;
		}
	}

	async initTransaction() {
		await this.resetTransaction();

		this.transaction = new Transaction();
	}

	async disconnect() {
		if (this.state >= states.STATE_DISCONNECTING) {
			return;
		}

		this.state = states.STATE_DISCONNECTING;

		await this.resetTransaction();
		await this.app.hook('disconnect').catch(error => this.app.emit('error', error));

		debug('disconnect %s', [
			`ip=${this.socket.remoteAddress}`,
			// 'rdns="' + ((this.remote_host) ? this.remote_host : '') + '"',
			`helo="${this.heloHost ? this.heloHost : ''}"`,
			// 'relay=' + (this.relaying ? 'Y' : 'N'),
			`early=${this.early_talker ? 'Y' : 'N'}`,
			`esmtp=${this.esmtp ? 'Y' : 'N'}`,
			// 'tls='   + (this.using_tls ? 'Y' : 'N'),
			`pipe=${this.pipelining ? 'Y' : 'N'}`,
			// 'errors='+ this.errors,
			// 'txns='  + this.tran_count,
			// 'rcpts=' + this.rcpt_count.accept + '/' +
				//    this.rcpt_count.tempfail + '/' +
				//    this.rcpt_count.reject,
			// 'msgs='  + this.msg_count.accept + '/' +
				//    this.msg_count.tempfail + '/' +
				//    this.msg_count.reject,
			// 'bytes=' + this.totalbytes,
			// 'lr="'   + ((this.last_reject) ? this.last_reject : '') + '"',
			`time=${(Date.now() - this.start_time) / 1000}`
		].join(' '));

		this.state = states.STATE_DISCONNECTED;
		this.socket.end();
	}

	async processData(data) {
		if (this.state >= states.STATE_DISCONNECTING) {
			debug(`Data after disconnect from ${this.socket.remoteAddress}`);
			return;
		}

		if (!this.currentData || !this.currentData.length) {
			this.currentData = Buffer.from(data);
		} else {
			this.currentData = Buffer.concat(
				[this.currentData, data],
				this.currentData.length + data.length
			);
		}

		await this.processCurrentData();
	}

	async processCurrentData() {
		if (this.state >= states.STATE_DISCONNECTING) {
			return;
		}

		let maxLength = this.app.get('max_line_length');

		if (this.state === states.STATE_PAUSE_DATA || this.state === states.STATE_DATA) {
			maxLength = this.app.get('max_data_line_length');
		}

		while (this.currentData) {
			const offset = indexOfLF(this.currentData, maxLength);

			if (offset === -1) {
				break;
			} else if (this.state === states.STATE_PAUSE_DATA) {
				return;
			}

			const line = this.currentData.slice(0, offset + 1);

			if (
				(this.state === states.STATE_PAUSE || this.state === states.STATE_PAUSE_SMTP)
				&& this.esmtp
			) {
				const cmd = line.toString('ascii').slice(0, 4).toUpperCase();
				let valid = true;

				switch (cmd) {
					case 'RSET':
					case 'MAIL':
					case 'RCPT':
						break;

					default:
						valid = line.length === this.currentData.length;
						break;
				}

				if (valid) {
					this.pipelining = true;
					debug(`Pipelining: ${line}`);
				} else {
					this.earlyTalker = true;
					debug(`Early Talker: state=${this.state} esmtp=${this.esmtp} line=${line}`);
					setImmediate(() => this.processCurrentData());
				}

				break;
			} else {
				this.currentData = this.currentData.slice(line.length);
				await this.processLine(line);
			}
		}

		if (
			this.currentData
			&& this.currentData.length > maxLength
            && indexOfLF(this.currentData, maxLength) === -1
		) {
			if (this.state !== states.STATE_DATA && this.state !== states.STATE_PAUSE_DATA) {
				this.socket.pause();
				this.currentData = null;

				this.respond(521, 'Command line too long', () => this.disconnect());
			} else {
				this.currentData = Buffer.concat([
					this.currentData.slice(0, maxLength - 2),
					new Buffer('\r\n ', 'utf8'),
					this.currentData.slice(maxLength - 2)
				], this.currentData.length + 3);

				await this.processCurrentData();
			}
		}
	}

	async processLine(buf) {
		if (this.state >= states.STATE_DISCONNECTING) {
			debug(`Data after disconnect from ${this.socket.remoteAddress}`);
			return;
		} else if (this.state === states.STATE_DATA) {
			this.accumulateData(buf);
			return;
		}

		const line = buf.toString('binary').replace(/\r?\n/, '');

		if (/[^\x00-\x7F]/.test(line)) { // eslint-disable-line no-control-regex
			this.respond(501, 'Syntax error (8-bit characters not allowed)');
			return;
		}

		if (this.state === states.STATE_CMD) {
			this.state = states.STATE_PAUSE_SMTP;

			let [, method, , remaining]	= /^([^ ]*)( +(.*))?$/.exec(line);
			let command					= `cmd_${method.toLowerCase()}`;

			debug(`C: ${method} %s`, remaining || '');

			if (this.nextHandler) {
				command				= method = this.nextHandler;
				remaining			= line;
				this.nextHandler	= false;
			}

			if (this.app.hasHook(command)) {
				await this.app.hook(command, this, remaining || '').catch(error => {
					this.app.emit('error', error);
					this.respond(421, 'Internal Server Error', () => this.disconnect());
				});
			} else {
				const handled = await this.app.hook('unrecognized_cmd', this, line).catch(error => {
					this.app.emit('error', error);
					this.respond(421, 'Internal Server Error', () => this.disconnect());
				});

				if (!handled) {
					this.respond(500, 'Unrecognized command');
				}
			}
		} else if (this.state === states.STATE_LOOP) {
			if (line.toUpperCase() === 'QUIT') {
				debug('C: QUIT');
				await this.app.hook('cmd_quit', this);
			} else {
				this.respond(this.loopCode, this.loopMsg);
			}
		}
	}

	accumulateData(line) {
		if (
			line.length === 3
			&& line[0] === 0x2e
			&& line[1] === 0x0d
			&& line[2] === 0x0a
		) {
			this.transaction.once('end', () => this.handleTransactionEnd());
			this.transaction.end();
		} else if (
			line.length === 2
			&& line[0] === 0x2e
			&& line[1] === 0x0a
		) {
			debug('Client sent bare line-feed - .\\n rather than .\\r\\n');
			this.respond(451, 'Invalid bare line-feed', () => this.resetTransaction());
		} else {
			if (this.transaction.bytes + line.length > this.app.get('databytes')) {
				this.transaction.bytes += line.length;
				return;
			}

			this.transaction.write(line);
		}
	}

	async handleTransactionEnd() {
		this.state = states.STATE_CMD;

		this.pause();

		if (this.transaction.bytes > this.app.get('databytes')) {
			this.respond(550, 'Message too big!', () => this.resetTransaction());
			return;
		}

		this.transaction.addLeadingHeader('Received', [
			`from ${this.heloHost} (${this.socket.remoteAddress})`,
			`by ${this.app.get('me')} with ${this.greeting}`,
			`envelope-from ${this.transaction.mailFrom};`,
			dateUtils.toString(new Date())
		].join('\n\t'));

		await this.app.hook('parse_end', this).then(() => this.app.hook('queue', this), error => {
			switch (error.code) {
				case constants.deny:
					this.respond(550, 'Message denied', () => this.resetTransaction());
					break;

				case constants.denydisconnect:
					this.respond(550, 'Message denied', () => this.disconnect());
					break;

				case constants.denysoft:
					this.respond(450, 'Message temporarily denied', () => this.resetTransaction());
					break;

				case constants.denysoftdisconnect:
					this.respond(450, 'Message temporarily denied', () => this.disconnect());
					break;

				default:
					throw error;
			}
		}).catch(error => {
			this.app.emit('error', error);
			this.respond(421, 'Internal Server Error', () => this.disconnect());
		});
	}
};
