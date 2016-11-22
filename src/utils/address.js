'use strict';

const hasBrackets	= /^<(.*)>$/;
const qchar			= /([^a-zA-Z0-9!#$%&\x27*+\x2D/=?^_`{|}~.])/g;

const domain		= /(?:(?:\[(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|IPv6:[0-9A-Fa-f:.]+)])|(?:[a-zA-Z0-9](?:[_\-a-zA-Z0-9]*[a-zA-Z0-9])?)(?:\.(?:[a-zA-Z0-9](?:[_\-a-zA-Z0-9]*[a-zA-Z0-9])?))*)/;
const sourceRoute	= new RegExp(`^@${domain.source}(?:,@${domain.source})*:`);
const userHost		= new RegExp(`^(.*)@(${domain.source})$`);

const atom			= /[a-zA-Z0-9!#%&*+=?^_`{|}~$\x27\x2D/]+/;
const atoms			= new RegExp(`^${atom.source}(\\.${atom.source})*`);

const qtext			= /[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]/; // eslint-disable-line no-control-regex
const text			= /\\([\x01-\x09\x0B\x0C\x0E-\x7F])/; // eslint-disable-line no-control-regex
const quoted		= new RegExp(`^"((${qtext.source}|${text.source})*)"$`);

module.exports = class Address {
	constructor(user, host) {
		if (host) {
			this.original	= `${user}@${host}`;
			this.user		= user;
			this.host		= host;
			return;
		}

		const match = hasBrackets.exec(user);

		if (match) {
			this.original = user;
			this.parse(match[1]);
		} else {
			this.original = user;
			this.parse(user);
		}
	}

	address() {
		return (this.user || '') + (this.host ? (`@${this.host}`) : '');
	}

	format() {
		if (!this.user) {
			return '<>';
		}

		const user = this.user.replace(qchar, '\\$1');

		if (user !== this.user) {
			return `<"${user}"${this.host ? (`@${this.host}`) : ''}>`;
		}

		return `<${this.address()}>`;
	}

	toString() {
		return this.format();
	}

	parse(address) {
		// Strip source route
		const addr = address.replace(sourceRoute, '');

		if (addr === '') {
			this.user = null;
			this.host = null;
			return;
		}

		// bare postmaster is permissible: RFC-2821 (4.5.1)
		if (addr.toLowerCase() === 'postmaster') {
			this.user = 'postmaster';
			this.host = null;
			return;
		}

		const matches = userHost.exec(addr);

		if (!matches) {
			throw new Error(`Invalid domain in address: ${addr}`);
		}

		this.host = matches[2].toLowerCase();

		if (atoms.test(matches[1])) {
			this.user = matches[1];
			return;
		}

		const quotedMatches = quoted.exec(matches[1]);

		if (!matches) {
			throw new Error(`Invalid local part in address: ${addr}`);
		}

		this.user = quotedMatches[1].replace(text, '$1', 'g');
	}
};
