'use strict';

const hasBrackets	= /^<(.*)>$/;
const qchar			= /([^a-zA-Z0-9!#$%&\x27*+\x2D/=?^_`{|}~.])/g; // ` <-- Bad syntax highlighting fix in Atom

const domain		= /(?:(?:\[(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|IPv6:[0-9A-Fa-f:.]+)])|(?:[a-zA-Z0-9](?:[_\-a-zA-Z0-9]*[a-zA-Z0-9])?)(?:\.(?:[a-zA-Z0-9](?:[_\-a-zA-Z0-9]*[a-zA-Z0-9])?))*)/;
const sourceRoute	= new RegExp(`^@${domain.source}(?:,@${domain.source})*:`);

const text			= /\\(.)/g; // eslint-disable-line no-control-regex
const quoted		= new RegExp('^"(.*)"$');

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

		const atSign	= addr.lastIndexOf('@');
		const user		= addr.substr(0, atSign);

		this.host = addr.substr(atSign + 1).toLowerCase();

		const quotedMatches = quoted.exec(user);

		if (quotedMatches) {
			this.user = quotedMatches[1].replace(text, '$1');
		} else {
			this.user = user;
		}
	}
};
