# Extensible SMTP/MX Server

Use Node.js v7+ (with `--harmony-async-await` flag).

Example usage (make sure to `npm install` first):
```js
// $ node --harmony-async-await
const app = require('./src/application.js')();

app.set('me', 'mail.host.com');
app.set('greeting', 'My Server Name');

app.use('rcpt', async (next, rcpt) => {
	if (rcpt.host === 'host.com') {
		return true;
	}

	return await next();
});

app.listen(25); // May require sudo privileges.
```
