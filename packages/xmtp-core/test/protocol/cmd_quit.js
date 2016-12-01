'use strict';

const assert	= require('assert');
const cmd		= require('../../src/protocol/cmd_quit.js');

describe('protocol/cmd_quit', () => {
	it('should respond 221 when no arguments present then disconnect', done => {
		cmd(() => Promise.resolve(), {
			app: {
				get() {
					return 'server.com';
				}
			},
			respond(code, line, cb) {
				assert.equal(code, 221);
				cb();
			},
			disconnect() {
				done();
			}
		});
	});

	it('should respond 501 when arguments present', done => {
		cmd(null, {
			respond(code) {
				assert.equal(code, 501);
				done();
			}
		}, 'foobar');
	});

	it('should rethrow unsupported errors', done => {
		const err = new Error('boom');

		cmd(() => Promise.reject(err), {}).catch(error => {
			assert.equal(error, err);
			done();
		});
	});
});
