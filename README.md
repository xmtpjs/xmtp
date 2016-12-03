# Extensible ESMTP Server

Use Node.js v7+ (with `--harmony-async-await` flag).

## Install
```bash
$ npm install --save xmtp-core
```

## Usage
```js
// $ node --harmony-async-await index.js
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

**SMTP Commands:**
- [x] **HELO**
- [x] **EHLO**
- [x] **MAIL**
- [x] **RCPT**
- [x] **DATA**
- [x] **RSET**
- [x] **VRFY**
- [x] **NOOP**
- [x] **HELP**
- [x] **QUIT**
- [x] [**AUTH**](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-auth) (plugin)
- [x] [**STARTTLS**](https://github.com/xmtpjs/xmtp/tree/master/packages/xmtp-plugin-starttls) (plugin)
- [ ] **PROXY** (plugin, wip)

**SMTP Extensions:**

| Supported / Planned                       | No Planned Support                              |
|-------------------------------------------|-------------------------------------------------|
| <ul><li>[x] 8BITMIME</li></ul>            | <ul><li>[ ] ATRN</li></ul>                      |
| <ul><li>[x] AUTH</li></ul>                | <ul><li>[ ] CHECKPOINT</li></ul>                |
| <ul><li>[x] AUTH=</li></ul>               | <ul><li>[ ] ENHANGEDSTATUSCODES [sic]</li></ul> |
| <ul><li>[ ] BINARYMIME</li></ul>          | <ul><li>[ ] ETRN</li></ul>                      |
| <ul><li>[ ] BURL</li></ul>                | <ul><li>[ ] EXPN</li></ul>                      |
| <ul><li>[ ] CHUNKING</li></ul>            | <ul><li>[ ] SAML</li></ul>                      |
| <ul><li>[ ] DSN (wip)</li></ul>           | <ul><li>[ ] SEND</li></ul>                      |
| <ul><li>[ ] ENHANCEDSTATUSCODES</li></ul>	| <ul><li>[ ] SOML</li></ul>                      |
| <ul><li>[x] PIPELINING</li></ul>          | <ul><li>[ ] TIME</li></ul>                      |
| <ul><li>[x] SIZE</li></ul>                | <ul><li>[ ] TURN</li></ul>                      |
| <ul><li>[ ] SMTPUTF8</li></ul>            | <ul><li>[ ] VERB</li></ul>                      |
| <ul><li>[x] STARTTLS</li></ul>            | <ul><li>[ ] X-EXPS</li></ul>                    |
|                                           | <ul><li>[ ] X-EXPS=</li></ul>                   |
|                                           | <ul><li>[ ] X-LINK2STATE</li></ul>              |
|                                           | <ul><li>[ ] X-RCPTLIMIT</li></ul>               |
|                                           | <ul><li>[ ] X-TURNME</li></ul>                  |
|                                           | <ul><li>[ ] XEXCH50</li></ul>                   |
|                                           | <ul><li>[ ] XUSER</li></ul>                     |
|                                           | <ul><li>[ ] XSHADOW</li></ul>                   |

 *wip = work in progress
