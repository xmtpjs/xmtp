'use strict';

module.exports = middleware => (...args) => {
	let index = -1;

	const dispatch = async i => {
		if (i <= index) {
			throw new Error('next() called multiple times');
		}

		index = i;

		if (!middleware[i]) {
			return Promise.resolve();
		}

		return middleware[i](() => dispatch(i + 1), ...args);
	};

	return dispatch(0);
};
