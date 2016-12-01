'use strict';

const assert	= require('assert');
const Address	= require('../../src/utils/address.js');

function doTest(address, user, host) {
	it(address, () => {
		const addr = new Address(address);

		assert.equal(addr.user, user);
		assert.equal(addr.host, host);
	});
}

describe('utils/address', () => {
	doTest('<>', null, null);
	doTest('<postmaster>', 'postmaster', null);
	doTest('<user@host>', 'user', 'host');
	doTest('<"user@userhost"@host>', 'user@userhost', 'host');
	doTest('<us er@host>', 'us er', 'host');
	doTest('<user@h.o.st>', 'user', 'h.o.st');
	doTest('user@h.o.st', 'user', 'h.o.st');

	it('new Address(user, host)', () => {
		const addr = new Address('user', 'host');

		assert.equal(addr.user, 'user');
		assert.equal(addr.host, 'host');
	});

	it('throws <user@host#>', () => {
		assert.throws(() => new Address('<user@host#>'), /Invalid domain in address/);
	});

	it('throws <user@host.>', () => {
		assert.throws(() => new Address('<user@host.>'), /Invalid domain in address/);
	});

	it('throws <user@host>.', () => {
		assert.throws(() => new Address('<user@host>.'), /Invalid domain in address/);
	});

	describe('formatting', () => {
		it('<>', () => {
			const addr = new Address('<>');

			assert.equal(addr.toString(), '<>');
		});

		it('<postmaster>', () => {
			const addr = new Address('<postmaster>');

			assert.equal(addr.toString(), '<postmaster>');
		});

		it('<user@host>', () => {
			const addr = new Address('<user@host>');

			assert.equal(addr.toString(), '<user@host>');
		});

		it('<"user@userhost"@host>', () => {
			const addr = new Address('<"user@userhost"@host>');

			assert.equal(addr.toString(), '<"user\\@userhost"@host>');
		});

		it('new Address(user@userhost, host)', () => {
			const addr = new Address('user@userhost', 'host');

			assert.equal(addr.toString(), '<"user\\@userhost"@host>');
		});
	});
});
