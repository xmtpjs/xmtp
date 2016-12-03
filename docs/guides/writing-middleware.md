# Writing Middleware

XMTP middleware are simple functions which return a `Promise`. The simplest way of writing writing a middleware is by using ES7 `async` functions.

```js
// ES5
function myMiddleware(next) {
	if (condition) {
		return Promise.resolve(true);
	}

	return next().then(function () {
		return doSomething();
	});
}

// ES7
async function myMiddleware(next) {
	if (condition) {
		return true;
	}

	await next();
	return doSomething();
}
```

You can then plugin this middleware into your `xmtp` app:

```js
const xmtp = require('xmtp');
const app = xmtp();

app.use('something', myMiddleware);
```

The suggested way of writing middleware is using ES7 async *arrow* functions, like so:

```js
const xmtp = require('xmtp');
const app = xmtp();

app.use('something', async next => {
	if (condition) {
		return true;
	}

	await next();
	return doSomething();
});
```

## The Call Stack

If you're a front-end developer you can think any code before `await next();` as the "capture" phase, while any code after is the "bubble" phase. This example illustrates how ES7 arrow functions allow us to properly implement stack flows:

```js
const xmtp = require('xmtp');
const app = xmtp();

app.use('something', async next => {
	console.log(1);

	await next();

	console.log(6);
});

app.use('something', async next => {
	console.log(2);

	await next();

	console.log(5);
});

app.use('something', async next => {
	console.log(3);

	await next();

	console.log(4);
});

// Console output: 1 2 3 4 5 6
```

If the `await next();` is omitted, the call stack is cut short:

```js
const xmtp = require('xmtp');
const app = xmtp();

app.use('something', async next => {
	console.log(1);

	await next();

	console.log(6);
});

app.use('something', async next => {
	console.log(2);

	// await next();

	console.log(5);
});

app.use('something', async next => {
	console.log(3);

	await next();

	console.log(4);
});

// Console output: 1 2 5 6
```

## Catching Errors Upstream

```js
const xmtp = require('xmtp');
const app = xmtp();

app.use('something', async next => {
	console.log(1);

	try {
		await next();
	} catch (error) {
		console.log('error');
	}

	// Gets called, due to `catch`
	console.log(6);
});

app.use('something', async next => {
	console.log(2);

	await next();

	// Doesn't get called, due to error
	console.log(5);
});

app.use('something', async next => {
	console.log(3);

	throw new Error('Hello!');

	// Doesn't get called, due to error
	console.log(4);
});

// Console output: 1 2 3 'error' 6
```
