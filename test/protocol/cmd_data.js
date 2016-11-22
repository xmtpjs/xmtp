'use strict';

const assert	= require('assert');
const constants	= require('../../src/constants.js');
const cmd		= require('../../src/protocol/cmd_data.js');

describe('protocol/cmd_data', () => {
	it('should respond 501 when arguments present', done => {
		cmd(null, {
			respond(code) {
				assert.equal(code, 501);
				done();
			}
		}, 'foobar');
	});

	it('should respond 503 before a transaction has been created', done => {
		cmd(null, {
			respond(code) {
				assert.equal(code, 503);
				done();
			}
		});
	});

	it('should respond 554 when no recipients and pipelining', done => {
		cmd(null, {
			pipelining: true,
			transaction: {
				rcptTo: []
			},
			respond(code) {
				assert.equal(code, 554);
				done();
			}
		});
	});

	it('should respond 503 when no recipients and not pipelining', done => {
		cmd(null, {
			pipelining: false,
			transaction: {
				rcptTo: []
			},
			respond(code) {
				assert.equal(code, 503);
				done();
			}
		});
	});

	it('should respond 554 on DENY then reset transaction', done => {
		cmd(() => Promise.reject({
			code: constants.deny
		}), {
			transaction: {
				rcptTo: ['user@host.com']
			},
			resetTransaction() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 554);
				cb();
			}
		});
	});

	it('should respond 554 on DENYDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denydisconnect
		}), {
			transaction: {
				rcptTo: ['user@host.com']
			},
			disconnect() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 554);
				cb();
			}
		});
	});

	it('should respond 451 on DENYSOFT then reset transaction', done => {
		cmd(() => Promise.reject({
			code: constants.denysoft
		}), {
			transaction: {
				rcptTo: ['user@host.com']
			},
			resetTransaction() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 451);
				cb();
			}
		});
	});

	it('should respond 451 on DENYSOFTDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denysoftdisconnect
		}), {
			transaction: {
				rcptTo: ['user@host.com']
			},
			disconnect() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 451);
				cb();
			}
		});
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		cmd(() => Promise.reject(err), {
			transaction: {
				rcptTo: ['user@host.com']
			}
		}).catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
