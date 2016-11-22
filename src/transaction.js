'use strict';

// const debug			= require('debug')('mx:transaction');
const Emitter		= require('events').EventEmitter;
const MailParser	= require('mailparser').MailParser;

module.exports = class Transaction extends Emitter {
	constructor() {
		super();

		this.resetting	= false;
		this.mailFrom	= null;
		this.rcptTo		= [];
		this.bytes		= 0;
		this.parser		= new MailParser();
		this.pending	= [];

		this.parser.once('headers', headers => this.emit('headers', headers));

		this.parser.once('end', email => {
			this.email = email;

			this.emit('end', email);
			this.pending.forEach(fn => fn());

			this.pending.length = 0;
		});
	}

	write(line) {
		this.bytes += line.length;

		this.parser.write(line);
	}

	end() {
		this.parser.end();
	}

	/* getHeaders(key) {
		const headerKey = key.toLowerCase();

		const headers = this.email.headers[headerKey];

		if (!headers) {
			return [];
		} else if (!Array.isArray(headers)) {
			return [headers];
		}

		return headers;
	}

	addHeaders(key, values) {
		if (!Array.isArray(values)) {
			this.addHeader(key, values);
			return;
		}

		values.forEach(value => this.addHeader(key, value));
	}

	addHeader(key, value) {
		if (!this.email) {
			this.pending.push(() => this.addHeader(key, value));
			return;
		}

		const headerKey	= key.toLowerCase();
		const header	= this.email.headers[headerKey];

		if (!header) {
			this.email.headers[headerKey] = [value];
		} else if (!Array.isArray(header)) {
			this.email.headers[headerKey] = [header, value];
		} else {
			header.push(value);
		}
	} */

	addLeadingHeader(key, value) {
		if (!this.email) {
			this.pending.push(() => this.addLeadingHeader(key, value));
			return;
		}

		const headerKey	= key.toLowerCase();
		const header	= this.email.headers[headerKey];

		if (!header) {
			this.email.headers[headerKey] = [value];
		} else if (!Array.isArray(header)) {
			this.email.headers[headerKey] = [value, header];
		} else {
			header.unshift(value);
		}
	}

	/* removeHeaders(key) {
		if (!this.email) {
			this.pending.push(() => this.removeHeaders(key));
			return;
		}

		const headerKey = key.toLowerCase();

		this.email.headers[headerKey] = null;

		delete this.email.headers[headerKey];
	} */
};
