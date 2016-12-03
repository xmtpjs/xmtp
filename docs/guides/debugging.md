# Debugging

XMTP uses the [`debug`](https://www.npmjs.com/package/debug) module, which provides simple conditional logging, and prefixes all debugging with `xmtp:`.

In order to activate debug logs, use the `DEBUG` environment variable, like so:

```bash
$ DEBUG=xmtp:* node index.js
xmtp:protocol Loading protocol handler "cmd_data" +0ms
xmtp:protocol Loading protocol handler "cmd_ehlo" +2ms
xmtp:protocol Loading protocol handler "cmd_helo" +2ms
xmtp:protocol Loading protocol handler "cmd_help" +0ms
xmtp:protocol Loading protocol handler "cmd_mail" +1ms
xmtp:protocol Loading protocol handler "cmd_noop" +1ms
xmtp:protocol Loading protocol handler "cmd_quit" +0ms
xmtp:protocol Loading protocol handler "cmd_rcpt" +1ms
xmtp:protocol Loading protocol handler "cmd_rset" +0ms
xmtp:protocol Loading protocol handler "cmd_vrfy" +1ms
xmtp:protocol Loading protocol handler "connect" +0ms
xmtp:protocol Loading protocol handler "queue" +0ms
xmtp:protocol Loading protocol handler "queue_ok" +1ms
xmtp:application use cmd_data +1ms
xmtp:application use cmd_ehlo +0ms
xmtp:application use cmd_helo +0ms
xmtp:application use cmd_help +1ms
xmtp:application use cmd_mail +0ms
xmtp:application use cmd_noop +0ms
xmtp:application use cmd_quit +0ms
xmtp:application use cmd_rcpt +0ms
xmtp:application use cmd_rset +0ms
xmtp:application use cmd_vrfy +0ms
xmtp:application use connect +0ms
xmtp:application use queue +0ms
xmtp:application use queue_ok +0ms
xmtp:application plugin auth +1ms
xmtp:plugin:auth Loading auth method handler "CRAM-MD5" +0ms
xmtp:plugin:auth Loading auth method handler "DIGEST-MD5" +1ms
xmtp:plugin:auth Loading auth method handler "LOGIN" +1ms
xmtp:plugin:auth Loading auth method handler "PLAIN" +0ms
xmtp:application use auth_PLAIN +6ms
xmtp:application use auth_LOGIN +0ms
xmtp:application use capabilities +0ms
xmtp:application use auth +0ms
xmtp:application use cmd_auth +0ms
xmtp:application plugin starttls +0ms
xmtp:application use capabilities +19ms
xmtp:application use cmd_starttls +1ms
xmtp:application listen +2ms
xmtp:application Listening on 0.0.0.0:2525 +7ms
xmtp:connection connect ip=127.0.0.1 port=53716 +7s
xmtp:connection S: 220 localhost ESMTP Server +2ms
xmtp:connection C: EHLO server.com +6s
xmtp:connection S: 250-localhost +1ms
xmtp:connection S: 250-PIPELINING +0ms
xmtp:connection S: 250-8BITMIME +0ms
xmtp:connection S: 250-SIZE 20971520 +0ms
xmtp:connection S: 250 STARTTLS +0ms
xmtp:connection C: MAIL FROM:<user@server.com> +11s
xmtp:connection S: 250 OK +2ms
xmtp:connection C: RCPT TO:<user@client.com> +7s
xmtp:connection S: 250 OK +1ms
```

It is suggested that XMTP plugins use the `xmtp:plugin:` prefix. View the [`xmtp-plugin-auth`](https://github.com/xmtpjs/xmtp/blob/master/packages/xmtp-plugin-auth/src/index.js) and [`xmtp-plugin-starttls`](https://github.com/xmtpjs/xmtp/blob/master/packages/xmtp-plugin-starttls/src/index.js) plugins.

For more information on how to take advantage of the `DEBUG` environment variable, [view the `debug` module documentation](https://www.npmjs.com/package/debug).
