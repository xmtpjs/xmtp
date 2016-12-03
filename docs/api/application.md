# Application

## Server

### app.listen([port = 25, [host = '0.0.0.0']])
### app.callback(server)

## Settings

### app.set(key, value)
### app.get(key)

### Available Settings
* `me` - Server name, generally the hostname (default: `localhost`).
* `greeting` - Greeting line (default: `Server`).
* `databytes` - The maximum size in bytes of an email to allow (default: `20 * 1024 * 1024` aka 20 mb).

## Plugins

### app.plugin(name, options)

## Hooks

### app.use(name, callback)
### app.hasHook(name)
### app.hook(name, [...args])

### Available Hooks
* `connect`
 * Parameters - `next`, `conn`
 * Gets called when a new connection enters the server.
* `capabilities`
 * Parameters - `next`, `conn`, `capabilities`
 * Gets called when a new connection enters the server.
* `reset_transaction`
 * Parameters - `next`
 * Gets called when the connection is reset. Usually after an email is queued, the client calls the `RSET` command, or a non-fatal error occurs.
* `disconnect`
 * Parameters - `next`
 * Gets called immediately before disconnection. A useful place for plugins to clean up.
* `unrecognized_cmd`
 * Parameters - `next`, `conn`, `line`
 * Gets called when a client command hook isn't available.
* `queue`
 * Parameters - `next`, `conn`
 * Gets called after the client's `DATA` command is done and the email is ready for queueing.
* `queue_ok`
 * Parameters - `next`, `conn`
 * Gets called after an email has successfully been queued.

### Command Hooks
When the client calls an SMTP command, they are passed through the hook stack with a `cmd_` prefix. Usually these hooks aren't used outside of the XMTP core library, but are available.

* `cmd_helo`
* `cmd_ehlo`
* `cmd_mail`
* `cmd_rcpt`
* `cmd_data`
* `cmd_rset`
* `cmd_quit`
* `cmd_help`
* `cmd_noop`
* `cmd_vrfy`
* `cmd_auth` (handled by AUTH plugin)
* `cmd_starttls` (handled by STARTTLS plugin)

With each client command, the library looks for a command hook (prefixed with `cmd_`). If one is not present, the `unrecognized_cmd` hook is called.
