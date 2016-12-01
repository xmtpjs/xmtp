'use strict';

const assert	= require('assert');
const compose	= require('../../src/utils/compose.js');

function delay() {
	return new Promise(resolve => setTimeout(resolve, 1));
}

describe('utils/compose', () => {
	it('should work', async () => {
		const arr	= [];
		const stack	= [];

		stack.push(async next => {
			arr.push(1);

			await delay();
			await next();
			await delay();

			arr.push(6);
		});

		stack.push(async next => {
			arr.push(2);

			await delay();
			await next();
			await delay();

			arr.push(5);
		});

		stack.push(async next => {
			arr.push(3);

			await delay();
			await next();
			await delay();

			arr.push(4);
		});

		await compose(stack)();
		assert.deepEqual(arr, [1, 2, 3, 4, 5, 6]);
	});

	it('should be able to be called twice', async () => {
		const stack = [];

		stack.push(async (next, arr) => {
			arr.push(1);

			await delay();
			await next();
			await delay();

			arr.push(6);
		});

		stack.push(async (next, arr) => {
			arr.push(2);

			await delay();
			await next();
			await delay();

			arr.push(5);
		});

		stack.push(async (next, arr) => {
			arr.push(3);

			await delay();
			await next();
			await delay();

			arr.push(4);
		});

		const fn	= compose(stack);
		const ctx1	= [];
		const ctx2	= [];
		const out	= [1, 2, 3, 4, 5, 6];

		await fn(ctx1);
		await fn(ctx2);

		assert.deepEqual(out, ctx1);
		assert.deepEqual(out, ctx2);
	});

	it('should work with 0 middleware', () => compose([])());

	it('should only accept an array', done => {
		compose()().catch(err => {
			assert(err instanceof TypeError);
			done();
		});
	});

	it('should only accept middleware as functions', done => {
		compose([{}])().catch(err => {
			assert(err instanceof TypeError);
			done();
		});
	});

	it('should throw if next() is called multiple times', done => {
		compose([async next => {
			await next();
			await next();
		}])().catch(err => {
			assert(/multiple times/.test(err.message));
			done();
		});
	});
});
