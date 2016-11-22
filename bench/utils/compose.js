'use strict';

const compose = require('../../src/utils/compose.js');

suite('compose', () => {
	set('type', 'adaptive'); // eslint-disable-line no-undef
	set('mintime', 1000); // eslint-disable-line no-undef
	set('delay', 100); // eslint-disable-line no-undef

	const logic	= () => Promise.resolve(true);
	const fn	= next => logic().then(next).then(logic);

	for (let exp = 0; exp <= 10; exp++) {
		const count = 2 ** exp;
		const arr = [];

		for (let i = 0; i < count; i++) {
			arr.push(fn);
		}

		const stack = compose(arr);

		bench(`(fn * ${count})`, done => { // eslint-disable-line no-undef
			stack({}).then(done, done);
		});
	}
});
