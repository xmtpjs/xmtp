'use strict';

const assert		= require('assert');
const Emitter		= require('events').EventEmitter;
const Application	= require('../src/application.js');
const Connection	= require('../src/connection.js');

function createFakeConn() {
	const conn = new Emitter();

	conn.remoteAddress	= '0.0.0.0';
	conn.remotePort		= 25;
	conn.pause			= () => null;
	conn.resume			= () => null;
	conn.write			= () => null;
	conn.end			= () => null;

	return conn;
}

describe('connection', () => {
	it('should instantiate', () => {
		const app	= Application();
		const conn	= createFakeConn();

		app.callback();

		const connection = new Connection(app, conn);

		assert.equal(connection.app, app);
		assert.deepEqual(connection.conn, conn);
		assert.equal(connection.state, Connection.states.STATE_PAUSE);
	});

	it('should destroy the connection when no IP', done => {
		const app	= Application();
		const conn	= createFakeConn();

		app.on('error', () => null);

		conn.remoteAddress	= null;
		conn.destroy		= done;

		app.callback()(conn);
	});

	it('should handle connection end', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let connection;

		app.callback();

		conn.write = () => {
			conn.write = () => null;

			assert.equal(connection.state, Connection.states.STATE_PAUSE);
			conn.emit('end');
			assert.equal(connection.state, Connection.states.STATE_DISCONNECTING);

			conn.end = () => {
				assert.equal(connection.state, Connection.states.STATE_DISCONNECTED);
				done();
			};
		};

		connection = new Connection(app, conn);
	});

	it('should handle connection close', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let connection;

		app.callback();

		conn.write = () => {
			conn.write = () => null;

			assert.equal(connection.state, Connection.states.STATE_PAUSE);
			conn.emit('close');
			assert.equal(connection.state, Connection.states.STATE_DISCONNECTING);

			conn.end = () => {
				assert.equal(connection.state, Connection.states.STATE_DISCONNECTED);
				done();
			};
		};

		connection = new Connection(app, conn);
	});

	it('should handle connection error', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let connection;

		app.callback();

		conn.write = () => {
			conn.write = () => null;

			assert.equal(connection.state, Connection.states.STATE_PAUSE);
			conn.emit('error');
			assert.equal(connection.state, Connection.states.STATE_DISCONNECTING);

			conn.end = () => {
				assert.equal(connection.state, Connection.states.STATE_DISCONNECTED);
				done();
			};
		};

		connection = new Connection(app, conn);
	});

	it('should handle multiple connection errors', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let connection;

		app.callback();

		conn.write = () => {
			conn.write = () => null;

			assert.equal(connection.state, Connection.states.STATE_PAUSE);
			conn.emit('error');
			assert.equal(connection.state, Connection.states.STATE_DISCONNECTING);
			conn.emit('error');

			conn.end = () => {
				assert.equal(connection.state, Connection.states.STATE_DISCONNECTED);
				done();
			};
		};

		connection = new Connection(app, conn);
	});

	it('should handle connection timeouts', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let connection;

		app.callback();

		conn.write = () => {
			conn.write = () => null;

			assert.equal(connection.state, Connection.states.STATE_PAUSE);
			conn.emit('timeout');
			assert.equal(connection.state, Connection.states.STATE_DISCONNECTING);

			conn.end = () => {
				assert.equal(connection.state, Connection.states.STATE_DISCONNECTED);
				done();
			};
		};

		connection = new Connection(app, conn);
	});

	it('should handle multiple connection timeouts', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let connection;

		app.callback();

		conn.write = () => {
			conn.write = () => null;

			assert.equal(connection.state, Connection.states.STATE_PAUSE);
			conn.emit('timeout');
			assert.equal(connection.state, Connection.states.STATE_DISCONNECTING);
			conn.emit('timeout');

			conn.end = () => {
				assert.equal(connection.state, Connection.states.STATE_DISCONNECTED);
				done();
			};
		};

		connection = new Connection(app, conn);
	});

	it('should disconnect on write error', done => {
		const app	= Application();
		const conn	= createFakeConn();

		conn.write = () => {
			throw new Error('boom');
		};

		app.use('disconnect', () => done());
		app.callback()(conn);
	});

	it('should handle SMTP commands properly', done => {
		const app	= Application();
		const conn	= createFakeConn();

		let commands = 0;

		conn.write = data => {
			conn.write = () => null;
			assert.equal(data.trim(), '220 localhost ESMTP Server');
			process.nextTick(() => conn.emit('data', 'HELO client.com\r\n'));
		};

		app.use('cmd_helo', async (next, c) => {
			assert.equal(commands++, 0);
			assert.equal(c.transaction, null);
			assert.equal(c.greeting, 'HELO');
			assert.equal(c.heloHost, 'client.com');

			conn.write = data => {
				conn.write = () => null;
				assert.equal(c.esmtp, false);
				assert.equal(data.trim(), '250 localhost');
				process.nextTick(() => conn.emit('data', 'EHLO client.com\r\n'));
			};
		});

		app.use('cmd_ehlo', async (next, c) => {
			assert.equal(commands++, 1);
			assert.equal(c.transaction, null);
			assert.equal(c.greeting, 'EHLO');
			assert.equal(c.heloHost, 'client.com');

			conn.write = data => {
				conn.write = () => null;
				assert.equal(c.esmtp, true);
				assert.equal(data.split(/\r?\n/)[0], '250-localhost');
				process.nextTick(() => conn.emit('data', 'MAIL FROM:<user@host.com>\r\n'));
			};
		});

		app.use('cmd_mail', async (next, c) => {
			assert.equal(commands++, 2);
			assert.equal(c.transaction.mailFrom.user, 'user');
			assert.equal(c.transaction.mailFrom.host, 'host.com');

			conn.write = data => {
				conn.write = () => null;
				assert.equal(data.trim(), '250 OK');
				process.nextTick(() => conn.emit('data', 'RCPT TO:<user@client.com>\r\n'));
			};
		});

		app.use('cmd_rcpt', async (next, c) => {
			assert.equal(commands++, 3);
			assert.equal(c.transaction.rcptTo[0].user, 'user');
			assert.equal(c.transaction.rcptTo[0].host, 'client.com');

			conn.write = data => {
				conn.write = () => null;
				assert.equal(data.trim(), '250 OK');
				process.nextTick(() => conn.emit('data', 'DATA\r\n'));
			};
		});

		app.use('cmd_data', async () => {
			assert.equal(commands++, 4);

			conn.write = data => {
				conn.write = () => null;
				assert.equal(data.trim(), '354 OK');
				process.nextTick(() => conn.emit('data', `From: user@host.com
To: user@client.com
Subject: Test
Date: Thu, 01 Jan 1970 00:00:00 -0500
Content-Type: text/plain

Body
.\r\n`));
			};
		});

		app.use('parse_end', async (next, c) => {
			assert.equal(commands++, 5);
			assert.equal(c.transaction.email.subject, 'Test');

			conn.write = data => {
				conn.write = () => null;
				assert.equal(data.trim(), '250 Message accepted');
				process.nextTick(() => conn.emit('data', 'QUIT\r\n'));
			};
		});

		app.use('cmd_quit', async () => {
			assert.equal(commands++, 6);

			conn.write = data => {
				conn.write = () => null;
				assert.equal(data.trim(), '221 localhost closing connection.');
				done();
			};
		});

		app.callback()(conn);
	});

	it('should allow QUIT on loop state', done => {
		const app	= Application();
		const conn	= createFakeConn();

		app.use('cmd_quit', () => done());
		app.callback();

		const connection = new Connection(app, conn);

		connection.loopRespond(0, '');

		conn.emit('data', 'QUIT\r\n');
	});
});
