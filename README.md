<p align="center">
	<img alt="XMTP" src="./.github/logo.png" width="400" />
</p>

<p align="center">⚡️ The Extensible ESMTP Server</p>

## Install
```bash
$ npm install --save xmtp-core
```

## Usage
Two options:
* Use Node.js v7+ with `--harmony-async-await` flag.
* Use Node.js with Babel using `es2017` preset.

```js
const app = require('xmtp-core')();

app.set('me', 'mail.host.com');
app.set('greeting', 'My Server Name');

app.plugin('auth', { ...options });
app.plugin('starttls', { ...options });

app.use('rcpt', async (next, rcpt) => {
	if (rcpt.host === 'host.com') {
		// Allow any @host.com recipient
		return true;
	}

	return await next();
});

app.use('queue', async (next, conn) => {
	// email = { headers, html, text, calendars, attachments }
	const email = conn.transaction.email;

	// Do something with the email (ie. relay, lmtp, save to db, etc...)
});

app.listen(25); // May require sudo privileges.
```

## Documentation

Guides and the API reference are located in the [docs](docs) directory.

## Org Plugins
* [AUTH](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-auth)
* [BINARYMIME + CHUNKING](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-chunking)
* [STARTTLS](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-starttls)

## Community Plugins
<!--
Add your plugin below in the following order:
 * Command plugins (`cmd_*`, ie. AUTH, STARTTLS, etc) at the top.
 * Generic plugins (ie. Queue, Spam) next.
 * "Add your plugin here" link.

If your plugin has the same name/function (ie. Two STARTTLS plugins) as another plugin, then place your plugin after it.
-->
* [*Add your plugin here*](https://github.com/xmtpjs/xmtp/edit/master/README.md)

## SMTP Support

| Supported Commands         | Supported/Planned Extensions              | No Planned Support        |
|----------------------------|-------------------------------------------|---------------------------|
| <ul><li>[x] HELO</li></ul> | <ul><li>[x] 8BITMIME</li></ul>            | ATRN                      |
| <ul><li>[x] EHLO</li></ul> | <ul><li>[x] [AUTH](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-auth) (plugin)</li></ul>           | CHECKPOINT                |
| <ul><li>[x] MAIL</li></ul> | <ul><li>[x] AUTH=</li></ul>               | ENHANGEDSTATUSCODES [sic] |
| <ul><li>[x] RCPT</li></ul> | <ul><li>[x] [BINARYMIME](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-chunking) (plugin)</li></ul> | ETRN                      |
| <ul><li>[x] DATA</li></ul> | <ul><li>[ ] BURL</li></ul>                | EXPN                      |
| <ul><li>[x] RSET</li></ul> | <ul><li>[x] [CHUNKING](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-chunking) (plugin)</li></ul>   | SAML, SEND, SOML          |
| <ul><li>[x] VRFY</li></ul> | <ul><li>[ ] DSN</li></ul>                 | TIME                      |
| <ul><li>[x] NOOP</li></ul> | <ul><li>[ ] ENHANCEDSTATUSCODES</li></ul> | TURN                      |
| <ul><li>[x] HELP</li></ul> | <ul><li>[x] PIPELINING</li></ul>          | VERB                      |
| <ul><li>[x] QUIT</li></ul> | <ul><li>[ ] PROXY (plugin, wip)</li></ul> | X-EXPS                    |
|                            | <ul><li>[x] SIZE</li></ul>                | X-LINK2STATE              |
|                            | <ul><li>[x] SMTPUTF8</li></ul>            | X-RCPTLIMIT               |
|                            | <ul><li>[x] [STARTTLS](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-starttls) (plugin)             | X-TURNME                  |
|                            |                                           | XEXCH50                   |
|                            |                                           | XUSER                     |
|                            |                                           | XSHADOW                   |

*wip = work in progress

## License

[MIT](LICENSE)
