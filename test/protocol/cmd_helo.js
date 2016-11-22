'use strict';

const assert	= require('assert');
const constants	= require('../../src/constants.js');
const cmd		= require('../../src/protocol/cmd_helo.js');

describe('protocol/cmd_helo', () => {
	it('should respond 501 when no arguments present', done => {
		cmd(null, {
			respond(code) {
				assert.equal(code, 501);
				done();
			}
		});
	});

	it('should respond 501 when argument is empty', done => {
		cmd(null, {
			respond(code) {
				assert.equal(code, 501);
				done();
			}
		}, '');
	});

	it('should respond 550 on DENY', done => {
		cmd(() => Promise.reject({
			code: constants.deny
		}), {
			resetTransaction() {},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
				done();
			}
		}, 'client.com');
	});

	it('should respond 550 on DENYDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denydisconnect
		}), {
			resetTransaction() {},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
			},
			disconnect() {
				done();
			}
		}, 'client.com');
	});

	it('should respond 450 on DENYSOFT', done => {
		cmd(() => Promise.reject({
			code: constants.denysoft
		}), {
			resetTransaction() {},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
				done();
			}
		}, 'client.com');
	});

	it('should respond 550 on DENYSOFTDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denysoftdisconnect
		}), {
			resetTransaction() {},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
			},
			disconnect() {
				done();
			}
		}, 'client.com');
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		cmd(() => Promise.reject(err), {
			resetTransaction() {}
		}, 'client.com').catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
