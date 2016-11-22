'use strict';

const assert		= require('assert');
const Application	= require('../src/application.js');

describe('application', () => {
	it('should set/get instance settings', () => {
		const app = Application();

		app.set('key', 'value');

		assert.equal(app.get('key'), 'value');
	});

	it('should be able to add hooks', () => {
		const app = Application();

		app.use('test', () => null);
		app.use('test2', () => null);
		app.callback();

		assert(app.hook('test'));
	});

	it('should be able to multiple middleware to the same hook', () => {
		const app = Application();

		app.use('test', () => null);
		app.use('test', () => null);
		app.callback();

		assert(app.hook('test'));
	});

	it('should check if hook exists', () => {
		const app = Application();

		app.use('test', () => null);
		app.callback();

		assert(app.hasHook('test'));
	});

	it('should get hooks', () => {
		const app = Application();

		app.use('test', () => null);
		app.callback();

		assert(app.hook('test'));
	});

	it('should resolve if hook is missing', () => {
		const app = Application();

		app.callback();

		assert(app.hook('test'));
	});

	it('should handle errors on Applicaton by default', done => {
		const app = Application();

		app.handleError = () => done();
		app.callback();

		app.emit('error', new Error('boom'));
	});

	it('should handle errors on Applicaton', done => {
		const app = Application();

		app.handleError = () => done(new Error('Bad...'));

		app.on('error', () => done());
		app.callback();

		app.emit('error', new Error('boom'));
	});

	it('should set NODE_ENV env when present', () => {
		const { NODE_ENV } = process.env;

		process.env.NODE_ENV = '123';

		const app = Application();

		process.env.NODE_ENV = NODE_ENV;

		assert.equal(app.env, '123');
	});

	it('should set "development" env when NODE_ENV missing', () => {
		const { NODE_ENV } = process.env;

		process.env.NODE_ENV = '';

		const app = Application();

		process.env.NODE_ENV = NODE_ENV;

		assert.equal(app.env, 'development');
	});

	it('should listen with defaults', done => {
		const app = Application();

		// In case port 25 is unavailable.
		app.once('error', err => {
			if (~err.message.indexOf('EACCES')) {
				done();
			} else {
				done(err);
			}
		});

		assert.equal(app.servers.length, 0);
		app.listen();
		assert.equal(app.servers.length, 1);
	});

	it('should listen on any port', done => {
		const app = Application();

		// In case port 25 is unavailable.
		app.once('error', () => {
			assert.equal(app.servers.length, 1);
			app.listen(1025, '0.0.0.0');
			assert.equal(app.servers.length, 2);
		});

		app.on('listening', done);

		assert.equal(app.servers.length, 0);
		app.listen(25, '0.0.0.0');
		assert.equal(app.servers.length, 1);
	});
});
