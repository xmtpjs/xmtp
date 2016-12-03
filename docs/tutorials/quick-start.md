# Quick Start

## Writing Your First XMTP App

The simplest ESMTP server setup imaginable:

```js
const xmtp = require('xmtp');
const app = xmtp();

app.listen(25);
```

## Extending Your First XMTP App

Generally, an XMTP app is structured like this:

```js
const xmtp = require('xmtp');
const app = xmtp();

// Settings
app.set('me', 'localhost');

// Plugins
app.plugin('auth', {
	methods: ['PLAIN', 'LOGIN'],
	async onAuth({ username, password }) {
		const user = await db.getUser(username, password);

		return user;
	}
});

// Hooks
app.hook('rcpt', async (next, rcpt) => {
	if (rcpt.host === 'mydomain.com') {
		return true;
	}

	return await next();
});

// Events
app.on('listening', server => {
	console.log('Server listening on', server.address());
});

// Listen
app.listen(25);
```

## Running Your First XMTP App

Make sure you run Node.js version 7.0.0 or higher with the `--harmony-async-await` flag. To run with a lower version of Node.js, run your app with Babel and the `es2017` preset.

```bash
$ node --harmony-async-await index.js
```
