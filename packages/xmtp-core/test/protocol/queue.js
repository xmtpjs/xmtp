'use strict';

const assert	= require('assert');
const constants	= require('../../src/constants.js');
const cmd		= require('../../src/protocol/queue.js');

describe('protocol/queue', () => {
	it('should call `queue_ok` hook on success', done => {
		cmd(() => Promise.resolve(), {
			app: {
				hook(hook) {
					assert.equal(hook, 'queue_ok');
					done();
				}
			}
		});
	});

	it('should respond 550 on DENY then reset transaction', done => {
		cmd(() => Promise.reject({
			code: constants.deny
		}), {
			resetTransaction() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
			}
		});
	});

	it('should respond 550 on DENYDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denydisconnect
		}), {
			disconnect() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 550);
				cb();
			}
		});
	});

	it('should respond 450 on DENYSOFT then reset transaction', done => {
		cmd(() => Promise.reject({
			code: constants.denysoft
		}), {
			resetTransaction() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
			}
		});
	});

	it('should respond 450 on DENYSOFTDISCONNECT then disconnect', done => {
		cmd(() => Promise.reject({
			code: constants.denysoftdisconnect
		}), {
			disconnect() {
				done();
			},
			respond(code, line, cb) {
				assert.equal(code, 450);
				cb();
			}
		});
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		cmd(() => Promise.reject(err)).catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
