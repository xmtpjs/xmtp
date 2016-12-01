'use strict';

const assert	= require('assert');
const constants	= require('../../src/constants.js');
const cmd		= require('../../src/protocol/cmd_rcpt.js');

describe('protocol/cmd_rcpt', () => {
	it('should respond 250 with valid address', done => {
		cmd(() => Promise.resolve(), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			},
			respond(code) {
				assert.equal(code, 250);
				assert.equal(this.transaction.rcptTo[0].user, 'user');
				assert.equal(this.transaction.rcptTo[0].host, 'client.com');

				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should respond 250 with valid address and params when ESMTP', done => {
		cmd(() => Promise.resolve(), {
			esmtp: true,
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			},
			respond(code) {
				assert.equal(code, 250);
				assert.equal(this.transaction.rcptTo[0].user, 'user');
				assert.equal(this.transaction.rcptTo[0].host, 'client.com');
				assert.deepEqual(this.transaction.rcptTo[0].params, {
					FOO: 'BAR',
					BAR: 'foo'
				});

				done();
			}
		}, 'TO:<user@client.com> FOO=BAR bar=foo');
	});

	it('should respond 555 with params when not ESMTP', done => {
		cmd(() => Promise.resolve(), {
			esmtp: false,
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			respond(code) {
				assert.equal(code, 555);
				done();
			}
		}, 'TO:<user@client.com> FOO=BAR bar=foo');
	});

	it('should respond 503 when called before MAIL', done => {
		cmd(() => Promise.resolve(), {
			respond(code) {
				assert.equal(code, 503);
				done();
			}
		});
	});

	it('should respond 501 on bad address', done => {
		cmd(() => Promise.resolve(), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			respond(code) {
				assert.equal(code, 501);
				done();
			}
		}, 'TO:');
	});

	it('should respond 250 with successful `rcpt` hook', done => {
		cmd(() => Promise.resolve(), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return true;
				},
				hook() {
					return true;
				}
			},
			respond(code) {
				assert.equal(code, 250);
				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should respond 550 with failing `rcpt` hook', done => {
		cmd(() => Promise.resolve(), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return true;
				},
				hook() {
					return false;
				}
			},
			respond(code, msg, cb) {
				assert.equal(code, 550);

				assert.equal(this.transaction.rcptTo.length, 1);
				cb();
				assert.equal(this.transaction.rcptTo.length, 0);

				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should respond 550 on DENY', done => {
		cmd(() => Promise.reject({
			code: constants.deny
		}), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			},
			respond(code, line, cb) {
				assert.equal(code, 550);

				assert.equal(this.transaction.rcptTo.length, 1);
				cb();
				assert.equal(this.transaction.rcptTo.length, 0);

				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should respond 550 on DENYDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denydisconnect
		}), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
			},
			disconnect() {
				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should respond 450 on DENYSOFT', done => {
		cmd(() => Promise.reject({
			code: constants.denysoft
		}), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			},
			respond(code, line, cb) {
				assert.equal(code, 450);

				assert.equal(this.transaction.rcptTo.length, 1);
				cb();
				assert.equal(this.transaction.rcptTo.length, 0);

				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should respond 450 on DENYSOFTDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denysoftdisconnect
		}), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
			},
			disconnect() {
				done();
			}
		}, 'TO:<user@client.com>');
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		cmd(() => Promise.reject(err), {
			transaction: {
				mailFrom: 'user@client.com',
				rcptTo: []
			},
			app: {
				hasHook() {
					return false;
				}
			}
		}, 'TO:<user@client.com>').catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
