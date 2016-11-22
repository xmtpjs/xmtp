'use strict';

const assert	= require('assert');
const constants	= require('../../src/constants.js');
const cmd		= require('../../src/protocol/cmd_mail.js');

describe('protocol/cmd_mail', () => {
	it('should respond 250 with valid address', done => {
		cmd(() => Promise.resolve(), {
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			},
			respond(code) {
				assert.equal(code, 250);
				assert.equal(this.transaction.mailFrom.user, 'user');
				assert.equal(this.transaction.mailFrom.host, 'client.com');

				done();
			}
		}, 'FROM:<user@client.com>');
	});

	it('should respond 250 with valid address and params when ESMTP', done => {
		cmd(() => Promise.resolve(), {
			esmtp: true,
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			},
			respond(code) {
				assert.equal(code, 250);
				assert.equal(this.transaction.mailFrom.user, 'user');
				assert.equal(this.transaction.mailFrom.host, 'client.com');
				assert.deepEqual(this.transaction.mailFrom.params, {
					FOO: 'BAR',
					BAR: 'foo',
					ISNULL: null
				});

				done();
			}
		}, 'FROM:<user@client.com> FOO=BAR bar=foo ISNULL');
	});

	it('should respond 555 with params when not ESMTP', done => {
		cmd(() => Promise.resolve(), {
			esmtp: false,
			heloHost: 'client.com',
			respond(code) {
				assert.equal(code, 555);
				done();
			}
		}, 'FROM:<user@client.com> FOO=BAR bar=foo');
	});

	it('should respond 250 with SIZE param < databytes', done => {
		cmd(() => Promise.resolve(), {
			esmtp: true,
			heloHost: 'client.com',
			app: {
				get() {
					return 100;
				}
			},
			initTransaction() {
				this.transaction = {};
			},
			respond(code) {
				assert.equal(code, 250);
				assert.equal(this.transaction.mailFrom.user, 'user');
				assert.equal(this.transaction.mailFrom.host, 'client.com');
				assert.deepEqual(this.transaction.mailFrom.params, {
					SIZE: '50'
				});

				done();
			}
		}, 'FROM:<user@client.com> SIZE=50');
	});

	it('should respond 550 with SIZE param > databytes', done => {
		cmd(() => Promise.resolve(), {
			esmtp: true,
			heloHost: 'client.com',
			app: {
				get() {
					return 50;
				}
			},
			initTransaction() {
				this.transaction = {};
			},
			respond(code) {
				assert.equal(code, 550);
				done();
			}
		}, 'FROM:<user@client.com> SIZE=100');
	});

	it('should respond 503 when called before EHLO/HELO', done => {
		cmd(() => Promise.resolve(), {
			respond(code) {
				assert.equal(code, 503);
				done();
			}
		});
	});

	it('should respond 501 on bad address', done => {
		cmd(() => Promise.resolve(), {
			heloHost: 'client.com',
			respond(code) {
				assert.equal(code, 501);
				done();
			}
		}, 'FROM:');
	});

	it('should respond 550 on DENY then reset transaction', done => {
		cmd(() => Promise.reject({
			code: constants.deny
		}), {
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			},
			resetTransaction() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
			}
		}, 'FROM:<user@client.com>');
	});

	it('should respond 550 on DENYDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denydisconnect
		}), {
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
			},
			disconnect() {
				done();
			}
		}, 'FROM:<user@client.com>');
	});

	it('should respond 450 on DENYSOFT then reset transaction', done => {
		cmd(() => Promise.reject({
			code: constants.denysoft
		}), {
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			},
			resetTransaction() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
			}
		}, 'FROM:<user@client.com>');
	});

	it('should respond 450 on DENYSOFTDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denysoftdisconnect
		}), {
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
			},
			disconnect() {
				done();
			}
		}, 'FROM:<user@client.com>');
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		cmd(() => Promise.reject(err), {
			heloHost: 'client.com',
			initTransaction() {
				this.transaction = {};
			}
		}, 'FROM:<user@client.com>').catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
