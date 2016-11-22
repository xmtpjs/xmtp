'use strict';

const assert	= require('assert');
const parse		= require('../../src/utils/rfc1869.js');

function doTest(test, expect) {
	const [, type, line] = /^(MAIL|RCPT)\s+(.*)$/.exec(test);

	it(test, () => {
		assert.deepEqual(parse(type.toLowerCase(), line), expect);
	});
}

function doErroredTest(test, expect) {
	const [, type, line] = /^(MAIL|RCPT)\s+(.*)$/.exec(test);

	it(test, () => {
		assert.throws(() => parse(type.toLowerCase(), line, true), expect);
	});
}

describe('utils/rfc1869', () => {
	doTest('MAIL FROM:', ['<>']);
	doTest('MAIL FROM:<>', ['<>']);

	doTest('MAIL FROM:<postmaster>', ['<postmaster>']);

	doTest('MAIL FROM:user', ['user']);
	doTest('MAIL FROM:user size=1234', ['user', 'size=1234']);
	doTest('MAIL FROM:user@domain size=1234', ['user@domain', 'size=1234']);
	doTest('MAIL FROM:<user@domain> size=1234', ['<user@domain>', 'size=1234']);
	doTest('MAIL FROM:<user@domain> somekey', ['<user@domain>', 'somekey']);
	doTest('MAIL FROM:<user@domain> somekey other=foo', ['<user@domain>', 'somekey', 'other=foo']);

	doTest('RCPT TO: 0@mailblog.biz 0=9 1=9', ['<0@mailblog.biz>', '0=9', '1=9']);
	doTest('RCPT TO:<r86x-ray@emailitin.com> state=1', ['<r86x-ray@emailitin.com>', 'state=1']);
	doTest('RCPT TO:<user=name@domain.com> foo=bar', ['<user=name@domain.com>', 'foo=bar']);

	doErroredTest('MAIL FROM:', /Invalid format of mail command:/);
	doErroredTest('MAIL FROM:user', /Invalid format of mail command: user/);
	doErroredTest('MAIL FROM:user size=1234', /Invalid format of mail command: user/);
	doErroredTest('MAIL FROM:user@domain size=1234', /Invalid format of mail command: user@domain/);
	doErroredTest('RCPT TO: 0@mailblog.biz 0=9 1=9', /Invalid format of rcpt command:\s+0@mailblog.biz/);
	doErroredTest('MAIL FROM:<user@domain> user@domain', /Syntax error in parameters/);
	doErroredTest('RCPT TO:<user@domain> user@domain', /Syntax error in parameters/);

	it('throws error on invalid line type', () => {
		assert.throws(() => parse('yolo', ''), /Invalid command "yolo"/);
	});
});
