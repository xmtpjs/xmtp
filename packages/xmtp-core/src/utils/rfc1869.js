'use strict';

// RFC 1869 command parser

// 6.  MAIL FROM and RCPT TO Parameters
// [...]
//
//   esmtp-cmd		::= inner-esmtp-cmd [SP esmtp-parameters] CR LF
//   esmtp-parameters ::= esmtp-parameter *(SP esmtp-parameter)
//   esmtp-parameter  ::= esmtp-keyword ["=" esmtp-value]
//   esmtp-keyword	::= (ALPHA / DIGIT) *(ALPHA / DIGIT / "-")
//
//						; syntax and values depend on esmtp-keyword
//   esmtp-value	  ::= 1*<any CHAR excluding "=", SP, and all
//						   control characters (US ASCII 0-31
//						   inclusive)>
//
//						; The following commands are extended to
//						; accept extended parameters.
//   inner-esmtp-cmd  ::= ("MAIL FROM:" reverse-path)   /
//						("RCPT TO:" forward-path)

const chew = /\s+([A-Za-z0-9][A-Za-z0-9-]*(?:=[^= \x00-\x1f]+)?)$/; // eslint-disable-line no-control-regex

module.exports = (type, line, strict) => {
	const params = [];

	let data = `${line}`.replace(/\s*$/, '');

	if (type === 'mail') {
		data = data.replace(strict ? /from:/i : /from:\s*/i, '');
	} else if (type === 'rcpt') {
		data = data.replace(strict ? /to:/i : /to:\s*/i, '');
	} else {
		throw new Error(`Invalid command "${type}"`);
	}

	while (true) { // eslint-disable-line no-constant-condition
		const oldLength = data.length;

		data = data.replace(chew, (str, p1) => {
			params.unshift(p1);
			return '';
		});

		if (oldLength === data.length) {
			break;
		}
	}

	// the above will "fail" (i.e. all of the line in params) on
	// some addresses without <> like
	//	MAIL FROM: user=name@example.net
	// or RCPT TO: postmaster

	// let's see if $data contains nothing and use the first value as address:
	if (data.length) {
		// parameter syntax error, i.e. not all of the arguments were
		// stripped by the while() loop:
		if (data.match(/@.*\s/)) {
			throw new Error(`Syntax error in parameters (${data})`);
		}

		params.unshift(data);
	}

	data = params.shift() || '';

	if (strict) {
		if (!data.match(/^<.*>$/)) {
			throw new Error(`Invalid format of ${type} command: ${data}`);
		}
	}

	if (type === 'mail') {
		if (!data.length) {
			return ['<>']; // 'MAIL FROM:' --> 'MAIL FROM:<>'
		}

		if (data.match(/@.*\s/)) {
			throw new Error('Syntax error in parameters');
		}
	} else if (data.match(/@.*\s/)) {
		throw new Error('Syntax error in parameters');
	} else {
		if (data.match(/\s/)) {
			throw new Error('Syntax error in parameters');
		}

		if (data.match(/@/)) {
			if (!data.match(/^<.*>$/)) {
				data = `<${data}>`;
			}
		} else if (!data.match(/^(postmaster|abuse)$/i)) {
			throw new Error('Syntax error in address');
		}
	}

	params.unshift(data);

	return params;
};
