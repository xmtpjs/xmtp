'use strict';

const notes = new WeakMap();

module.exports = () => app => {
	app.use('capabilities', async (next, conn, capabilities) => {
		capabilities.push('CHUNKING', 'BINARYMIME');
		await next();
	});

	app.use('cmd_bdat', async (next, conn, line) => {
		if (!conn.transaction || !conn.transaction.rcptTo.length) {
			conn.errors++;
			conn.respond(503, 'Bad sequence of commands');
			return;
		} else if (!/\d/.test(line)) {
			conn.errors++;
			conn.respond(501, 'Syntax error');
			return;
		}

		const [, size, last] = line.match(/^(?:BDAT )?(\d+)(?: (LAST))?$/i);

		notes.set(conn, {
			size,
			last,
			currentSize: 0
		});

		if (size > 0) {
			conn.nextHandler	= 'bdat';
			conn.state			= conn.constructor.states.STATE_CMD;
		} else {
			app.hook('bdat', conn, '');
		}
	});

	app.use('bdat', async (next, conn, line) => {
		const note		= notes.get(conn);
		const newData	= Buffer.from(`${line}\r\n`, 'binary');

		note.currentSize += newData.length;

		if (note.currentSize < note.size) {
			conn.nextHandler	= 'bdat';
			conn.state			= conn.constructor.states.STATE_CMD;
			conn.accumulateData(newData);
			return;
		}

		if (note.last) {
			notes.delete(conn);
			conn.accumulateData(Buffer.from('.\r\n'));
		} else {
			conn.nextHandler = 'cmd_bdat';
			conn.respond(250, `Message OK. ${newData.length} octets received.`);
		}
	});
};
