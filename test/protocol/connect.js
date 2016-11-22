'use strict';

const assert	= require('assert');
const constants	= require('../../src/constants.js');
const connect	= require('../../src/protocol/connect.js');

describe('protocol/connect', () => {
	it('should loopRespond 554 on DENY', done => {
		connect(() => Promise.reject({
			code: constants.deny
		}), {
			loopRespond(code) {
				assert.equal(code, 554);
				done();
			}
		});
	});

	it('should respond 554 on DENYDISCONNECT then disconnect', done => {
		connect(() => Promise.reject({
			code: constants.denydisconnect
		}), {
			respond(code, line, cb) {
				assert.equal(code, 554);
				cb();
			},
			disconnect() {
				done();
			}
		});
	});

	it('should respond 554 on DISCONNECT then disconnect', done => {
		connect(() => Promise.reject({
			code: constants.disconnect
		}), {
			respond(code, line, cb) {
				assert.equal(code, 554);
				cb();
			},
			disconnect() {
				done();
			}
		});
	});

	it('should loopRespond 421 on DENYSOFT', done => {
		connect(() => Promise.reject({
			code: constants.denysoft
		}), {
			loopRespond(code) {
				assert.equal(code, 421);
				done();
			}
		});
	});

	it('should respond 554 on DENYSOFTDISCONNECT then disconnect', done => {
		connect(() => Promise.reject({
			code: constants.denysoftdisconnect
		}), {
			respond(code, line, cb) {
				assert.equal(code, 421);
				cb();
			},
			disconnect() {
				done();
			}
		});
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		connect(() => Promise.reject(err)).catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
