'use strict';

const days		= ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months	= [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function pad(value) {
	const str = value.toString();

	if (str.length === 2) {
		return str;
	}

	return `0${str}`;
}

function toString(date) {
	return [
		`${days[date.getDay()]}, ${pad(date.getDate(), 2)}`,
		months[date.getMonth()],
		date.getFullYear(),
		`${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}`,
		date.toString().match(/\sGMT([+-]\d+)/)[1]
	].join(' ');
}

module.exports.toString = toString;
